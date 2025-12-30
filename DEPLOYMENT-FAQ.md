# Deployment FAQ

## How do I download the files for V1 (local deployment)?

### Option 1: Download from Manus Management UI (Easiest)

1. Open your Manus project in the browser
2. Click on the **Code** panel in the Management UI (right sidebar)
3. Click the **"Download All Files"** button at the top
4. Extract the ZIP file on your local machine
5. Follow the instructions in `README-LOCAL.md`

### Option 2: Use Git (if you connected GitHub)

If you've connected your Manus project to GitHub:

```bash
git clone https://github.com/YOUR_USERNAME/in-house-chess.git
cd in-house-chess
./start-local.sh
```

### Option 3: Manual Download via Browser DevTools

1. Open the Manus preview URL in your browser
2. Open DevTools (F12) → Network tab
3. Download key files manually (not recommended, use Option 1 instead)

---

## Is Railway the best option for V2?

**Yes, Railway is recommended for most users** because:

✅ **Pros:**
- Full WebSocket support out of the box
- Simple deployment process (connect GitHub → deploy)
- Automatic HTTPS with custom domains
- $5/month for hobby projects
- Great developer experience
- Automatic deployments on git push

❌ **Cons:**
- Not free (but very affordable)
- Requires credit card even for trial

### Alternative Options:

| Platform | WebSocket Support | Free Tier | Ease of Use | Best For |
|----------|------------------|-----------|-------------|----------|
| **Railway** | ✅ Yes | No ($5/mo) | ⭐⭐⭐⭐⭐ | Recommended |
| **Render** | ✅ Yes | Yes (limited) | ⭐⭐⭐⭐ | Budget-conscious |
| **DigitalOcean** | ✅ Yes | No ($5/mo) | ⭐⭐⭐⭐ | Reliable |
| **Fly.io** | ✅ Yes | Yes (limited) | ⭐⭐⭐ | Tech-savvy users |
| **Vercel** | ❌ No* | Yes | ⭐⭐⭐⭐⭐ | Static sites only |
| **Netlify** | ❌ No* | Yes | ⭐⭐⭐⭐⭐ | Static sites only |

*Vercel and Netlify don't support long-lived WebSocket connections needed for real-time chess

---

## Can I hook up Manus to Railway to deploy automatically?

**Not directly**, but here's the workflow:

### Current Best Practice:

1. **Download files from Manus** (see Option 1 above)
2. **Push to GitHub:**
   ```bash
   cd in-house-chess
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/in-house-chess.git
   git push -u origin main
   ```

3. **Connect Railway to GitHub:**
   - Go to [railway.app](https://railway.app)
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository
   - Railway will auto-detect Node.js and deploy

4. **Set environment variables in Railway:**
   - Go to your project → Variables
   - Add all required env vars (DATABASE_URL, JWT_SECRET, etc.)

5. **Add MySQL database in Railway:**
   - Click "New" → "Database" → "MySQL"
   - Railway will automatically set DATABASE_URL

### Future Updates:

When you make changes in Manus:
1. Download updated files
2. Commit and push to GitHub
3. Railway automatically redeploys

---

## Can Manus auto-deploy to Vercel with full WebSocket integration?

**No, Vercel doesn't support WebSocket connections** needed for real-time chess gameplay.

### Why Vercel Won't Work:

- **Vercel is designed for serverless functions** with short execution times (10-60 seconds)
- **WebSocket connections are long-lived** (can last hours during a chess game)
- **Vercel's architecture doesn't support persistent connections**

### What About Vercel + External WebSocket Server?

You *could* split the architecture:
- Frontend on Vercel (static site)
- Backend + WebSocket on Railway/Render

But this adds complexity and isn't recommended for this project.

---

## Recommended Deployment Path

### For V1 (Coworkers on Local Network):

```bash
# On your machine or local server
cd in-house-chess
./start-local.sh

# Share this URL with coworkers:
# http://YOUR_LOCAL_IP:3000
```

**Pros:** Free, works perfectly, no external dependencies
**Cons:** Requires your machine to stay on, only works on local network

---

### For V2 (Production with External Access):

#### Step 1: Download from Manus
Use the Code panel → Download All Files

#### Step 2: Push to GitHub
```bash
git init
git add .
git commit -m "In-House Chess Club"
git remote add origin https://github.com/YOUR_USERNAME/in-house-chess.git
git push -u origin main
```

#### Step 3: Deploy to Railway
1. Go to [railway.app](https://railway.app) and sign in with GitHub
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Add MySQL database: "New" → "Database" → "MySQL"
5. Set environment variables:
   ```
   JWT_SECRET=your-random-secret-key
   OWNER_OPEN_ID=your-id
   OWNER_NAME=Your Name
   VITE_APP_TITLE=In-House Chess Club
   ```
6. Railway will automatically deploy!

#### Step 4: Set Up Custom Domain (Optional)
- Railway provides a free `.railway.app` subdomain
- Or connect your own domain in Settings → Domains

---

## Environment Variables Needed for Deployment

### Required:
```env
DATABASE_URL=mysql://user:password@host:3306/database
JWT_SECRET=random-secret-key-here
OWNER_OPEN_ID=your-user-id
OWNER_NAME=Your Name
```

### Optional:
```env
VITE_APP_TITLE=In-House Chess Club
VITE_APP_LOGO=/logo.png
PORT=3000
```

### How to Generate JWT_SECRET:
```bash
# On Mac/Linux:
openssl rand -base64 32

# Or in Node.js:
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## Cost Comparison

| Deployment Option | Monthly Cost | Setup Time | Maintenance |
|------------------|--------------|------------|-------------|
| Local Network (V1) | $0 | 5 minutes | Low |
| Railway | $5 | 10 minutes | Very Low |
| Render (Free) | $0 | 15 minutes | Low |
| DigitalOcean | $5 | 20 minutes | Medium |
| AWS/GCP | $5-20+ | 1-2 hours | High |

---

## Quick Start Commands

### Local Deployment:
```bash
./start-local.sh
```

### Railway Deployment:
```bash
# After connecting to GitHub, Railway auto-deploys
# Just push changes:
git add .
git commit -m "Update"
git push
```

### Manual Production Build:
```bash
pnpm install
pnpm run build
NODE_ENV=production pnpm start
```

---

## Troubleshooting

### "WebSocket connection failed" on Vercel/Netlify
→ These platforms don't support WebSockets. Use Railway/Render instead.

### "Can't download files from Manus"
→ Use the Code panel in Management UI → Download All Files button

### "Railway deployment fails"
→ Check environment variables are set correctly
→ Make sure DATABASE_URL is configured
→ Check Railway logs for specific errors

### "Database connection error"
→ Verify DATABASE_URL format: `mysql://user:password@host:3306/database`
→ Check database is running and accessible
→ For Railway MySQL, use the auto-generated DATABASE_URL

---

## Next Steps

1. ✅ **Test locally first** - Make sure everything works on your machine
2. ✅ **Share with coworkers** - Use local network deployment (V1)
3. ✅ **When ready for external access** - Deploy to Railway (V2)
4. ✅ **Set up custom domain** - Make it look professional
5. ✅ **Monitor and iterate** - Add features based on feedback

---

## Support

If you need help:
- Check `DEPLOYMENT.md` for detailed instructions
- Check `README-LOCAL.md` for local setup
- Review Railway's documentation at [docs.railway.app](https://docs.railway.app)
- Check GitHub Issues if you encounter bugs
