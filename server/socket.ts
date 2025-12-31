import { Server as HTTPServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import { Chess } from "chess.js";
import {
  getGameById,
  updateGame,
  getPlayerByUserId,
  getPlayerById,
  updatePlayerStats,
  updatePlayerRating,
  recordRatingChange,
} from "./db";
import { getUserByOpenId } from "./db";
import { sdk } from "./_core/sdk";
import { COOKIE_NAME } from "@shared/const";

interface AuthenticatedSocket extends Socket {
  userId?: number;
  playerId?: number;
}

interface GameState {
  gameId: number;
  chess: Chess;
  whitePlayerId: number;
  blackPlayerId: number;
  whiteTimeRemaining: number;
  blackTimeRemaining: number;
  lastMoveTime: number;
  currentTurn: "white" | "black";
  intervalId?: NodeJS.Timeout;
}

const activeGames = new Map<number, GameState>();

export function setupSocketIO(httpServer: HTTPServer) {
  console.log("[Socket.IO] Setting up Socket.IO server...");
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      credentials: true,
    },
    path: "/socket.io/",
  });
  console.log("[Socket.IO] Socket.IO server initialized");

  // Authentication middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    console.log("[Socket.IO Auth] New connection attempt");
    console.log("[Socket.IO Auth] Headers:", socket.handshake.headers);
    try {
      // Extract session token from cookies
      const cookies = socket.handshake.headers.cookie;
      console.log("[Socket.IO Auth] Cookies:", cookies);
      if (!cookies) {
        console.log("[Socket.IO Auth] ERROR: No cookies found");
        return next(new Error("Authentication required"));
      }
      
      // Parse cookie string to find session token
      const cookieObj: Record<string, string> = {};
      cookies.split(';').forEach(cookie => {
        const [key, value] = cookie.trim().split('=');
        if (key && value) cookieObj[key] = value;
      });
      
      const token = cookieObj[COOKIE_NAME];
      console.log("[Socket.IO Auth] Parsed cookies:", cookieObj);
      console.log("[Socket.IO Auth] Session token:", token ? "Found" : "Not found");
      if (!token) {
        console.log("[Socket.IO Auth] ERROR: No session token in cookies");
        return next(new Error("Authentication required"));
      }

      const payload = await sdk.verifySession(token);
      if (!payload?.openId) {
        return next(new Error("Invalid token"));
      }

      const user = await getUserByOpenId(payload.openId);
      if (!user) {
        return next(new Error("User not found"));
      }

      const player = await getPlayerByUserId(user.id);
      if (!player) {
        return next(new Error("Player profile not found"));
      }

      socket.userId = user.id;
      socket.playerId = player.id;
      console.log(`[Socket.IO Auth] SUCCESS - User ${user.id}, Player ${player.id}`);
      next();
    } catch (error) {
      next(new Error("Authentication failed"));
    }
  });

  io.on("connection", (socket: AuthenticatedSocket) => {
    console.log(`[Socket.IO] ===== NEW CONNECTION =====`);
    console.log(`[Socket.IO] Player ${socket.playerId} connected (User ID: ${socket.userId})`);
    console.log(`[Socket.IO] Socket ID: ${socket.id}`);

    // Join game
    socket.on(
      "join_game",
      async (data: { gameId: number }) => {
        console.log(`[Socket] Player ${socket.playerId} attempting to join game ${data.gameId}`);
        try {
          const game = await getGameById(data.gameId);
          if (!game) {
          socket.emit("error", { message: "Game not found" });
          return;
        }

        // Verify player is part of this game or can join
        const isWhitePlayer = game.whitePlayerId === socket.playerId;
        const isBlackPlayer = game.blackPlayerId === socket.playerId;
        const canJoinAsBlack = game.blackPlayerId === null && game.whitePlayerId !== socket.playerId;
        
        if (!isWhitePlayer && !isBlackPlayer && !canJoinAsBlack) {
          socket.emit("error", { message: "Not authorized for this game" });
          return;
        }
        
        // If player is joining as black for the first time, assign them
        if (canJoinAsBlack && game.status === "waiting") {
          await updateGame(data.gameId, {
            blackPlayerId: socket.playerId,
            status: "active",
            startedAt: new Date(),
          });
          // Refresh game data
          const updatedGame = await getGameById(data.gameId);
          if (updatedGame) {
            Object.assign(game, updatedGame);
          }
        }

        socket.join(`game_${data.gameId}`);
        console.log(`[Socket] Player ${socket.playerId} joined room game_${data.gameId}`);

        // Check how many players are in the room
        const room = io.sockets.adapter.rooms.get(`game_${data.gameId}`);
        const playerCount = room ? room.size : 0;
        console.log(`[Socket] Room game_${data.gameId} now has ${playerCount} players`);

        // Refresh game data before notifying
        const currentGame = await getGameById(data.gameId);
        
        // Notify all players about the player count
        io.to(`game_${data.gameId}`).emit("player_joined", {
          playerCount,
          bothPlayersPresent: playerCount >= 2,
          whitePlayerId: currentGame?.whitePlayerId,
          blackPlayerId: currentGame?.blackPlayerId,
        });
        console.log(`[Socket] Emitted player_joined event to room game_${data.gameId}`);

        // Initialize or restore game state
        // ALWAYS refresh game data to get latest player assignments
        const latestGame = await getGameById(data.gameId);
        if (!latestGame) {
          socket.emit("error", { message: "Game not found" });
          return;
        }
        
        let gameState = activeGames.get(data.gameId);
        
        // Create activeGames entry if game has both players (active or waiting with both assigned)
        const hasBothPlayers = latestGame.whitePlayerId && latestGame.blackPlayerId;
        console.log(`[Socket] hasBothPlayers check - White: ${latestGame.whitePlayerId}, Black: ${latestGame.blackPlayerId}, Result: ${hasBothPlayers}`);
        console.log(`[Socket] gameState exists: ${!!gameState}`);
        
        if (!gameState && hasBothPlayers) {
          console.log(`[Socket] Creating activeGames entry for game ${data.gameId}`);
          const chess = new Chess(latestGame.currentFen);
          const moveList = latestGame.moveList ? JSON.parse(latestGame.moveList) : [];
          const hasStarted = moveList.length > 0;
          
          gameState = {
            gameId: data.gameId,
            chess,
            whitePlayerId: latestGame.whitePlayerId!,
            blackPlayerId: latestGame.blackPlayerId!,
            whiteTimeRemaining: latestGame.whiteTimeRemaining!,
            blackTimeRemaining: latestGame.blackTimeRemaining!,
            lastMoveTime: Date.now(),
            currentTurn: chess.turn() === "w" ? "white" : "black",
          };
          activeGames.set(data.gameId, gameState);
          console.log(`[Socket] activeGames created - White: ${gameState.whitePlayerId}, Black: ${gameState.blackPlayerId}`);
          
          // Only start clock if game has already started (has moves)
          // Clock will start when White makes the first move
          if (hasStarted) {
            startGameClock(data.gameId, gameState, io);
          }
        } else if (gameState) {
          console.log(`[Socket] activeGames already exists for game ${data.gameId}`);
        } else {
          console.log(`[Socket] Game ${data.gameId} waiting for second player`);
        }

        // Send current game state
        socket.emit("game_state", {
          fen: latestGame.currentFen,
          moveList: latestGame.moveList ? JSON.parse(latestGame.moveList) : [],
          whiteTimeRemaining: latestGame.whiteTimeRemaining,
          blackTimeRemaining: latestGame.blackTimeRemaining,
          status: latestGame.status,
          result: latestGame.result,
          endReason: latestGame.endReason,
        });
        console.log(`[Socket] Sent game_state to player ${socket.playerId}`);
      } catch (error) {
        console.error("Error joining game:", error);
        socket.emit("error", { message: "Failed to join game" });
      }
    });

    // Make a move
    socket.on(
      "make_move",
      async (data: { gameId: number; from: string; to: string; promotion?: string }) => {
        console.log(`[Socket] ===== MAKE_MOVE EVENT RECEIVED =====`);
        console.log(`[Socket] Player ${socket.playerId} attempting move: ${data.from} -> ${data.to}`);
        console.log(`[Socket] Game ID: ${data.gameId}`);
        console.log(`[Socket] activeGames Map size: ${activeGames.size}`);
        console.log(`[Socket] activeGames Map keys: ${Array.from(activeGames.keys()).join(", ")}`);
        
        try {
          const gameState = activeGames.get(data.gameId);
          console.log(`[Socket] gameState found: ${!!gameState}`);
          
          if (!gameState) {
            console.log(`[Socket] ERROR: Game ${data.gameId} not in activeGames map`);
            console.log(`[Socket] Available games: ${Array.from(activeGames.keys()).join(", ")}`);
            socket.emit("error", { message: "Game not active" });
            return;
          }

          // Verify it's the player's turn
          const isWhiteTurn = gameState.chess.turn() === "w";
          const isPlayerWhite = socket.playerId === gameState.whitePlayerId;
          console.log(`[Socket] Turn check - isWhiteTurn: ${isWhiteTurn}, isPlayerWhite: ${isPlayerWhite}, playerId: ${socket.playerId}, whiteId: ${gameState.whitePlayerId}, blackId: ${gameState.blackPlayerId}`);

          if (isWhiteTurn !== isPlayerWhite) {
            console.log(`[Socket] Move rejected - not player's turn`);
            socket.emit("error", { message: "Not your turn" });
            return;
          }

          // Attempt the move
          const move = gameState.chess.move({
            from: data.from,
            to: data.to,
            promotion: data.promotion,
          });

          if (!move) {
            socket.emit("error", { message: "Illegal move" });
            return;
          }

          // Update clock times
          const now = Date.now();
          const timeElapsed = now - gameState.lastMoveTime;

          // Get game info for increment
          const game = await getGameById(data.gameId);
          const increment = game?.increment || 0;

          if (isWhiteTurn) {
            gameState.whiteTimeRemaining -= timeElapsed;
            // Add increment after completing move (Chess.com rules)
            gameState.whiteTimeRemaining += increment * 1000; // Convert seconds to ms
          } else {
            gameState.blackTimeRemaining -= timeElapsed;
            // Add increment after completing move (Chess.com rules)
            gameState.blackTimeRemaining += increment * 1000; // Convert seconds to ms
          }
          gameState.lastMoveTime = now;
          gameState.currentTurn = gameState.chess.turn() === "w" ? "white" : "black";

          // Get move list (game already fetched above for increment)
          const moveList = game?.moveList ? JSON.parse(game.moveList) : [];
          moveList.push(move.san);
          
          // Start clock on first move (White's first move)
          if (moveList.length === 1) {
            startGameClock(data.gameId, gameState, io);
          }

          // Check for game end conditions
          let status = "active";
          let result = null;
          let endReason = null;

          if (gameState.chess.isCheckmate()) {
            status = "completed";
            result = isWhiteTurn ? "white_win" : "black_win";
            endReason = "checkmate";
            await endGame(data.gameId, gameState, result, endReason, io);
          } else if (gameState.chess.isStalemate()) {
            status = "completed";
            result = "draw";
            endReason = "stalemate";
            await endGame(data.gameId, gameState, result, endReason, io);
          } else if (gameState.chess.isThreefoldRepetition()) {
            status = "completed";
            result = "draw";
            endReason = "threefold_repetition";
            await endGame(data.gameId, gameState, result, endReason, io);
          } else if (gameState.chess.isInsufficientMaterial()) {
            status = "completed";
            result = "draw";
            endReason = "insufficient_material";
            await endGame(data.gameId, gameState, result, endReason, io);
          } else if (gameState.chess.isDraw()) {
            status = "completed";
            result = "draw";
            endReason = "fifty_move_rule";
            await endGame(data.gameId, gameState, result, endReason, io);
          }

          // Update database
          await updateGame(data.gameId, {
            currentFen: gameState.chess.fen(),
            moveList: JSON.stringify(moveList),
            whiteTimeRemaining: gameState.whiteTimeRemaining,
            blackTimeRemaining: gameState.blackTimeRemaining,
            lastMoveAt: new Date(),
            status: status as any,
            result: result as any,
            endReason,
          });

          // Broadcast move to all players in the game
          const room = io.sockets.adapter.rooms.get(`game_${data.gameId}`);
          const playerCount = room ? room.size : 0;
          console.log(`[Socket] Broadcasting move_made to room game_${data.gameId} with ${playerCount} players`);
          console.log(`[Socket] Move: ${move.san}, New FEN: ${gameState.chess.fen()}`);
          
          io.to(`game_${data.gameId}`).emit("move_made", {
            move: move.san,
            fen: gameState.chess.fen(),
            whiteTimeRemaining: gameState.whiteTimeRemaining,
            blackTimeRemaining: gameState.blackTimeRemaining,
            status,
            result,
            endReason,
          });
          console.log(`[Socket] move_made event emitted`);
        } catch (error) {
          console.error("Error making move:", error);
          socket.emit("error", { message: "Failed to make move" });
        }
      }
    );

    // Resign
    socket.on("resign", async (data: { gameId: number }) => {
      try {
        const gameState = activeGames.get(data.gameId);
        if (!gameState) {
          socket.emit("error", { message: "Game not active" });
          return;
        }

        const isPlayerWhite = socket.playerId === gameState.whitePlayerId;
        const result = isPlayerWhite ? "black_win" : "white_win";

        await endGame(data.gameId, gameState, result, "resignation", io);
        await updateGame(data.gameId, {
          status: "completed",
          result: result as any,
          endReason: "resignation",
          endedAt: new Date(),
        });

        io.to(`game_${data.gameId}`).emit("game_ended", {
          result,
          endReason: "resignation",
        });
      } catch (error) {
        console.error("Error resigning:", error);
        socket.emit("error", { message: "Failed to resign" });
      }
    });

    // Offer draw
    socket.on("offer_draw", async (data: { gameId: number }) => {
      socket.to(`game_${data.gameId}`).emit("draw_offered", {
        from: socket.playerId,
      });
    });

    // Accept draw
    socket.on("accept_draw", async (data: { gameId: number }) => {
      try {
        const gameState = activeGames.get(data.gameId);
        if (!gameState) {
          socket.emit("error", { message: "Game not active" });
          return;
        }

        await endGame(data.gameId, gameState, "draw", "agreement", io);
        await updateGame(data.gameId, {
          status: "completed",
          result: "draw",
          endReason: "agreement",
          endedAt: new Date(),
        });

        io.to(`game_${data.gameId}`).emit("game_ended", {
          result: "draw",
          endReason: "agreement",
        });
      } catch (error) {
        console.error("Error accepting draw:", error);
        socket.emit("error", { message: "Failed to accept draw" });
      }
    });

    // Chat message
    socket.on("chat_message", async (data: { gameId: number; message: string }) => {
      try {
        if (!socket.playerId) {
          socket.emit("error", { message: "Not authenticated" });
          return;
        }

        const trimmedMessage = data.message.trim();
        if (!trimmedMessage || trimmedMessage.length > 500) {
          socket.emit("error", { message: "Invalid message" });
          return;
        }

        // Get player info for the message
        const player = await getPlayerById(socket.playerId);
        if (!player) {
          socket.emit("error", { message: "Player not found" });
          return;
        }

        // Broadcast message to all players in the game
        io.to(`game_${data.gameId}`).emit("chat_message", {
          playerId: socket.playerId,
          playerAlias: player.alias,
          message: trimmedMessage,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.error("Error sending chat message:", error);
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    socket.on("disconnect", () => {
      console.log(`Player ${socket.playerId} disconnected`);
    });
  });

  return io;
}

function startGameClock(
  gameId: number,
  gameState: GameState,
  io: SocketIOServer
) {
  if (gameState.intervalId) {
    clearInterval(gameState.intervalId);
  }

  gameState.intervalId = setInterval(async () => {
    const now = Date.now();
    const timeElapsed = now - gameState.lastMoveTime;

    if (gameState.currentTurn === "white") {
      gameState.whiteTimeRemaining -= timeElapsed; // Use actual elapsed time
      gameState.lastMoveTime = now; // Reset for next interval
      if (gameState.whiteTimeRemaining <= 0) {
        await endGame(gameId, gameState, "black_win", "timeout", io);
        await updateGame(gameId, {
          status: "completed",
          result: "black_win",
          endReason: "timeout",
          whiteTimeRemaining: 0,
          endedAt: new Date(),
        });
        io.to(`game_${gameId}`).emit("game_ended", {
          result: "black_win",
          endReason: "timeout",
        });
      }
    } else {
      gameState.blackTimeRemaining -= timeElapsed; // Use actual elapsed time
      gameState.lastMoveTime = now; // Reset for next interval
      if (gameState.blackTimeRemaining <= 0) {
        await endGame(gameId, gameState, "white_win", "timeout", io);
        await updateGame(gameId, {
          status: "completed",
          result: "white_win",
          endReason: "timeout",
          blackTimeRemaining: 0,
          endedAt: new Date(),
        });
        io.to(`game_${gameId}`).emit("game_ended", {
          result: "white_win",
          endReason: "timeout",
        });
      }
    }

    // Broadcast clock update
    io.to(`game_${gameId}`).emit("clock_update", {
      whiteTimeRemaining: gameState.whiteTimeRemaining,
      blackTimeRemaining: gameState.blackTimeRemaining,
    });
  }, 100); // Update every 100ms
}

async function endGame(
  gameId: number,
  gameState: GameState,
  result: string,
  endReason: string,
  io: SocketIOServer
) {
  // Stop the clock
  if (gameState.intervalId) {
    clearInterval(gameState.intervalId);
  }

  // Calculate rating changes using Elo
  const game = await getGameById(gameId);
  if (game?.isRated) {
    const whitePlayer = await getPlayerById(gameState.whitePlayerId);
    const blackPlayer = await getPlayerById(gameState.blackPlayerId);

    if (whitePlayer && blackPlayer) {
      const K = 32; // K-factor for Elo calculation
      const whiteRating = whitePlayer.rating;
      const blackRating = blackPlayer.rating;

      // Calculate expected scores
      const whiteExpected =
        1 / (1 + Math.pow(10, (blackRating - whiteRating) / 400));
      const blackExpected =
        1 / (1 + Math.pow(10, (whiteRating - blackRating) / 400));

      // Actual scores
      let whiteScore = 0;
      let blackScore = 0;
      if (result === "white_win") {
        whiteScore = 1;
        blackScore = 0;
      } else if (result === "black_win") {
        whiteScore = 0;
        blackScore = 1;
      } else {
        whiteScore = 0.5;
        blackScore = 0.5;
      }

      // Calculate new ratings
      const whiteNewRating = Math.round(
        whiteRating + K * (whiteScore - whiteExpected)
      );
      const blackNewRating = Math.round(
        blackRating + K * (blackScore - blackExpected)
      );

      // Update ratings
      await updatePlayerRating(whitePlayer.id, whiteNewRating);
      await updatePlayerRating(blackPlayer.id, blackNewRating);

      // Record rating changes
      await recordRatingChange({
        gameId,
        playerId: whitePlayer.id,
        oldRating: whiteRating,
        newRating: whiteNewRating,
        delta: whiteNewRating - whiteRating,
      });
      await recordRatingChange({
        gameId,
        playerId: blackPlayer.id,
        oldRating: blackRating,
        newRating: blackNewRating,
        delta: blackNewRating - blackRating,
      });

      // Update player stats
      const whiteStats: any = { gamesPlayed: whitePlayer.gamesPlayed + 1 };
      const blackStats: any = { gamesPlayed: blackPlayer.gamesPlayed + 1 };

      if (result === "white_win") {
        whiteStats.wins = whitePlayer.wins + 1;
        blackStats.losses = blackPlayer.losses + 1;
      } else if (result === "black_win") {
        blackStats.wins = blackPlayer.wins + 1;
        whiteStats.losses = whitePlayer.losses + 1;
      } else {
        whiteStats.draws = whitePlayer.draws + 1;
        blackStats.draws = blackPlayer.draws + 1;
      }

      await updatePlayerStats(whitePlayer.id, whiteStats);
      await updatePlayerStats(blackPlayer.id, blackStats);
      console.log(`[Stats] Updated stats for game ${gameId}:`);
      console.log(`[Stats] White (${whitePlayer.alias}): W${whiteStats.wins || whitePlayer.wins} L${whiteStats.losses || whitePlayer.losses} D${whiteStats.draws || whitePlayer.draws}`);
      console.log(`[Stats] Black (${blackPlayer.alias}): W${blackStats.wins || blackPlayer.wins} L${blackStats.losses || blackPlayer.losses} D${blackStats.draws || blackPlayer.draws}`);
    }
  }

  // Remove from active games
  activeGames.delete(gameId);
}
