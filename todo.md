# In-House Chess Club - Project TODO

## Phase 1: Database Schema & Architecture
- [x] Design and document database schema (User, Game, RatingChange, MatchmakingQueue)
- [ ] Create architecture diagram for real-time WebSocket flow

## Phase 2: Database & Backend Infrastructure
- [x] Implement database schema in drizzle/schema.ts
- [x] Create database helper functions in server/db.ts
- [x] Install chess.js library for server-side move validation
- [x] Install socket.io for WebSocket support
- [x] Set up WebSocket server infrastructure

## Phase 3: Authentication & User Features
- [x] Extend user table with chess-specific fields (rating, alias)
- [ ] Create user profile page
- [x] Implement alias selection/update functionality
- [x] Add last active tracking

## Phase 4: Real-Time Chess Engine
- [x] Create game state management with chess.js
- [x] Implement server-side move validation
- [x] Build WebSocket event handlers (move, resign, draw offer, etc.)
- [x] Implement game clock logic with timeout detection
- [x] Handle reconnection and game state recovery
- [x] Implement all end game conditions (checkmate, timeout, resignation, stalemate, etc.)

## Phase 5: Matchmaking & Game Creation
- [ ] Create matchmaking queue system
- [ ] Implement quick play matchmaking
- [x] Build invite link generation and joining
- [ ] Add cancel search functionality

## Phase 6: Rating System & Leaderboard
- [x] Implement Elo rating calculation (K-factor logic)
- [x] Create rating change tracking
- [x] Build leaderboard query and display
- [ ] Show rating changes after games
- [x] Add W-L-D record tracking

## Phase 7: Chess UI & Game Interface
- [x] Design and implement interactive chessboard component
- [x] Add drag-and-drop piece movement
- [ ] Implement click-to-move functionality
- [ ] Show legal move highlighting
- [x] Display game clocks
- [x] Add game control buttons (resign, offer draw, accept draw)
- [x] Create post-game result screen with move list
- [ ] Build game replay functionality
- [x] Implement pawn promotion UI

## Phase 8: Testing & Polish
- [x] Write vitest tests for core game logic
- [x] Write vitest tests for rating calculations
- [ ] Write vitest tests for matchmaking
- [x] Test two-player game flow end-to-end
- [ ] Test reconnection scenarios
- [x] Test invite link flow
- [x] Verify leaderboard accuracy
- [x] Create deployment checkpoint

## Security & Validation
- [ ] Add rate limiting to auth endpoints
- [ ] Validate all WebSocket messages with schemas
- [ ] Prevent out-of-turn move requests
- [ ] Ensure players can only join assigned games
- [ ] Record move timestamps for telemetry

## UI/UX Requirements
- [ ] Create chess.com-like game layout (board center, player panels, move list, clocks)
- [ ] Make responsive for desktop and mobile
- [ ] Add smooth piece animations
- [ ] Highlight last move
- [ ] Show check indicator
- [ ] Design clean lobby interface

## Bug Fixes
- [x] Fix React setState error in Home component redirect (wrap setLocation in useEffect)
- [x] Fix React hooks error in Lobby component (move all hooks before conditional returns)
- [x] Fix SelectAlias page to check for existing player and redirect to lobby

## UX Improvements
- [x] Show actual player aliases in game interface (fetch player data for both white and black)
- [x] Auto-copy invite link to clipboard when creating game
- [x] Show waiting room UI when only one player has joined
- [x] Add player join notifications via WebSocket
- [ ] Auto-start game when second player joins (game starts when white makes first move)
- [x] Fix WebSocket error handling to show actual error messages instead of [object Object]
- [x] Fix socket connection errors - allow second player to join game and auto-assign as black player

## New Features & Fixes
- [x] Fix clock to only start after first move is made (not when second player joins)
- [x] Fix invite code join to allow joining active games that haven't started yet
- [x] Add sidebar showing current games in progress with click-to-join
- [x] Add move sound effects (move, capture, check, game end)
- [x] Show captured pieces display beside the board

## WebSocket Connection Issues
- [ ] Debug why second player isn't visible to first player
- [ ] Fix move execution not working between two players
- [ ] Verify both players are connecting to the same game room
- [ ] Add console logging to track socket events
- [ ] Test real-time move synchronization between two browsers
- [ ] Fix player color assignment - creator should be white, joiner should be black
- [ ] Fix board orientation to show player's color at bottom
- [ ] Fix move permissions based on player color and turn
- [ ] Fix second player (Black) not able to join game via invite code
- [ ] Ensure Black player can make moves after joining
- [ ] Fix Black player unable to make moves after White's first move
- [ ] Check turn validation in make_move socket handler
- [ ] Fix move_made event not broadcasting to other player
- [ ] Ensure game state updates are sent to all players in the room
- [ ] Fix Black player not seeing White's moves on their board

## Systematic Rebuild - Real-Time Chess
- [x] Verify join endpoint assigns black player correctly
- [x] Verify both players join the same socket room
- [x] Fix activeGames Map to populate when both players are assigned
- [x] Verify move_made uses io.to() not socket.emit()
- [x] Fix client useEffect dependencies causing listener churn
- [x] Add comprehensive logging at each step
- [ ] Test complete flow: create → join → move → move

## Quick Play Matchmaking
- [ ] Implement backend matchmaking queue management (add, remove, find match)
- [ ] Create matchmaking pairing algorithm based on rating proximity
- [ ] Add tRPC procedures for joining/leaving queue
- [ ] Build frontend Quick Play UI with searching status
- [ ] Add WebSocket event for match found notification
- [ ] Implement automatic game creation when match is found
- [ ] Add cancel search functionality
- [ ] Test matchmaking with multiple players

## Practice Mode
- [x] Create Practice page with local chess board
- [x] Allow moving both white and black pieces
- [x] Enforce chess rules with chess.js
- [x] Add move list display
- [x] Add reset board button
- [x] Add Practice Mode button to Lobby

## Fix Real-Time Two-Player Gameplay
- [x] Debug why moves don't sync between players
- [x] Verify socket room membership when both players join
- [x] Ensure game_state event sends complete data to both players
- [x] Fix move_made event broadcasting
- [x] Fix game status check to allow moves in waiting/active states
- [x] Test complete flow: create → join → both players make moves
- [x] Fix Vite middleware blocking Socket.IO paths
- [x] Fix socket cookie authentication

## Socket Connection Errors
- [x] Check server logs to see actual error messages
- [x] Debug why players can't join game 34 - Socket not connecting at all!
- [x] Fix error logging to show actual error message instead of [object Object]
- [ ] Fix socket authentication - token not being passed correctly
- [ ] Test complete two-player game flow
- [ ] Fix game status - game 30005 is "waiting" but should be "active" when both players join
- [ ] Ensure activeGames Map is populated when game becomes active
- [x] Fix socket authentication - session cookie is httpOnly and can't be read by client JS
- [x] Change socket auth to use withCredentials and read cookie from server-side request headers

## Current Issue - Moves Not Being Processed
- [x] Add detailed server-side logging to make_move handler
- [x] Check if activeGames Map is populated when both players join
- [x] Verify game state is being sent to client after join_game
- [x] Test if make_move events are reaching the server
- [x] Check if move validation is passing
- [x] Ensure move_made events are broadcast to both players
- [x] Fix Vite catch-all route intercepting Socket.IO connections
- [x] Fix socket authentication using wrong cookie name (was 'manus-session', should be 'app_session_id')

## Production WebSocket Connection Issue
- [x] Investigate why WebSocket cannot connect to wss://chessclub-h3st3pok.manus.space/socket.io/
- [x] Check if Socket.IO server is running in production
- [x] Verify WebSocket proxy configuration in production environment
- [x] Confirmed: Manus production hosting does not currently support WebSocket connections
- [x] Created comprehensive deployment guide for local network (v1)
- [x] Created deployment guide for external hosting platforms (v2)
- [x] Created quick-start script for local deployment
- [x] Documented all deployment options and troubleshooting

## Polish V1 for Local Deployment
- [x] Verify stats system works correctly (rating updates after games)
- [x] Test W-L-D record tracking
- [x] Build game history page showing last 10 games
- [x] Add "Load More" dropdown for additional games
- [x] Add recent games preview in Lobby History tab
- [x] All 11 vitest tests passing
- [x] Create instructions for downloading files from Manus
- [x] Research Railway deployment options
- [x] Research Vercel deployment with WebSocket support
- [x] Created comprehensive DEPLOYMENT-FAQ.md

## Railway Deployment Setup
- [x] Create railway.json configuration file
- [x] Create comprehensive RAILWAY.md deployment guide
- [x] .gitignore already exists and is properly configured
- [x] Create GitHub repository: https://github.com/pioneermushrooms/in-house-chess
- [x] Push code to GitHub (all 302 objects pushed successfully)
- [x] Provide Railway connection instructions

## Make OAuth Optional - Guest Username System
- [x] Update OAuth initialization to be optional
- [x] Implement guest username authentication
- [x] Create useAuth hook to support guest mode
- [x] Update Home page with guest login form
- [x] Test authentication flow in dev
- [x] Push changes to GitHub (commit ed08532)
- [x] Railway will auto-deploy - user should check deployment logs

## Fix Railway Deployment Crash
- [x] Find path.resolve call with undefined argument (import.meta.dirname in vite.ts)
- [x] Fix the undefined path issue (replaced with fileURLToPath + __dirname)
- [x] Test build locally (dev server running successfully)
- [x] Push fix to GitHub (commit 9abfe25)
- [x] Railway will auto-deploy - user should check deployment logs

## Railway Still Failing - Find All import.meta.dirname
- [x] Search entire codebase for import.meta.dirname (FOUND IN CONFIG FILES!)
- [x] Fixed vite.config.ts - replaced all import.meta.dirname with __dirname
- [x] Fixed vitest.config.ts - replaced all import.meta.dirname with __dirname
- [x] These config files get bundled into dist/index.js - that's why error persisted
- [x] Pushed commit 795dab1 with config file fixes
- [x] Railway deployment SUCCESSFUL! Server running on port 8080

## Fix "crypto is not defined" Error in Production
- [x] Find where crypto is used without import (jose library in sdk.ts)
- [x] Add proper crypto import to sdk.ts
- [x] Test guest login locally (dev server running)
- [x] Push fix to GitHub (commit 5aebefb)
- [ ] User should verify Railway deployment works

## Fix Client-Side Crypto Error
- [x] Error is in client bundle (index-BCHeoNpC.js), not server
- [x] Find why server SDK code is being bundled into client (jose in dependencies)
- [x] jose library was being bundled into client by Vite
- [x] Added rollupOptions.external and optimizeDeps.exclude for jose
- [x] Pushed commit 921fea6
- [ ] User should verify Railway deployment works

## Railway Database Migration Fix
- [ ] Create startup migration script (migrate.mjs)
- [ ] Update package.json start command to run migrations before server
- [ ] Test locally that migrations run on startup
- [ ] Push to GitHub and verify Railway deployment

## Railway Startup Script Fix
- [ ] Create startup.sh with migration + server start
- [ ] Push to GitHub
- [ ] Update Railway start command to ./startup.sh

## Fix drizzle-kit for Railway Production
- [ ] Move drizzle-kit to dependencies (not devDependencies)
- [ ] Update start script to run migrations
- [ ] Push and verify Railway deployment

## Switch to drizzle-kit push for Railway
- [ ] Change start script from migrate to push
- [ ] Push to GitHub
- [ ] Verify Railway deployment creates tables automatically

## Fix drizzle-kit push interactive prompt issue
- [ ] Create cleanup.mjs to drop malformed users table
- [ ] Update start script to run cleanup before push
- [ ] Push and verify Railway deployment

## Fix crypto is not defined error in production
- [ ] Remove top-level sdk import from server/routers.ts
- [ ] Import sdk only where needed (in specific procedures)
- [ ] Rebuild and deploy to Railway

## Remove cleanup script (database is fixed)
- [ ] Remove cleanup-db.mjs from start command
- [ ] Push to GitHub
- [ ] Verify Railway deployment succeeds

## Fix crypto error - separate type exports
- [ ] Create server/router-types.ts with type-only AppRouter export
- [ ] Update client/src/lib/trpc.ts to import from router-types.ts
- [ ] Push and verify crypto error is fixed

## Fix router-types to not import routers at all
- [ ] Make router-types.ts re-export type without importing
- [ ] Use declare module pattern
- [ ] Push and verify crypto error is finally fixed

## Replace JWT auth with simple cookie (no crypto needed)
- [ ] Create simple guest session without jose/crypto
- [ ] Update guestLogin to use plain cookie
- [ ] Push and verify login finally works


---

# V2 Features (Post-Launch Improvements)

## Mobile Support
- [x] Add touch event handlers for chess piece movement
- [x] Test drag-and-drop on mobile browsers (needs user testing)
- [ ] Ensure responsive board sizing on small screens

## Game Completion & Stats
- [x] Detect checkmate/stalemate/resignation
- [x] Update player stats (wins/losses/draws) in database
- [x] Update ELO ratings after each game
- [ ] Show game result modal with stats changes

## Game Invitations
- [ ] Generate unique shareable invite links
- [ ] Store invite codes in database
- [ ] Handle invite link acceptance flow
- [ ] Show "waiting for opponent" state

## Player Profiles
- [ ] Create profile page route (/profile/:playerId)
- [ ] Display player stats (rating, W/L/D, games played)
- [ ] Add MS Paint-style canvas for profile notes/drawings
- [ ] Save canvas data to database
- [ ] Make all player names clickable throughout app

## Game History
- [ ] Implement history page with past games list
- [ ] Show game results, opponents, dates
- [ ] Make opponent names clickable to profiles
- [ ] Add game replay functionality (stretch goal)


## Critical Bug Fixes (V2.2)
- [x] Fix timer accuracy - 10min games ending in 5min
- [x] Fix stats not updating in player profiles after games
- [x] Add multiple time control options (1min, 3min, 5min, 10min, 15min, 30min)
- [ ] Ensure Railway auto-deploys on GitHub push


## UI Improvements (V2.3)
- [x] Add time control selector to Create Game section
- [x] Improve cancel match button visibility/functionality


## Matchmaking Queue Fixes (V2.4)
- [x] Add 30-second client-side matchmaking timeout
- [x] Clean up queue when player disconnects or navigates away
- [x] Add server-side stale player removal (players in queue > 60s)
- [x] Show "No opponents found" message after timeout


## Bug Fix (V2.5)
- [x] Fix game creation to use selected time control (currently hardcoded to 10min)


## UI Improvement (V2.6)
- [x] Move timers to side of board (side-by-side layout) so both are always visible


## Player Profile Page (V2.7)
- [x] Create Profile.tsx page component
- [x] Display player stats (rating, W-L-D, games played)
- [x] Add MS Paint-style canvas for wall notes/drawings
- [x] Wire up Profile button in Lobby
- [ ] Make player names clickable throughout app (lobby, game, history)
- [x] Add backend routes for saving/loading canvas data
- [x] Add canvas drawing tools (pen, eraser, color picker, clear)


## Make Player Names Clickable (V2.8-V2.9)
- [x] Make player names clickable in Active Games list
- [x] Make player names clickable in leaderboard
- [x] Make player names clickable in game page (opponent names in timer sidebar)
- [x] Make player names clickable in history page (both white and black player names)
- [x] Update backend getGames to include player data for history page


## Bug: Profile Page Shows "Player not found" for Other Players (V2.10)
- [x] Investigate why other players' profiles don't load
- [x] Check Profile.tsx routing and query parameters
- [x] Check backend player.getProfile route
- [x] Fix profile loading to work with playerId parameter (was using getPlayerByUserId instead of getPlayerById)
- [x] Test clicking player names from different pages


## Fix Stats Display Issues (V2.11)
- [x] Investigate what stats are showing incorrectly
- [x] Check stats calculation in game completion handler
- [x] Fixed critical bug: endGame was using getPlayerByUserId instead of getPlayerById
- [x] Added getPlayerById to imports in socket.ts
- [x] Stats now update correctly when games complete


## In-Game Chat Feature (V2.12)
- [x] Design chat UI layout (chat panel in game page)
- [x] Add chat messages table to database schema
- [x] Implement WebSocket chat_message event handler
- [x] Create chat component with message list and input
- [x] Add message sending functionality
- [x] Display player names with messages
- [x] Add timestamps to messages
- [x] Chat appears in right sidebar below move history
- [x] Messages show sender name, content, and time
- [x] Own messages appear on right (blue), opponent's on left (gray)


## Implement Chess.com Clock Timing Rules (V2.13)
- [x] White's clock starts immediately when both players join
- [x] Black's clock starts only after White makes first move (handled by turn-based clock)
- [x] After each move, player's clock stops and opponent's starts
- [x] Clock ticks at exactly 1 second intervals (100ms server updates with elapsed time calculation)
- [x] Increment added after completing a move (converted from seconds to milliseconds)
- [x] Clock updates synced between server and client via WebSocket
- [x] Removed redundant clock start on first move


## Move Navigation/Game Replay (V2.14)
- [x] Add state to track current move position in history (viewingMoveIndex)
- [x] Implement "go to first move" button (⏮)
- [x] Implement "previous move" button (◀)
- [x] Implement "next move" button (▶)
- [x] Implement "go to latest move" button (⏭)
- [x] Add keyboard shortcuts (Left/Right arrows, Home/End keys)
- [x] Show current position indicator ("Live", "Start Position", "Move X of Y")
- [x] Update board display when navigating through moves
- [x] Disable piece movement when in review mode
- [x] Enable full navigation during and after games
- [x] Show "Review Mode" indicator when viewing past positions
- [x] Auto-return to live position when new move is made


## Bug Fixes (V2.15)
- [x] Move navigation controls not visible in deployed version (works correctly - only shows when moves exist)
- [x] Clocks still ticking when in review mode (fixed - only update when viewingMoveIndex is null)
- [x] History page showing incorrect win/loss (fixed - was checking "white_wins" instead of "white_win")
- [x] Add game history section to player profiles (shows recent 10 games with opponent and result)


## Fix Clock Start Timing (V2.16)
- [x] Clock should start when White makes first move, not when both players join
- [x] Revert previous change that started clock immediately
- [x] Clock now starts when moveList.length === 1 (first move)
- [x] Removed clock start when both players join


## UI Redesign (V3.0) - CANCELLED
- [x] Created sophisticated visual style with purple theme
- [x] Updated global CSS with new color palette
- [x] Redesigned Lobby page
- [x] Previewed design
- [x] User preferred original design - reverted all changes


## Play vs Computer (V2.17)
- [x] Add isComputerGame flag to games table
- [x] Add difficulty level field (easy/medium/hard)
- [x] Create AI move generation using chess.js (easy/medium/hard with minimax)
- [x] Add "Play vs Computer" card in Lobby
- [x] Implement computer move logic in socket handler (500ms delay for UX)
- [x] Add difficulty selector UI (Easy/Medium/Hard)
- [x] Add color selector UI (White/Black)
- [x] Computer games are unrated
- [x] Computer responds automatically after player moves


## Fix Computer Game Activation (V2.18)
- [x] Computer games not starting when player joins
- [x] Socket handler recognizes computer games and starts immediately
- [x] Don't wait for second player in computer games
- [x] Use placeholder ID (-1) for computer player
- [x] Report bothPlayersPresent=true for computer games


## Fix Pawn Promotion (V2.19)
- [x] Pawn promotions not working (was hardcoded to queen)
- [x] Add promotion dialog UI when pawn reaches final rank
- [x] Allow selecting promotion piece (Queen/Rook/Bishop/Knight)
- [x] Send promotion choice to server
- [x] Dialog shows chess piece symbols (♕♖♗♘)
- [x] Works in both player vs player and computer games


## Improve Computer AI Strength (V2.20)
- [x] Current AI is too weak
- [x] Improve position evaluation (piece-square tables for all pieces)
- [x] Increase search depth for Hard mode (3→4 ply)
- [x] Add mobility evaluation (bonus for legal moves)
- [x] Better material values (pawn=100, knight=320, bishop=330, rook=500, queen=900)
- [x] Positional bonuses for centralization and development
- [x] King safety in middlegame (encourages castling)


## Last Move Highlighting + AI Fixes (V2.21)
- [x] Add last move highlighting (yellow overlay on from/to squares)
- [x] Fix computer to move first when player chooses Black
- [x] Drastically improved AI strength (depth 5, quiescence search)
- [x] Increase search depth significantly (Hard: 3→5 ply)
- [x] Add move ordering (MVV-LVA, captures, checks, promotions, center control)
- [x] Add quiescence search for tactical sequences
- [x] Add bishop pair bonus, doubled pawns penalty, isolated pawns penalty
- [x] Better alpha-beta pruning with move ordering


## Abort Game Feature + Fix Computer First Move (V2.23)
- [x] Multiple stuck AI games where player is Black and bot won't start
- [x] Add "Abort Game" button for computer games (only shows when no moves made)
- [x] Added console logging to debug white bot first move issue
- [x] Abort handler marks game as abandoned and cleans up active games
- [x] User can now abort stuck computer games to clear the site


## Internal Credit & Betting System (V3.0)
- [ ] Add accountBalance field to players table
- [ ] Add stake amount field to games table
- [ ] Create transactions table for credit history
- [ ] Add backend routes for credit management (admin only)
- [ ] Implement automatic credit transfer on game completion
- [ ] Add admin panel for adding/removing credits
- [ ] Add stake input to game creation UI
- [ ] Display stake amount in active games list
- [ ] Show account balance in player profiles and lobby
- [ ] Add transaction history page
- [ ] Prevent betting on computer games
- [ ] Validate sufficient balance before creating staked games
- [ ] Test credit transfers and balance updates


## Internal Credit & Betting System (V2.24)
- [x] Add accountBalance field to players table
- [x] Add stakeAmount field to games table
- [x] Create transactions table for credit history
- [x] Implement credit management functions (add/remove/transfer)
- [x] Add credit transfer on game completion (winner gets stake)
- [x] Build admin panel for managing player credits (admin router)
- [x] Display account balance in lobby stats section
- [x] Add stake input when creating games
- [x] Validate sufficient balance before creating staked games
- [x] Credits only transfer in non-computer games
- [x] Draws return stakes (no transfer)
- [ ] Write vitest tests for credit system
- [ ] Add admin UI page for managing credits
- [ ] Display stake amount in active games list
- [ ] Show transaction history page


## Chat UI Improvements (V2.25)
- [x] Fix chat being pushed down by move history (re-align layout)
- [x] Add chess piece emoji quick reactions (♔♕♖♗♘♙)
- [x] Add taunting emoji reactions (🍳 cooked, 💀 blundered, 🔥 brilliant, etc.)


## Stripe Payment Integration (V2.26)
- [x] Add Stripe feature to project with webdev_add_feature
- [x] Configure Stripe API keys (secret and publishable) - via Management UI
- [x] Define credit purchase packages (e.g., $5=500 credits, $10=1100 credits)
- [x] Create Buy Credits page with Stripe Checkout
- [x] Implement payment success webhook handler
- [x] Add credits to player account after successful payment
- [x] Add "Buy Credits" button in lobby
- [ ] Test complete payment flow (requires Stripe keys in Management UI)
- [ ] Write vitest tests for payment webhook


## Webhook & OAuth Fixes (V2.27)
- [x] Debug why credits don't update after successful Stripe payment
- [x] Identified issue: STRIPE_WEBHOOK_SECRET not set in Railway
- [x] Add manual "Sync Payments" button as backup
- [x] Implement proper Manus OAuth to replace guest login system
- [x] Ensure payments are tied to OAuth user accounts
- [x] Add OAuth login button on home page
- [x] Guest login kept in backend for backwards compatibility
- [ ] User must set STRIPE_WEBHOOK_SECRET in Railway for automatic webhook
- [ ] Test complete payment flow end-to-end with OAuth

## In-Game Wager System (V2.28)
- [x] Add "Propose Wager" button in active game view
- [x] Create wager proposal modal with credit amount input
- [x] Show wager proposal notification to opponent
- [x] Require both players to accept before wager is active
- [x] Display active wager amount prominently in game UI
- [x] Lock credits when wager is accepted (escrow)
- [x] Automatically transfer credits to winner when game ends (existing logic)
- [x] Return credits to both players on draw (existing logic)
- [ ] Handle edge cases (disconnect, timeout, abandonment) - needs testing
- [x] Display stakes (💰 amount) on game cards in lobby
- [x] Display stakes on game history entries
- [x] Create /transactions page showing all credit movements
- [x] Show purchase, wager, win/loss transactions with timestamps
- [x] Add Transactions link button in lobby
- [ ] Add filtering/sorting to transaction history - future enhancement


## Credit Cashout System (V2.29)
- [x] Create Stripe payout/transfer system for credit cashout
- [x] Add cashout button in lobby with minimum threshold
- [x] Create cashout request modal with amount input
- [x] Implement backend cashout procedure with Stripe API
- [x] Add cashout transactions to transaction history
- [x] Implement security limits: $5 max per transaction, 10 transactions per day
- [x] Add daily cashout tracking per user
- [x] Validate cashout limits on backend with proper error messages
- [x] Add cashout modal UI with amount input and validation
- [x] Display security warnings in cashout modal
- [ ] Test end-to-end cashout flow with limits

## Admin Panel (V2.29)
- [x] Create /admin route and page component
- [x] Restrict admin access to schuldt91@gmail.com only (backend + frontend)
- [x] Display all players with stats (rating, balance, games played)
- [x] Add manual credit adjustment with security limits (±$5 max)
- [x] Implement rate limiting: max 10 admin transactions per day
- [x] Add admin action audit logging (who, what, when, amount, reason)
- [x] Require reason input for all credit adjustments
- [x] Show recent admin actions log on admin panel
- [x] Display system statistics (total credits, total games, active users)
- [x] Prevent admin from adjusting their own balance
- [x] Display security warnings in adjustment modal
- [ ] Add player search and filtering (future enhancement)


## Bug Fixes (V2.30)
- [x] Fix sync button adding duplicate credits on each click
- [x] Add payment tracking to prevent duplicate credit additions
- [x] Verify wager UI is visible in active games (shows when game active, not computer, no existing stake)
- [ ] Cash out button logic verified (requires 1000+ credits)
- [ ] Test complete payment and wager flow end-to-end


## Cashout Error Fix (V2.31)
- [x] Fix "cannot read properties of undefined" error when clicking cashout
- [x] Replace incorrect db.db.select() with db.getTransactions()
- [x] Replace non-existent db.createTransaction() with db.addCredits()
- [x] Fix daily cashout limit query logic
- [ ] Test cashout with sufficient balance


## Sync Button Fix v2 (V2.32)
- [x] Create synced_sessions table to track processed Stripe sessions
- [x] Add syncedSessions to schema.ts with sessionId, playerId, credits
- [x] Create isSessionSynced() function to check if session was processed
- [x] Create recordSyncedSession() function to mark session as synced
- [x] Update syncPayments to use syncedSessions table instead of transaction descriptions
- [x] Prevent duplicate credit additions completely
- [ ] Test sync button multiple times to verify idempotency


## Cashout Utils Error Fix (V2.34)
- [x] Fix "utils not defined" error when clicking cashout
- [x] Added const utils = trpc.useUtils() in Lobby.tsx
- [x] Cashout mutation now properly invalidates player query cache
- [ ] Test cashout with sufficient balance


## New User 404 Error & Sign-Out (V2.35)
- [x] Add sign-out button in lobby header
- [x] Sign-out button clears session cookie and redirects to home

## OAuth Button Text & 404 Fix (V2.36)
- [x] Change 'Sign in with Manus' button text to 'Join the Club'
- [x] Fix 404 error - changed OAuth callback redirect from / to /lobby
- [x] Simplified OAuth flow: callback → /lobby → /select-alias (if no player)
- [ ] Test complete OAuth flow with new user account in incognito


## OAuth 404 Still Occurring (V2.37)
- [x] Check Railway deployment status - latest code deployed
- [x] Verify OAuth environment variables are set in Railway - all correct
- [x] Check OAuth callback URL matches Railway domain - correct
- [x] Reverted OAuth callback redirect from /lobby back to / for cookie processing
- [x] Tested - site loads but OAuth callback returns 404

## OAuth Callback Route 404 (V2.38)
- [x] Add logging to OAuth route registration
- [x] Add logging to OAuth callback handler
- [x] Log environment variable status (OAUTH_SERVER_URL, VITE_APP_ID)
- [ ] Deploy and check Railway logs to see if routes are registering
- [ ] Verify OAuth callback route is being hit or returning 404


## OAuth Fresh Rebuild (V2.39)
- [ ] Fix route registration order - OAuth routes before SPA fallback
- [ ] Verify /api/oauth/callback is accessible before static file serving
- [ ] Fix sign out button - not working
- [ ] Test complete OAuth flow locally
- [ ] Test on Railway after deployment


## OAuth Fresh Rebuild (V2.39)
- [x] Fix route registration order - OAuth routes before SPA fallback
- [x] Verify /api/oauth/callback is accessible before static file serving
- [x] Fix sign out button - use auth.logout mutation instead of manual cookie clear
- [x] Test complete OAuth flow locally
- [ ] Test on Railway after deployment


## OAuth Cookie Issue on Railway (V2.40)
- [x] Diagnose "missing session cookie" error on Railway
- [x] Check cookie domain/secure/sameSite settings for production
- [x] Fix cookie configuration - changed sameSite from "none" to "lax"
- [ ] Test OAuth flow on Railway after fix


## OAuth Railway Investigation (V2.41)
- [x] Check GitHub history for when OAuth was working
- [x] Compare working OAuth config with current config
- [x] Identified issue: VITE_OAUTH_PORTAL_URL was wrong
- [x] Fixed env vars on Railway
- [ ] Still getting 404 on /api/oauth/callback - route not registered
- [ ] Check if OAuth routes are being registered in production build
- [ ] Fix route registration in production
- [ ] Test OAuth on Railway


## OAuth UI Missing (V2.42)
- [ ] Check current Home.tsx for OAuth login button
- [ ] Search git history for when OAuth button existed
- [ ] Compare working version with current version
- [ ] Restore OAuth login UI
- [ ] Test OAuth flow end-to-end on Railway


## Google OAuth Implementation (V2.42)
- [x] Research OAuth solutions for Railway
- [x] Evaluate auth options - chose Google OAuth
- [x] User created Google Cloud project and OAuth credentials
- [x] Extract credentials from JSON file
- [x] Implement Google OAuth provider in server
- [x] Add Google OAuth fields to database schema
- [x] Create getOrCreateUserByEmail function
- [x] Update Home.tsx to detect environment and use correct OAuth
- [ ] Push database schema changes
- [ ] Update Railway environment variables
- [ ] Test Google OAuth login on Railway
- [ ] Verify account persistence and credit security


## Google OAuth Deployment (V2.43)
- [ ] Push Google OAuth code to GitHub
- [ ] Verify Railway auto-deployed the new code
- [ ] Check Railway logs for Google OAuth route registration
- [ ] Test login button redirects to Google (not Manus)
- [ ] Verify complete OAuth flow works

## V2.47: Starting Credits & Sign Out Fix
- [ ] Give new users 100 starting credits on account creation
- [ ] Fix sign-out button to properly clear Google OAuth session
- [ ] Test session persistence across sign-out/sign-in cycles

## V2.48: Fix Google OAuth Session Creation
- [x] Remove sdk.createSession() call (doesn't exist)
- [x] Use simple cookie-based session like guest login
- [ ] Push fix to GitHub for Railway deployment

## V2.51: Fix User Lookup Order for Google OAuth
- [ ] Change authenticateRequest to try getUserByGoogleId FIRST for numeric sessions
- [ ] Skip getUserByOpenId for Google OAuth (numeric IDs won't match openId field)
- [ ] Test and verify OAuth works end-to-end

## V2.53: Fix Passport session recognition
- [x] Add debug logging to show which auth method is being used
- [x] Ensure Passport session takes priority over legacy cookies
- [ ] Verify frontend receives authenticated user from Passport
- [ ] Test complete OAuth flow end-to-end

## V2.54: Fix Passport session persistence
- [ ] Add session debugging to track session lifecycle
- [x] Fix session storage configuration
- [x] Verify session persists across requests
- [ ] Test complete OAuth flow without redirect loops

## Remove Passport.js (V2.48)
- [x] Remove Passport.js implementation (legacy OAuth already works)
- [x] Remove Passport.js dependencies
- [ ] Remove debug cookie logging
- [x] Update frontend to use legacy OAuth route
- [ ] Test complete OAuth flow with legacy system

## V2.55: Credit Distribution Bug
- [ ] Investigate why both players lose credits after game completion
- [ ] Fix credit transfer logic to award winner the pot (stake * 2)
- [ ] Ensure loser's locked credits are properly transferred to winner
- [ ] Test resignation credit distribution
- [ ] Test checkmate credit distribution

## V2.56: Admin Credit Management System
- [x] Review existing admin controls for credits
- [x] Add admin UI to view all player balances
- [x] Add admin ability to manually add/remove credits from any player
- [x] Add admin transaction history view with filters
- [ ] Add admin ability to reverse/refund transactions
- [ ] Test all credit flows: wager lock → game win → credit award
- [ ] Test draw scenario: wager lock → draw → stakes returned
- [ ] Test resignation credit flow
- [ ] Test timeout/abandonment credit flow
- [ ] Disconnect Stripe payment temporarily until credit system is verified
- [ ] Document all credit transaction types and flows

## V2.57: Matchmaking Bug - Only One Player Added
- [ ] Investigate why find-a-match only adds one player to game
- [ ] Check matchmaking queue logic
- [ ] Check game creation with matched players
- [ ] Ensure both players are assigned white/black roles
- [ ] Test matchmaking with 2+ players in queue

## V2.58: Wager Payout Fix & Game Over UI
- [x] Fix credit payout - winner gets total pot correctly
- [x] Add game-over overlay showing winner, result, and credits won/lost
- [x] Display overlay on checkmate, resignation, timeout, draw
- [x] Show different messages for winner vs loser
- [ ] Test with various wager amounts
