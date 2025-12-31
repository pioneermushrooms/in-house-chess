# Simplified In-Memory Chess - Railway Deployment

## What Changed

**EMERGENCY SIMPLIFICATION** - Removed all database and authentication complexity:

- ❌ No MySQL database
- ❌ No Drizzle ORM
- ❌ No JWT sessions
- ❌ No OAuth
- ❌ No user accounts

- ✅ In-memory storage (Map objects)
- ✅ Nickname-only entry
- ✅ Real-time WebSocket chess
- ✅ ZERO configuration needed

## Files Created

All new simplified files are in the Manus checkpoint. Download them from the Code panel:

### Server Files
- `server/memory-store.ts` - In-memory storage for games and players
- `server/routers-simple.ts` - Simplified tRPC routes (no database)
- `server/socket-simple.ts` - WebSocket handlers using in-memory state

### Client Files
- `client/src/pages/HomeSimple.tsx` - Nickname entry page
- `client/src/pages/LobbySimple.tsx` - Game lobby (create/join)
- `client/src/pages/GameSimple.tsx` - Chess game interface
- `client/src/hooks/useSocketSimple.ts` - Socket hook with playerId auth

### Modified Files
- `client/src/App.tsx` - Updated to use simplified pages
- `client/src/lib/trpc.ts` - Updated to use simplified router
- `server/_core/index.ts` - Updated to use simplified modules

## Railway Deployment

### Step 1: Create New Service
1. Go to Railway dashboard
2. Click "+ New" → "Empty Service"
3. Name it "in-house-chess-simple"

### Step 2: Connect GitHub
1. Click "Settings" → "Source"
2. Connect to your GitHub repo: `pioneermushrooms/in-house-chess`
3. Select branch: `main`

### Step 3: Configure Build
**NO ENVIRONMENT VARIABLES NEEDED!**

Railway will auto-detect:
- Build Command: `pnpm install && pnpm run build`
- Start Command: `pnpm start`
- Port: 3000 (auto-detected from process.env.PORT)

### Step 4: Deploy
- Railway will automatically deploy when you push to GitHub
- No database setup needed
- No migrations needed
- No secrets needed

## How It Works

### User Flow
1. Visit homepage → Enter nickname → Start Playing
2. Lobby → Create Game (get invite code) OR Join Game (enter code)
3. Game page → Play chess in real-time

### Data Storage
- All game state stored in memory (server RAM)
- Players stored in Map: `playerId → { nickname, connectedAt }`
- Games stored in Map: `gameId → { fen, pgn, players, times }`
- **Resets on server restart** - perfect for testing!

### WebSocket Auth
- Client stores `playerId` in localStorage
- Socket handshake sends `auth: { playerId }`
- Server validates player exists in memory
- No cookies, no JWT, no sessions

## Testing Locally

```bash
cd /home/ubuntu/in-house-chess
pnpm install
pnpm run dev
```

Open two browser windows:
1. Window 1: Enter nickname "Alice" → Create Game → Copy invite code
2. Window 2: Enter nickname "Bob" → Join Game → Paste invite code
3. Play chess in real-time!

## Limitations

- **Data resets on restart** - all games and players lost
- **No persistence** - no game history, no ratings
- **No authentication** - anyone can use any nickname
- **Single server** - can't scale horizontally

## Future: Add Database Back

Once Railway deployment works, we can add back:
1. MySQL database (Railway addon)
2. Drizzle ORM for persistence
3. User accounts with simple login
4. Game history and ratings
5. Leaderboards

But for now: **JUST GET IT WORKING!**

## Troubleshooting

### "Player not found" error
- Clear localStorage and re-enter nickname
- Check browser console for playerId

### WebSocket not connecting
- Check Railway logs for Socket.IO errors
- Verify port 3000 is exposed
- Check browser console for connection errors

### Game not starting
- Both players must join the same game
- Check invite code is correct (6 characters)
- Refresh page if stuck

## Support

If deployment fails:
1. Check Railway logs
2. Verify build completed successfully
3. Test locally first
4. Share error messages for help
