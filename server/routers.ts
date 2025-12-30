import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
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
        const player = await db.getPlayerByUserId(input.playerId);
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
        return await db.getPlayerGames(player.id, input.limit);
      }),

    // Get player's rating history
    getRatingHistory: protectedProcedure.query(async ({ ctx }) => {
      const player = await db.getPlayerByUserId(ctx.user.id);
      if (!player) {
        throw new Error("Player profile not found");
      }
      return await db.getPlayerRatingHistory(player.id);
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
    // Create a new game with invite code
    create: protectedProcedure
      .input(z.object({
        timeControl: z.string(),
        initialTime: z.number(),
        increment: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const player = await db.getPlayerByUserId(ctx.user.id);
        if (!player) {
          throw new Error("Player profile not found");
        }

        // Generate unique invite code
        const inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase();

        const gameId = await db.createGame({
          inviteCode,
          whitePlayerId: null,
          blackPlayerId: null,
          timeControl: input.timeControl,
          initialTime: input.initialTime,
          increment: input.increment,
          currentFen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
          moveList: "[]",
          status: "waiting",
          whiteTimeRemaining: input.initialTime * 1000,
          blackTimeRemaining: input.initialTime * 1000,
          isRated: 1,
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

        if (game.status !== "waiting") {
          throw new Error("Game already started");
        }

        // Assign players to colors randomly
        const isWhite = Math.random() < 0.5;
        
        if (!game.whitePlayerId && !game.blackPlayerId) {
          // First player to join
          await db.updateGame(game.id, {
            [isWhite ? "whitePlayerId" : "blackPlayerId"]: player.id,
          });
        } else if (!game.whitePlayerId || !game.blackPlayerId) {
          // Second player joins, game starts
          const updates: any = {
            [game.whitePlayerId ? "blackPlayerId" : "whitePlayerId"]: player.id,
            status: "active",
            startedAt: new Date(),
          };
          await db.updateGame(game.id, updates);
        } else {
          throw new Error("Game is full");
        }

        return { gameId: game.id };
      }),

    // Get game by ID
    getById: protectedProcedure
      .input(z.object({ gameId: z.number() }))
      .query(async ({ input }) => {
        const game = await db.getGameById(input.gameId);
        if (!game) {
          throw new Error("Game not found");
        }
        return game;
      }),
  }),
});

export type AppRouter = typeof appRouter;
