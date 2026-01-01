# Railway OAuth Environment Variables

## Problem
OAuth works in Manus preview but not on Railway because Railway is missing the OAuth environment variables that Manus automatically injects.

## Solution
Add these environment variables to your Railway project:

### Required OAuth Variables

```bash
# Manus OAuth Server URL
OAUTH_SERVER_URL=https://api.manus.im

# Your Manus Project OAuth App ID
# Get this from: Manus Project Settings → General → App ID
VITE_APP_ID=your-manus-project-app-id

# JWT Secret for signing session tokens
# Get this from: Manus Project Settings → Secrets → JWT_SECRET
# Or generate a new one: openssl rand -base64 32
JWT_SECRET=your-jwt-secret-here

# Manus OAuth Portal URL (for frontend login button)
VITE_OAUTH_PORTAL_URL=https://manus.im/oauth/app-auth
```

### How to Add to Railway

1. Go to Railway dashboard → Your project
2. Click on your service
3. Go to "Variables" tab
4. Click "New Variable" for each one above
5. Save and redeploy

### Where to Find Your Values

**VITE_APP_ID:**
- In Manus, go to your "In-House Chess" project
- Settings → General → look for "App ID" or "Project ID"
- Should look like: `YujM2eaUTH9HssyoXDzdwz` or similar

**JWT_SECRET:**
- In Manus, go to Settings → Secrets
- Look for `JWT_SECRET`
- Copy the value
- OR generate a new one: `openssl rand -base64 32`

**OAUTH_SERVER_URL** and **VITE_OAUTH_PORTAL_URL:**
- These are Manus standard URLs (already provided above)

### Verify It Works

After adding these variables and redeploying:

1. Visit: `https://in-house-chess-production.up.railway.app`
2. Click "Sign in with Manus"
3. Should redirect to Manus OAuth page
4. After login, should redirect back and show your lobby

### Troubleshooting

If you still see "missing session cookie":
- Check Railway logs for: `[OAuth] OAuth routes disabled - running in guest mode`
- If you see this, `OAUTH_SERVER_URL` is not set correctly
- Make sure there are no trailing slashes or extra spaces in the env vars
