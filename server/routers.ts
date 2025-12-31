import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    /**
     * Guest login - create a session without OAuth
     */
    guestLogin: publicProcedure
      .input(z.object({ username: z.string().min(1).max(50) }))
      .mutation(async ({ input, ctx }) => {
        const { username } = input;
        // Create a guest openId based on username
        const guestOpenId = `guest_${username.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
        
        // Create or update guest user
        await db.upsertUser({
          openId: guestOpenId,
          name: username,
          email: null,
          loginMethod: 'guest',
          lastSignedIn: new Date(),
        });
        
        // Set simple session cookie (just store the openId, no JWT needed)
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, guestOpenId, { ...cookieOptions, maxAge: ONE_YEAR_MS });
        
        return { success: true, username };
      }),
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  player: router({
    // Get current player profile
    getProfile: protectedProcedure.query(async ({ ctx }) => {
      return await db.getPlayerByUserId(ctx.user.id);
    }),

    // Get or create player profile for current user
    getOrCreate: protectedProcedure.query(async ({ ctx }) => {
      let player = await db.getPlayerByUserId(ctx.user.id);
      
      // If player doesn't exist, return null (frontend will prompt for alias)
      if (!player) {
        return null;
      }
      
      return player;
    }),

    // Create player profile with alias
    create: protectedProcedure
      .input(z.object({ alias: z.string().min(3).max(64) }))
      .mutation(async ({ ctx, input }) => {
        // Check if player already exists
        const existing = await db.getPlayerByUserId(ctx.user.id);
        if (existing) {
          throw new Error("Player profile already exists");
        }

        // Check if alias is taken
        const aliasTaken = await db.getPlayerByAlias(input.alias);
        if (aliasTaken) {
          throw new Error("Alias already taken");
        }

        const playerId = await db.createPlayer({
          userId: ctx.user.id,
          alias: input.alias,
          rating: 1200,
          wins: 0,
          losses: 0,
          draws: 0,
          gamesPlayed: 0,
        });

        return await db.getPlayerByUserId(ctx.user.id);
      }),

    // Update alias
    updateAlias: protectedProcedure
      .input(z.object({ alias: z.string().min(3).max(64) }))
      .mutation(async ({ ctx, input }) => {
        const player = await db.getPlayerByUserId(ctx.user.id);
        if (!player) {
          throw new Error("Player profile not found");
        }

        // Check if new alias is taken
        const aliasTaken = await db.getPlayerByAlias(input.alias);
        if (aliasTaken && aliasTaken.id !== player.id) {
          throw new Error("Alias already taken");
        }

        await db.updatePlayerStats(player.id, { alias: input.alias });
        return await db.getPlayerByUserId(ctx.user.id);
      }),

    // Get player profile by ID
    getById: publicProcedure
      .input(z.object({ playerId: z.number() }))
      .query(async ({ input }) => {
        const player = await db.getPlayerById(input.playerId);
        if (!player) {
          throw new Error("Player not found");
        }
        return player;
      }),

    // Get player's game history
    getGames: protectedProcedure
      .input(z.object({ limit: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        const player = await db.getPlayerByUserId(ctx.user.id);
        if (!player) {
          throw new Error("Player profile not found");
        }
        const games = await db.getPlayerGames(player.id, input.limit);
        
        // Fetch player data for each game
        const gamesWithPlayers = await Promise.all(
          games.map(async (game) => {
            const whitePlayer = game.whitePlayerId ? await db.getPlayerById(game.whitePlayerId) : null;
            const blackPlayer = game.blackPlayerId ? await db.getPlayerById(game.blackPlayerId) : null;
            return {
              ...game,
              whitePlayer,
              blackPlayer,
            };
          })
        );
        
        return gamesWithPlayers;
      }),

    // Get games for a specific player by ID (public)
    getPlayerGames: publicProcedure
      .input(z.object({ playerId: z.number(), limit: z.number().optional() }))
      .query(async ({ input }) => {
        const games = await db.getPlayerGames(input.playerId, input.limit);
        
        // Fetch player data for each game
        const gamesWithPlayers = await Promise.all(
          games.map(async (game) => {
            const whitePlayer = game.whitePlayerId ? await db.getPlayerById(game.whitePlayerId) : null;
            const blackPlayer = game.blackPlayerId ? await db.getPlayerById(game.blackPlayerId) : null;
            return {
              ...game,
              whitePlayer,
              blackPlayer,
            };
          })
        );
        return gamesWithPlayers;
      }),

    // Get player's rating history
    getRatingHistory: protectedProcedure.query(async ({ ctx }) => {
      const player = await db.getPlayerByUserId(ctx.user.id);
      if (!player) {
        throw new Error("Player profile not found");
      }
      return await db.getPlayerRatingHistory(player.id);
    }),

    // Get player's canvas data
    getCanvasData: publicProcedure
      .input(z.object({ playerId: z.number() }))
      .query(async ({ input }) => {
        const player = await db.getPlayerById(input.playerId);
        if (!player) {
          return null;
        }
        return { data: player.canvasData };
      }),

    // Save player's canvas data
    saveCanvasData: publicProcedure
      .input(z.object({ playerId: z.number(), data: z.string() }))
      .mutation(async ({ input }) => {
        await db.updatePlayerStats(input.playerId, { canvasData: input.data });
        return { success: true };
      }),
  }),

  leaderboard: router({
    // Get top players
    getTop: publicProcedure
      .input(z.object({ limit: z.number().optional() }))
      .query(async ({ input }) => {
        return await db.getLeaderboard(input.limit);
      }),
  }),

  game: router({
    // Create a new game vs computer
    createComputerGame: protectedProcedure
      .input(z.object({
        timeControl: z.string(),
        initialTime: z.number(),
        increment: z.number(),
        difficulty: z.enum(['easy', 'medium', 'hard']),
        playerColor: z.enum(['white', 'black']),
      }))
      .mutation(async ({ ctx, input }) => {
        const player = await db.getPlayerByUserId(ctx.user.id);
        if (!player) {
          throw new Error("Player profile not found");
        }

        const gameId = await db.createGame({
          inviteCode: null,
          whitePlayerId: input.playerColor === 'white' ? player.id : null,
          blackPlayerId: input.playerColor === 'black' ? player.id : null,
          timeControl: input.timeControl,
          initialTime: input.initialTime,
          increment: input.increment,
          currentFen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
          moveList: "[]",
          status: "active",
          whiteTimeRemaining: input.initialTime * 1000,
          blackTimeRemaining: input.initialTime * 1000,
          isRated: 0, // Computer games are unrated
          isComputerGame: 1,
          computerDifficulty: input.difficulty,
        });

        return { gameId };
      }),

    // Create a new game with invite code
    create: protectedProcedure
      .input(z.object({
        timeControl: z.string(),
        initialTime: z.number(),
        increment: z.number(),
        stakeAmount: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const player = await db.getPlayerByUserId(ctx.user.id);
        if (!player) {
          throw new Error("Player profile not found");
        }

        // Validate stake amount
        const stake = input.stakeAmount || 0;
        if (stake > 0 && player.accountBalance < stake) {
          throw new Error(`Insufficient balance. You have ${player.accountBalance} credits.`);
        }

        // Generate unique invite code
        const inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase();

        const gameId = await db.createGame({
          inviteCode,
          whitePlayerId: player.id, // Creator is white
          blackPlayerId: null, // Waiting for opponent
          timeControl: input.timeControl,
          initialTime: input.initialTime,
          increment: input.increment,
          currentFen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
          moveList: "[]",
          status: "waiting",
          whiteTimeRemaining: input.initialTime * 1000,
          blackTimeRemaining: input.initialTime * 1000,
          isRated: 1,
          stakeAmount: stake,
        });

        return { gameId, inviteCode };
      }),

    // Join a game by invite code
    join: protectedProcedure
      .input(z.object({ inviteCode: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const player = await db.getPlayerByUserId(ctx.user.id);
        if (!player) {
          throw new Error("Player profile not found");
        }

        const game = await db.getGameByInviteCode(input.inviteCode);
        if (!game) {
          throw new Error("Game not found");
        }

        // Allow joining if game is waiting OR active but no moves made yet
        const moveList = game.moveList ? JSON.parse(game.moveList) : [];
        const hasStarted = moveList.length > 0;
        
        if (game.status === "completed" || game.status === "abandoned") {
          throw new Error("Game has ended");
        }
        
        if (hasStarted) {
          throw new Error("Game already started");
        }
        
        // Check if game is full
        if (game.whitePlayerId && game.blackPlayerId) {
          throw new Error("Game is full");
        }

        // Assign player to the empty slot
        const updates: any = {};
        
        if (!game.whitePlayerId) {
          updates.whitePlayerId = player.id;
        } else if (!game.blackPlayerId) {
          updates.blackPlayerId = player.id;
          // Second player joins, mark game as active
          updates.status = "active";
          updates.startedAt = new Date();
        }
        
        await db.updateGame(game.id, updates);

        return { gameId: game.id };
      }),
    // Get active games
    getActive: publicProcedure.query(async () => {
      return await db.getActiveGames();
    }),

    // Get game by ID with player data
    getById: publicProcedure
      .input(z.object({ gameId: z.number() }))
      .query(async ({ input }) => {
        const game = await db.getGameById(input.gameId);
        if (!game) {
          throw new Error("Game not found");
        }

        // Fetch player data
        const whitePlayer = game.whitePlayerId ? await db.getPlayerById(game.whitePlayerId) : null;
        const blackPlayer = game.blackPlayerId ? await db.getPlayerById(game.blackPlayerId) : null;

        return {
          ...game,
          whitePlayer,
          blackPlayer,
        };
      }),
  }),

  // Matchmaking router
  matchmaking: router({
    // Join matchmaking queue
    join: protectedProcedure
      .input(z.object({ timeControl: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const player = await db.getPlayerByUserId(ctx.user.id);
        if (!player) {
          throw new Error("Player profile not found");
        }

        // Add to queue
        await db.addToMatchmakingQueue({
          playerId: player.id,
          rating: player.rating,
          timeControl: input.timeControl,
        });

        // Try to find a match immediately
        const opponent = await db.findMatchmakingOpponent(input.timeControl, player.rating, player.id);
        
        if (opponent) {
          // Remove both players from queue
          await db.removeFromMatchmakingQueue(player.id);
          await db.removeFromMatchmakingQueue(opponent.playerId);

          // Randomly assign colors
          const [whitePlayerId, blackPlayerId] = Math.random() < 0.5 
            ? [player.id, opponent.playerId] 
            : [opponent.playerId, player.id];

          // Parse time control (e.g., "10+0" -> 10 minutes, 0 increment)
          const [initialMinutes, increment] = input.timeControl.split("+").map(Number);
          const initialTime = initialMinutes * 60; // Convert to seconds

          // Create game
          const gameId = await db.createGame({
            whitePlayerId,
            blackPlayerId,
            timeControl: input.timeControl,
            initialTime,
            increment,
            currentFen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
            moveList: "[]",
            status: "active",
            whiteTimeRemaining: initialTime * 1000,
            blackTimeRemaining: initialTime * 1000,
            isRated: 1,
          });

          return { matched: true, gameId, opponentId: opponent.playerId };
        }

        return { matched: false };
      }),

    // Leave matchmaking queue
    leave: protectedProcedure.mutation(async ({ ctx }) => {
      const player = await db.getPlayerByUserId(ctx.user.id);
      if (!player) {
        throw new Error("Player profile not found");
      }

      await db.removeFromMatchmakingQueue(player.id);
      return { success: true };
    }),

    // Check queue status
    status: protectedProcedure.query(async ({ ctx }) => {
      const player = await db.getPlayerByUserId(ctx.user.id);
      if (!player) {
        return { inQueue: false };
      }

      const entry = await db.getMatchmakingQueueEntry(player.id);
      return { 
        inQueue: !!entry,
        timeControl: entry?.timeControl,
        joinedAt: entry?.joinedAt,
      };
    }),
   }),

  admin: router({
    // Add credits to a player (admin only)
    addCredits: protectedProcedure
      .input(z.object({
        playerId: z.number(),
        amount: z.number().positive(),
        description: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Unauthorized: Admin access required');
        }
        await db.addCredits(input.playerId, input.amount, input.description);
        return { success: true };
      }),

    // Remove credits from a player (admin only)
    removeCredits: protectedProcedure
      .input(z.object({
        playerId: z.number(),
        amount: z.number().positive(),
        description: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Unauthorized: Admin access required');
        }
        await db.removeCredits(input.playerId, input.amount, input.description);
        return { success: true };
      }),

    // Get all players for admin panel
    getAllPlayers: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('Unauthorized: Admin access required');
      }
      return await db.getAllPlayers();
    }),
  }),
});
export type AppRouter = typeof appRouter;
