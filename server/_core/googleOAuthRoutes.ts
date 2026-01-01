/**
 * Google OAuth Routes
 * Handles /api/oauth/google/* endpoints
 */

import type { Express, Request, Response } from "express";
import { handleGoogleCallback, getGoogleAuthUrl, isGoogleOAuthConfigured } from "./googleOAuth.js";
import { getOrCreateUserByEmail } from "../db.js";
import { getSessionCookieOptions } from "./cookies.js";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { sdk } from "./sdk.js";

export function setupGoogleOAuthRoutes(app: Express) {
  if (!isGoogleOAuthConfigured()) {
    console.log("[Google OAuth] Not configured - skipping route registration");
    return;
  }

  console.log("[Google OAuth] Registering routes...");

  // Initiate Google OAuth flow
  app.get("/api/oauth/google/login", (req: Request, res: Response) => {
    try {
      // Force HTTPS for production (Railway uses reverse proxy, so req.protocol is 'http')
      const protocol = req.get('x-forwarded-proto') || req.protocol;
      const redirectUri = `${protocol}://${req.get("host")}/api/oauth/google/callback`;
      const authUrl = getGoogleAuthUrl(redirectUri);
      res.redirect(authUrl);
    } catch (error) {
      console.error("[Google OAuth] Login error:", error);
      res.status(500).send("OAuth configuration error");
    }
  });

  // Handle Google OAuth callback
  app.get("/api/oauth/google/callback", async (req: Request, res: Response) => {
    const { code, error } = req.query;

    if (error) {
      console.error("[Google OAuth] Callback error:", error);
      return res.redirect("/?error=oauth_failed");
    }

    if (!code || typeof code !== "string") {
      console.error("[Google OAuth] Missing authorization code");
      return res.redirect("/?error=missing_code");
    }

    try {
      // Force HTTPS for production (Railway uses reverse proxy, so req.protocol is 'http')
      const protocol = req.get('x-forwarded-proto') || req.protocol;
      const redirectUri = `${protocol}://${req.get("host")}/api/oauth/google/callback`;
      
      // Exchange code for user info
      const googleUser = await handleGoogleCallback(code, redirectUri);

      console.log("[Google OAuth] User authenticated:", googleUser.email);

      // Get or create user in database
      const user = await getOrCreateUserByEmail({
        email: googleUser.email,
        name: googleUser.name,
        avatarUrl: googleUser.picture,
        googleId: googleUser.id,
      });

      // Set simple session cookie (store googleId as session identifier)
      const sessionId = user.googleId || `user_${user.id}`;
      console.log("[Google OAuth] Setting session cookie:", sessionId);
      console.log("[Google OAuth] User created/updated:", { id: user.id, email: user.email, googleId: user.googleId });
      
      const cookieOptions = getSessionCookieOptions(req);
      console.log("[Google OAuth] Cookie options:", JSON.stringify(cookieOptions));
      res.cookie(COOKIE_NAME, sessionId, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      console.log("[Google OAuth] Cookie set, redirecting to /");

      // Redirect to home page (which will redirect to lobby)
      res.redirect("/");
    } catch (error) {
      console.error("[Google OAuth] Callback processing error:", error);
      res.redirect("/?error=auth_failed");
    }
  });

  console.log("[Google OAuth] Routes registered:");
  console.log("  - GET /api/oauth/google/login");
  console.log("  - GET /api/oauth/google/callback");
}
