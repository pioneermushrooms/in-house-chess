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
- [ ] Push changes to GitHub
- [ ] Verify Railway auto-deployment
