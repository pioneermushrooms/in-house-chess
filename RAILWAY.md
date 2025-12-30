# Railway Deployment Guide

This project is optimized for Railway deployment with full WebSocket support.

## Quick Start (5 Minutes)

### Step 1: Connect Railway to GitHub

1. Go to [railway.app](https://railway.app) and sign in with GitHub
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose the `in-house-chess` repository
5. Railway will automatically detect the Node.js project

### Step 2: Add MySQL Database

1. In your Railway project, click **"New"** → **"Database"** → **"MySQL"**
2. Railway automatically sets the `DATABASE_URL` environment variable
3. Wait for the database to provision (~30 seconds)

### Step 3: Set Environment Variables

Click on your service → **"Variables"** tab and add:

**Required:**
```
JWT_SECRET=<generate with: openssl rand -base64 32>
OWNER_OPEN_ID=<your user ID>
OWNER_NAME=<your name>
```

**Optional (for custom branding):**
```
VITE_APP_TITLE=In-House Chess Club
VITE_APP_LOGO=/logo.png
```

**Note:** `DATABASE_URL` is automatically set by Railway when you add MySQL.

### Step 4: Deploy

1. Railway automatically builds and deploys on every git push
2. First deployment takes ~3-5 minutes
3. You'll get a URL like `https://your-app.railway.app`

### Step 5: Run Database Migrations

After first deployment, run migrations:

1. Go to your service → **"Settings"** → **"Deploy"**
2. Or use Railway CLI:
   ```bash
   railway run pnpm db:push
   ```

### Step 6: Custom Domain (Optional)

1. Go to **"Settings"** → **"Domains"**
2. Click **"Generate Domain"** for a free `.railway.app` subdomain
3. Or add your custom domain

---

## Environment Variables Reference

### Required Variables

| Variable | Description | How to Get |
|----------|-------------|------------|
| `DATABASE_URL` | MySQL connection string | Auto-set by Railway MySQL |
| `JWT_SECRET` | Session signing secret | `openssl rand -base64 32` |
| `OWNER_OPEN_ID` | Your user ID | Your Manus user ID or any unique ID |
| `OWNER_NAME` | Your name | Your display name |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_APP_TITLE` | App title | "In-House Chess Club" |
| `VITE_APP_LOGO` | Logo path | "/logo.png" |
| `PORT` | Server port | 3000 (Railway sets this) |

---

## Automatic Deployments

Railway automatically deploys when you push to GitHub:

```bash
git add .
git commit -m "Update chess app"
git push origin main
```

Railway detects the push and redeploys (~2-3 minutes).

---

## Railway Configuration

The project includes `railway.json` with optimized settings:

- **Build:** `pnpm install && pnpm run build`
- **Start:** `pnpm start`
- **Restart Policy:** On failure, max 10 retries
- **Builder:** Nixpacks (auto-detected)

---

## Monitoring

### View Logs
1. Go to your service in Railway
2. Click **"Deployments"** tab
3. Click on a deployment to see logs

### Check Metrics
1. Click **"Metrics"** tab
2. View CPU, memory, and network usage

---

## Troubleshooting

### Build Fails

**Error:** `pnpm: command not found`
- Railway should auto-detect pnpm from `package.json`
- If not, add to `railway.json`: `"nixpacksPlan": { "providers": ["pnpm"] }`

**Error:** `TypeScript errors`
- Check the logs for specific errors
- Fix in code and push again

### Database Connection Fails

**Error:** `ECONNREFUSED` or `Cannot connect to database`
- Verify MySQL database is running in Railway
- Check `DATABASE_URL` is set correctly
- Make sure you ran `pnpm db:push` to create tables

### WebSocket Connection Fails

**Error:** `WebSocket connection failed`
- Railway supports WebSockets by default
- Make sure you're using `wss://` (not `ws://`) in production
- Check that the Socket.IO server is starting (view logs)

### App Crashes on Start

**Error:** `Error: Cannot find module`
- Make sure `pnpm run build` completed successfully
- Check that all dependencies are in `package.json`
- View deployment logs for specific error

---

## Cost Estimate

Railway charges based on usage:

- **Hobby Plan:** $5/month for 500 hours
- **MySQL Database:** Included in usage
- **Bandwidth:** 100GB included

For a small chess club (10-20 users):
- **Estimated cost:** $5-10/month

---

## Scaling

Railway automatically handles:
- ✅ WebSocket connections
- ✅ HTTPS/SSL certificates
- ✅ Auto-restart on crashes
- ✅ Environment variables
- ✅ Database backups

For more users, Railway scales horizontally (add more instances).

---

## Alternative: Render

If you prefer a free option, see `DEPLOYMENT.md` for Render instructions.
Render also supports WebSockets but has a free tier with limitations (slower cold starts).

---

## Support

- Railway Docs: [docs.railway.app](https://docs.railway.app)
- Railway Discord: [discord.gg/railway](https://discord.gg/railway)
- Project Issues: GitHub Issues tab

---

## Next Steps After Deployment

1. ✅ Test the deployed app
2. ✅ Create a player profile
3. ✅ Play a test game with a friend
4. ✅ Verify stats update correctly
5. ✅ Set up custom domain (optional)
6. ✅ Share with your coworkers!
