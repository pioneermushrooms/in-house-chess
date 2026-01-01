import { Router } from "express";
import Stripe from "stripe";
import * as db from "./db";

// Initialize Stripe only if secret key is available
let stripe: Stripe | null = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-12-15.clover",
  });
}

const router = Router();

// Stripe webhook endpoint - MUST use raw body for signature verification
router.post("/api/stripe/webhook", async (req, res) => {
  const sig = req.headers["stripe-signature"];

  if (!sig) {
    console.error("[Stripe Webhook] Missing stripe-signature header");
    return res.status(400).send("Missing signature");
  }

  if (!stripe) {
    console.error("[Stripe Webhook] Stripe not initialized - missing STRIPE_SECRET_KEY");
    return res.status(500).send("Stripe not configured");
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error(`[Stripe Webhook] Signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log(`[Stripe Webhook] Received event: ${event.type} (${event.id})`);

  // Handle test events
  if (event.id.startsWith('evt_test_')) {
    console.log("[Stripe Webhook] Test event detected, returning verification response");
    return res.json({ 
      verified: true,
    });
  }

  // Handle the event
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log(`[Stripe Webhook] Checkout session completed: ${session.id}`);
        console.log(`[Stripe Webhook] Metadata:`, session.metadata);

        // Extract metadata
        const playerId = parseInt(session.metadata?.player_id || "0");
        const credits = parseInt(session.metadata?.credits || "0");
        const packageId = session.metadata?.package_id || "unknown";

        if (!playerId || !credits) {
          console.error("[Stripe Webhook] Missing playerId or credits in metadata");
          return res.status(400).send("Missing required metadata");
        }

        // Add credits to player account
        await db.addCredits(
          playerId,
          credits,
          `Purchased ${credits} credits (${packageId} package) via Stripe`
        );

        console.log(`[Stripe Webhook] Added ${credits} credits to player ${playerId}`);
        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log(`[Stripe Webhook] Payment intent succeeded: ${paymentIntent.id}`);
        // Payment is confirmed, credits already added in checkout.session.completed
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.error(`[Stripe Webhook] Payment failed: ${paymentIntent.id}`);
        // Could notify user or log the failure
        break;
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error: any) {
    console.error(`[Stripe Webhook] Error processing event: ${error.message}`);
    res.status(500).send(`Webhook processing error: ${error.message}`);
  }
});

export default router;
