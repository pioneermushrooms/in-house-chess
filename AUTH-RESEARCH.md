# Authentication Research for Railway Deployment

## Problem
Manus OAuth works in Manus preview but fails on Railway (404 error). Guest mode with cookies is not secure enough for financial transactions (credits/money).

## Requirements
1. **Persistent accounts** - users can log back in from any device
2. **Secure** - can't be spoofed or stolen easily
3. **Tied to real identity** - for financial transactions
4. **Recovery** - users can reset password/recover account
5. **Never lose credits** - account must be recoverable

## Research Findings

### Option 1: Google OAuth (RECOMMENDED)
**Pros:**
- ✅ Works perfectly on Railway (confirmed by multiple sources)
- ✅ Enterprise-grade security with Google's infrastructure
- ✅ Users can recover accounts via Google
- ✅ Multi-factor authentication built-in
- ✅ Familiar login flow (most users have Google accounts)
- ✅ Free to implement
- ✅ Persistent identity tied to email

**Implementation:**
1. Create Google Cloud project (free)
2. Set up OAuth 2.0 credentials
3. Add environment variables to Railway:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `OAUTH_PROVIDER_URL=https://accounts.google.com/.well-known/openid-configuration`
4. Configure callback URL: `https://your-railway-app.railway.app/api/oauth/callback`

**Security for Credits:**
- User identity tied to Google email (permanent)
- Can't lose account unless they lose Google account
- Google handles password resets, 2FA, etc.
- Email is unique identifier in database

### Option 2: GitHub OAuth
**Pros:**
- ✅ Works on Railway
- ✅ Good for developer-focused apps
- ✅ Similar security to Google

**Cons:**
- ❌ Less universal than Google (not everyone has GitHub)
- ❌ Less suitable for general public

### Option 3: Email/Password (Custom Auth)
**Pros:**
- ✅ Full control
- ✅ No third-party dependencies

**Cons:**
- ❌ Must implement password reset flow
- ❌ Must implement email verification
- ❌ Must handle password security (hashing, salting)
- ❌ More work to implement
- ❌ Users must remember another password

### Option 4: Manus OAuth (Current)
**Status:** Does NOT work on external hosting (Railway)
**Reason:** Manus OAuth is designed for Manus-hosted apps only

## Recommendation

**Implement Google OAuth** for Railway deployment:

1. **Best security** - Google's infrastructure
2. **Best user experience** - most people have Google accounts
3. **Best for financial app** - permanent identity tied to email
4. **Easiest to implement** - well-documented, proven on Railway
5. **Account recovery** - handled by Google

## Implementation Plan

### Phase 1: Set up Google OAuth
1. Create Google Cloud project
2. Configure OAuth 2.0 credentials
3. Add callback URL for Railway domain

### Phase 2: Update Code
1. Add Google OAuth provider to server
2. Update login UI to show "Sign in with Google"
3. Keep Manus OAuth for Manus preview (detect environment)

### Phase 3: Database
1. Store user's Google email as unique identifier
2. Link credits to email (not cookie)
3. Add `googleId` field to user table

### Phase 4: Testing
1. Test login flow on Railway
2. Test account persistence across browsers
3. Test credit balance persistence
4. Test account recovery

## Cost
**FREE** - Google OAuth is free for most use cases (up to 10,000 users)

## Timeline
**2-3 hours** to implement and test

## References
- [Google OAuth on Railway Guide](https://medium.com/@bytechie/strengthen-openwebui-security-on-railway-with-google-oauth-full-integration-walkthrough-b1a0d0e56ce9)
- [Railway OAuth Proxy](https://railway.com/deploy/RfKH-J)
- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
