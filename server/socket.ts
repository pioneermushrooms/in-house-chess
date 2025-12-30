import { Server as HTTPServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import { Chess } from "chess.js";
import {
  getGameById,
  updateGame,
  getPlayerByUserId,
  updatePlayerStats,
  updatePlayerRating,
  recordRatingChange,
} from "./db";
import { getUserByOpenId } from "./db";
import { sdk } from "./_core/sdk";

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
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      credentials: true,
    },
    path: "/socket.io/",
  });

  // Authentication middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
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
      next();
    } catch (error) {
      next(new Error("Authentication failed"));
    }
  });

  io.on("connection", (socket: AuthenticatedSocket) => {
    console.log(`Player ${socket.playerId} connected`);

    // Join a game room
    socket.on("join_game", async (data: { gameId: number }) => {
      try {
        const game = await getGameById(data.gameId);
        if (!game) {
          socket.emit("error", { message: "Game not found" });
          return;
        }

        // Verify player is part of this game
        if (
          game.whitePlayerId !== socket.playerId &&
          game.blackPlayerId !== socket.playerId
        ) {
          socket.emit("error", { message: "Not authorized for this game" });
          return;
        }

        socket.join(`game_${data.gameId}`);

        // Check how many players are in the room
        const room = io.sockets.adapter.rooms.get(`game_${data.gameId}`);
        const playerCount = room ? room.size : 0;

        // Notify all players about the player count
        io.to(`game_${data.gameId}`).emit("player_joined", {
          playerCount,
          bothPlayersPresent: playerCount >= 2,
        });

        // Initialize or restore game state
        let gameState = activeGames.get(data.gameId);
        if (!gameState && game.status === "active") {
          const chess = new Chess(game.currentFen);
          gameState = {
            gameId: data.gameId,
            chess,
            whitePlayerId: game.whitePlayerId!,
            blackPlayerId: game.blackPlayerId!,
            whiteTimeRemaining: game.whiteTimeRemaining!,
            blackTimeRemaining: game.blackTimeRemaining!,
            lastMoveTime: Date.now(),
            currentTurn: chess.turn() === "w" ? "white" : "black",
          };
          activeGames.set(data.gameId, gameState);
          startGameClock(data.gameId, gameState, io);
        }

        // Send current game state
        socket.emit("game_state", {
          fen: game.currentFen,
          moveList: game.moveList ? JSON.parse(game.moveList) : [],
          whiteTimeRemaining: game.whiteTimeRemaining,
          blackTimeRemaining: game.blackTimeRemaining,
          status: game.status,
          result: game.result,
          endReason: game.endReason,
        });
      } catch (error) {
        console.error("Error joining game:", error);
        socket.emit("error", { message: "Failed to join game" });
      }
    });

    // Make a move
    socket.on(
      "make_move",
      async (data: { gameId: number; from: string; to: string; promotion?: string }) => {
        try {
          const gameState = activeGames.get(data.gameId);
          if (!gameState) {
            socket.emit("error", { message: "Game not active" });
            return;
          }

          // Verify it's the player's turn
          const isWhiteTurn = gameState.chess.turn() === "w";
          const isPlayerWhite = socket.playerId === gameState.whitePlayerId;

          if (isWhiteTurn !== isPlayerWhite) {
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

          if (isWhiteTurn) {
            gameState.whiteTimeRemaining -= timeElapsed;
          } else {
            gameState.blackTimeRemaining -= timeElapsed;
          }
          gameState.lastMoveTime = now;
          gameState.currentTurn = gameState.chess.turn() === "w" ? "white" : "black";

          // Get move list
          const game = await getGameById(data.gameId);
          const moveList = game?.moveList ? JSON.parse(game.moveList) : [];
          moveList.push(move.san);

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
          io.to(`game_${data.gameId}`).emit("move_made", {
            move: move.san,
            fen: gameState.chess.fen(),
            whiteTimeRemaining: gameState.whiteTimeRemaining,
            blackTimeRemaining: gameState.blackTimeRemaining,
            status,
            result,
            endReason,
          });
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
      gameState.whiteTimeRemaining -= 100; // Decrement by 100ms
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
      gameState.blackTimeRemaining -= 100;
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
    const whitePlayer = await getPlayerByUserId(gameState.whitePlayerId);
    const blackPlayer = await getPlayerByUserId(gameState.blackPlayerId);

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
    }
  }

  // Remove from active games
  activeGames.delete(gameId);
}
