# 🎮 In-House Chess Club - Quick Start for Local Network

## TL;DR - Get Started in 2 Minutes

```bash
./start-local.sh
```

That's it! Share the URL shown with your coworkers.

---

## What This Is

A private chess club application for playing real-time chess games with your coworkers. Features:

- ♟️ Real-time two-player chess with WebSocket synchronization
- 📊 Elo rating system with leaderboard
- 🎯 Quick Play matchmaking
- 🔗 Shareable invite links for games
- ⏱️ Game clocks with timeout detection
- 🎵 Move sound effects
- 📝 Move history and captured pieces display

---

## Requirements

- **Node.js** 18+ (check with `node --version`)
- **pnpm** (install with `npm install -g pnpm`)
- **MySQL database** (local or cloud)
- **Same network** - All players must be on the same WiFi/LAN

---

## First-Time Setup

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Set Up Database

Create a MySQL database and run migrations:

```bash
# Edit .env file with your database URL
echo "DATABASE_URL=mysql://user:password@localhost:3306/chess_db" > .env

# Run migrations
pnpm db:push
```

### 3. Configure Environment

Copy the environment variables from your Manus project or set up minimal config:

```env
DATABASE_URL=mysql://...
JWT_SECRET=your-random-secret-key
OWNER_OPEN_ID=your-id
OWNER_NAME=Your Name
VITE_APP_TITLE=In-House Chess Club
```

### 4. Start the Server

```bash
./start-local.sh
```

---

## For Your Coworkers

1. Make sure you're on the same WiFi network
2. Open your browser and go to: `http://YOUR_COLLEAGUES_IP:3000`
3. Create a player profile (choose an alias)
4. Start playing!

---

## How to Play

### Create a Game
1. Click "Create Invite Link" in the lobby
2. Share the link with a coworker
3. Wait for them to join

### Quick Play
1. Click "Find Match" 
2. Get automatically paired with someone of similar rating
3. Game starts when both players are ready

### Practice Mode
- Click "Practice Mode" to test the board
- Play both sides locally
- Perfect for learning chess rules

---

## Troubleshooting

**"Can't connect to server"**
- Make sure the server is running (terminal window is open)
- Check you're on the same network
- Try accessing via `http://localhost:3000` first

**"WebSocket connection failed"**
- This is normal in Manus production hosting (not supported yet)
- Works perfectly on local network!

**"Database connection error"**
- Check your DATABASE_URL in .env
- Make sure MySQL is running
- Verify credentials are correct

**"Port 3000 already in use"**
```bash
# Find what's using port 3000
lsof -i :3000
# Kill it
kill -9 <PID>
```

---

## Keeping It Running 24/7

### Option 1: Use PM2 (Recommended)

```bash
# Install PM2
npm install -g pm2

# Start the app
pm2 start "pnpm start" --name chess-club

# Make it start on boot
pm2 startup
pm2 save
```

### Option 2: Use systemd (Linux)

See `DEPLOYMENT.md` for detailed instructions.

---

## Upgrading to V2 (External Hosting)

When you're ready to deploy outside your local network:

**Recommended platforms with WebSocket support:**
- Railway (easiest, $5/month)
- DigitalOcean App Platform
- Render (has free tier)
- AWS/GCP/Azure (more complex)

See `DEPLOYMENT.md` for full instructions.

---

## Features Working in V1

✅ Real-time chess gameplay
✅ Move synchronization between players
✅ Game clocks and timeouts
✅ Elo rating system
✅ Leaderboard
✅ Quick Play matchmaking
✅ Invite links
✅ Sound effects
✅ Move history
✅ Practice mode

---

## Known Limitations

- ❌ Manus production hosting doesn't support WebSockets yet
- ✅ Works perfectly on local network
- ✅ Can be deployed to external hosting with WebSocket support

---

## Support

If you run into issues:
1. Check the terminal for error messages
2. Check browser console (F12)
3. Verify database connection
4. Make sure all players are on the same network

---

## Tech Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS
- **Backend:** Express, tRPC, Socket.IO
- **Database:** MySQL with Drizzle ORM
- **Chess Engine:** chess.js
- **Real-time:** WebSocket via Socket.IO

---

Enjoy your private chess club! ♟️
