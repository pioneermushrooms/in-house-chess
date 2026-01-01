# Stripe Payment Setup Guide

This guide explains how to configure Stripe payment processing for your In-House Chess Club.

## Overview

The chess club uses Stripe to allow players to purchase credits with real money. Players can then wager these credits on games.

## What You Need

You need **3 environment variables** from Stripe:

1. **Secret Key** (starts with `sk_live_...` or `sk_test_...`)
2. **Publishable Key** (starts with `pk_live_...` or `pk_test_...`)
3. **Webhook Secret** (starts with `whsec_...`)

---

## Step 1: Get Your Stripe Keys

### 1.1 Get Secret Key and Publishable Key

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Click **Developers** in the left sidebar
3. Click **API keys**
4. You'll see two keys:
   - **Publishable key** (starts with `pk_live_...`) - Copy this
   - **Secret key** (starts with `sk_live_...`) - Click "Reveal test key" and copy

**Note:** Use **test keys** (starting with `sk_test_` and `pk_test_`) for testing. Use **live keys** only when you're ready for real payments.

### 1.2 Get Webhook Secret

1. Still in Stripe Dashboard → **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Enter your Railway app URL + `/api/stripe/webhook`
   - Example: `https://in-house-chess-production.up.railway.app/api/stripe/webhook`
4. Under "Select events to listen to", choose:
   - `checkout.session.completed`
5. Click **Add endpoint**
6. On the webhook details page, click **Reveal** under "Signing secret"
7. Copy the webhook secret (starts with `whsec_...`)

---

## Step 2: Add Keys to Railway

1. Go to your [Railway Dashboard](https://railway.app/dashboard)
2. Select your **in-house-chess** project
3. Click on your service
4. Go to **Variables** tab
5. Add these 3 environment variables:

```
STRIPE_SECRET_KEY=sk_live_YOUR_SECRET_KEY_HERE
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_PUBLISHABLE_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE
```

6. Click **Add** for each variable
7. Railway will automatically redeploy your app

---

## Step 3: Test the Payment Flow

### 3.1 Test with Stripe Test Mode

If using test keys (`sk_test_...`):

1. Go to your chess club app
2. Click **Buy Credits**
3. Choose a package
4. Use Stripe's test card: `4242 4242 4242 4242`
   - Any future expiry date (e.g., 12/34)
   - Any 3-digit CVC (e.g., 123)
   - Any ZIP code
5. Complete the checkout
6. You should be redirected back to the lobby
7. Your credit balance should increase

### 3.2 Verify Webhook

1. In Stripe Dashboard → **Developers** → **Webhooks**
2. Click on your webhook endpoint
3. Check the **Recent deliveries** section
4. You should see successful `checkout.session.completed` events

---

## How It Works

### Frontend (Buy Credits Page)

1. Player clicks "Buy Credits" in lobby
2. Selects a credit package ($5, $10, $20, or $50)
3. Clicks "Purchase"
4. Backend creates a Stripe Checkout Session
5. Player is redirected to Stripe's secure payment page
6. Player enters card details on Stripe (not on your site)
7. After payment, player is redirected back to your app

### Backend (Webhook Handler)

1. Stripe sends `checkout.session.completed` event to your webhook
2. Your server verifies the webhook signature (security)
3. Extracts player ID and credit amount from metadata
4. Adds credits to player's account in database
5. Player can now use credits to wager on games

---

## Credit Packages

| Package  | Price | Base Credits | Bonus | Total Credits |
|----------|-------|--------------|-------|---------------|
| Starter  | $5    | 100          | 0     | 100           |
| Standard | $10   | 250          | 25    | 275 (10% bonus) |
| Premium  | $20   | 550          | 50    | 600 (10% bonus) |
| Ultimate | $50   | 1200         | 200   | 1400 (20% bonus) |

---

## Troubleshooting

### App crashes on Railway

**Problem:** App won't start after deploying Stripe code.

**Solution:** Make sure all 3 Stripe environment variables are set in Railway. The app will crash if `STRIPE_SECRET_KEY` is missing.

### "Payment system is not configured" error

**Problem:** Clicking "Purchase" shows this error.

**Solution:** `STRIPE_SECRET_KEY` is not set in Railway environment variables.

### Credits not added after payment

**Problem:** Payment succeeds but credits don't appear in account.

**Solution:** Check webhook configuration:
1. Webhook URL is correct (includes `/api/stripe/webhook`)
2. `STRIPE_WEBHOOK_SECRET` is set in Railway
3. Check Railway logs for webhook errors
4. Check Stripe Dashboard → Webhooks → Recent deliveries for failed events

### Webhook signature verification failed

**Problem:** Stripe webhook logs show "Webhook Error: ..."

**Solution:** 
1. Make sure `STRIPE_WEBHOOK_SECRET` matches the signing secret from Stripe Dashboard
2. Don't add quotes around the secret in Railway variables
3. Redeploy after changing the secret

---

## Security Notes

- **Never commit Stripe keys to Git** - Always use environment variables
- **Secret key** is server-side only - Never expose to frontend
- **Publishable key** is safe to expose in browser code
- **Webhook secret** verifies events are from Stripe, not attackers
- Use **test mode** for development, **live mode** for production

---

## Going Live

When ready for real payments:

1. Complete Stripe's business verification (KYC)
2. Switch from test keys to live keys in Railway
3. Update webhook endpoint to use live mode
4. Test with a small real payment
5. Monitor Stripe Dashboard for successful payments

---

## Support

- Stripe Documentation: https://docs.stripe.com/
- Stripe Support: https://support.stripe.com/
- Railway Documentation: https://docs.railway.app/
