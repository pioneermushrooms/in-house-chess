# Real-Time Chess Architecture

## System Flow

### 1. Game Creation (Player 1 - White)
1. User clicks "Create Invite Link"
2. Frontend calls `trpc.game.create.useMutation()`
3. Backend creates game in database with:
   - `whitePlayerId` = creator's player ID
   - `blackPlayerId` = null
   - `status` = "waiting"
   - Unique `inviteCode`
4. Frontend redirects to `/game/{gameId}`
5. Frontend connects to WebSocket and emits `join_game` with gameId
6. Backend adds socket to room `game_{gameId}`
7. Backend sends `game_state` event with current FEN, times, player IDs

### 2. Game Joining (Player 2 - Black)
1. User enters invite code in "Join Game" form
2. Frontend calls `trpc.game.join.useMutation({ inviteCode })`
3. Backend:
   - Finds game by inviteCode
   - Updates `blackPlayerId` = joiner's player ID
   - Updates `status` = "active"
   - Returns gameId
4. Frontend redirects to `/game/{gameId}`
5. Frontend connects to WebSocket and emits `join_game` with gameId
6. Backend adds socket to room `game_{gameId}`
7. Backend broadcasts `player_joined` to ALL sockets in room
8. Backend sends `game_state` to the joining player

### 3. Making a Move
1. Player drags piece on board (triggers `onDrop`)
2. Frontend emits `make_move` with { gameId, from, to, promotion }
3. Backend validates:
   - Game exists in activeGames Map
   - It's the player's turn
   - Move is legal (chess.js validation)
4. Backend updates:
   - Game state in activeGames Map
   - Clock times
   - Database record
5. Backend broadcasts `move_made` to ALL sockets in room `game_{gameId}` with:
   - New FEN
   - Move in SAN notation
   - Updated clock times
6. ALL clients (including the one who made the move) receive `move_made`
7. Frontend updates:
   - Board position (setFen)
   - Move list
   - Clock times

### 4. Critical Requirements

**WebSocket Room Management:**
- Both players MUST be in the same socket room: `game_{gameId}`
- Room membership persists until disconnect
- Use `io.to('game_X').emit()` to broadcast to ALL players

**Game State Storage:**
- `activeGames` Map stores in-memory game state (chess.js instance, clocks)
- Database stores persistent state (FEN, moves, times, status)
- activeGames is populated when:
  - First player joins a waiting game
  - Second player joins (game becomes active)
  - Player reconnects to active game

**Player Assignment:**
- Game creator → White player (assigned at creation)
- First joiner → Black player (assigned when they call join endpoint)
- Player color determines:
  - Board orientation
  - Move permissions (can only move on your turn)
  - Clock display

**Move Broadcasting:**
- MUST use `io.to('game_X').emit('move_made', data)`
- NOT `socket.emit()` (only sends to one player)
- NOT `socket.broadcast.to()` (excludes the sender)
- Use `io.to()` so BOTH players get the update

## Current Issues to Fix

1. ✅ Game creation assigns white player
2. ❓ Join endpoint assigns black player
3. ❓ Both players join same socket room
4. ❓ activeGames Map populated correctly
5. ❓ move_made broadcasts to both players
6. ❓ Client receives and processes move_made events
