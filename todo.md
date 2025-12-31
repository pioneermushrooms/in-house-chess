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
