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
