# In-House Chess Club - Deployment Guide

## V1: Local Network Deployment (Recommended for Coworkers)

Since WebSocket support is not currently available in Manus production hosting, you can run this application on your local network where it works perfectly.

### Option 1: Run on Your Development Machine

**Step 1: Get your local IP address**

On Mac/Linux:
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

On Windows:
```bash
ipconfig
```

Look for your local IP (usually starts with `192.168.x.x` or `10.x.x.x`)

**Step 2: Start the server**

```bash
cd in-house-chess
pnpm install
pnpm run build
NODE_ENV=production pnpm start
```

**Step 3: Share the URL with coworkers**

They can access it at: `http://YOUR_LOCAL_IP:3000`

Example: `http://192.168.1.100:3000`

**Important Notes:**
- Your machine must stay on and connected to the network
- Coworkers must be on the same network (office WiFi)
- Make sure your firewall allows incoming connections on port 3000

---

### Option 2: Deploy to a Local Server (Recommended for Always-On)

If you have a spare computer, Raspberry Pi, or local server:

**Step 1: Clone the repository**

```bash
git clone <your-repo-url>
cd in-house-chess
```

**Step 2: Set up environment variables**

Create a `.env` file with your database and auth credentials:

```env
DATABASE_URL=mysql://user:password@localhost:3306/chess_db
JWT_SECRET=your-secret-key-here
OWNER_OPEN_ID=your-owner-id
OWNER_NAME=your-name
# ... other env vars from Manus
```

**Step 3: Install dependencies and build**

```bash
pnpm install
pnpm run build
```

**Step 4: Set up as a system service (Linux)**

Create `/etc/systemd/system/chess-club.service`:

```ini
[Unit]
Description=In-House Chess Club
After=network.target

[Service]
Type=simple
User=your-username
WorkingDirectory=/path/to/in-house-chess
ExecStart=/usr/bin/pnpm start
Restart=always
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable chess-club
sudo systemctl start chess-club
```

---

### Option 3: Expose via Tunneling (For Remote Access)

If coworkers need access from outside the office network:

**Using ngrok:**

```bash
# Install ngrok from https://ngrok.com/
ngrok http 3000
```

This gives you a public URL like `https://abc123.ngrok.io` that anyone can access.

**Note:** Free ngrok URLs change each time you restart. For a permanent URL, you need a paid plan.

---

### Option 4: Deploy to External Hosting (V2)

For a production-ready deployment with WebSocket support, consider:

1. **DigitalOcean App Platform** - $5/month, supports WebSockets
2. **Railway** - Simple deployment, WebSocket support included
3. **Render** - Free tier available, WebSocket support
4. **AWS/GCP/Azure** - Full control, requires more setup

**Deployment steps for Railway (recommended):**

1. Push your code to GitHub
2. Connect Railway to your GitHub repo
3. Add environment variables in Railway dashboard
4. Deploy - Railway automatically detects Node.js and builds

---

## Database Setup

You'll need a MySQL database. Options:

1. **Local MySQL** - Install on the same machine
2. **PlanetScale** - Free tier, cloud MySQL
3. **Railway MySQL** - $5/month, managed database

Run migrations:
```bash
pnpm db:push
```

---

## Environment Variables Required

```env
DATABASE_URL=mysql://...
JWT_SECRET=random-secret-key
OWNER_OPEN_ID=your-id
OWNER_NAME=Your Name
VITE_APP_TITLE=In-House Chess Club
```

For OAuth, you'll need to set up your own OAuth provider or use a simpler auth system.

---

## Troubleshooting

**Port already in use:**
```bash
# Find process using port 3000
lsof -i :3000
# Kill it
kill -9 <PID>
```

**Can't connect from other devices:**
- Check firewall settings
- Ensure devices are on same network
- Try disabling firewall temporarily to test

**WebSocket connection fails:**
- Make sure you're using HTTP (not HTTPS) for local deployment
- Check that Socket.IO server is running (you should see logs)
- Verify no proxy/VPN is interfering

---

## Production Checklist

- [ ] Database is set up and migrations are run
- [ ] Environment variables are configured
- [ ] Server is running and accessible
- [ ] WebSocket connections work (test with two browsers)
- [ ] Game creation and joining works
- [ ] Moves sync in real-time
- [ ] Rating updates after games complete

---

## Support

If you encounter issues, check:
1. Server logs for errors
2. Browser console for client-side errors
3. Database connection
4. Network connectivity

The application works perfectly on localhost and local networks - the only limitation is Manus production hosting doesn't currently support WebSockets.
