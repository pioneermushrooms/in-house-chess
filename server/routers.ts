import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import Stripe from "stripe";
import { CREDIT_PACKAGES, getTotalCredits } from "../shared/creditPackages";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-12-15.clover",
});

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

        // Give new players 100 starting credits
        await db.addCredits(playerId, 100, "Welcome bonus - starting credits");

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

    // Get player's transaction history
    getTransactions: protectedProcedure
      .input(z.object({ limit: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        const player = await db.getPlayerByUserId(ctx.user.id);
        if (!player) {
          throw new Error('Player profile not found');
        }
        return await db.getTransactions(player.id, input.limit || 50);
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

    // Update payout method
    updatePayoutMethod: protectedProcedure
      .input(z.object({ 
        payoutMethod: z.string().min(1).max(255),
        payoutMethodType: z.enum(['venmo', 'paypal', 'zelle'])
      }))
      .mutation(async ({ ctx, input }) => {
        const player = await db.getPlayerByUserId(ctx.user.id);
        if (!player) {
          throw new Error('Player profile not found');
        }
        await db.updatePlayerPayoutMethod(player.id, input.payoutMethod, input.payoutMethodType);
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

          // Notify both players via socket
          const io = (global as any).io;
          if (io) {
            // Notify the opponent (who was waiting in queue)
            io.to(`player_${opponent.playerId}`).emit('match_found', {
              gameId,
              opponentId: player.id,
            });
          }

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

  payment: router({
    // Get available credit packages
    getPackages: publicProcedure.query(() => {
      return CREDIT_PACKAGES;
    }),

    // Manual sync - fetch recent Stripe payments and add missing credits
    syncPayments: protectedProcedure.mutation(async ({ ctx }) => {
      if (!stripe) {
        throw new Error('Stripe not configured');
      }

      const player = await db.getPlayerByUserId(ctx.user.id);
      if (!player) {
        throw new Error('Player not found');
      }

      // Fetch recent checkout sessions for this user
      const sessions = await stripe.checkout.sessions.list({
        limit: 10,
      });

      let syncedCount = 0;
      for (const session of sessions.data) {
        if (session.payment_status === 'paid' && session.metadata?.player_id === player.id.toString()) {
          const credits = parseInt(session.metadata.credits || '0');
          const packageId = session.metadata.package_id || 'unknown';
          
          // Check if this session was already synced using dedicated table
          const alreadySynced = await db.isSessionSynced(session.id);

          if (alreadySynced) {
            console.log(`[Sync] Session ${session.id} already synced, skipping`);
            continue;
          }
          
          // Add credits
          await db.addCredits(
            player.id,
            credits,
            `Purchased ${credits} credits (${packageId} package) via Stripe - Session ${session.id}`
          );
          
          // Record this session as synced
          await db.recordSyncedSession(session.id, player.id, credits);
          
          syncedCount++;
        }
      }

      return { syncedCount, message: `Synced ${syncedCount} payment(s)` };
    }),

    // Create Stripe checkout session for credit purchase
    createCheckoutSession: protectedProcedure
      .input(z.object({
        packageId: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const pkg = CREDIT_PACKAGES.find(p => p.id === input.packageId);
        if (!pkg) {
          throw new Error('Invalid package ID');
        }

        const player = await db.getPlayerByUserId(ctx.user.id);
        if (!player) {
          throw new Error('Player profile not found');
        }

        const totalCredits = getTotalCredits(pkg);
        const origin = ctx.req.headers.origin || 'http://localhost:3000';

        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          line_items: [
            {
              price_data: {
                currency: 'usd',
                product_data: {
                  name: pkg.name,
                  description: `${totalCredits} credits for In-House Chess Club${pkg.bonus > 0 ? ` (includes ${pkg.bonus} bonus credits!)` : ''}`,
                },
                unit_amount: pkg.priceUsd,
              },
              quantity: 1,
            },
          ],
          mode: 'payment',
          success_url: `${origin}/lobby?payment=success`,
          cancel_url: `${origin}/buy-credits?payment=cancelled`,
          customer_email: ctx.user.email || undefined,
          client_reference_id: ctx.user.id.toString(),
          metadata: {
            user_id: ctx.user.id.toString(),
            player_id: player.id.toString(),
            package_id: pkg.id,
            credits: totalCredits.toString(),
            customer_email: ctx.user.email || '',
            customer_name: ctx.user.name || '',
          },
          allow_promotion_codes: true,
        });

        return { url: session.url };
      }),

    // Request cashout with security limits
    requestCashout: protectedProcedure
      .input(z.object({ 
        amount: z.number().min(100).max(500) // Min $1, Max $5 per transaction
      }))
      .mutation(async ({ input, ctx }) => {
        const player = await db.getPlayerByUserId(ctx.user.id);
        if (!player) {
          throw new Error('Player profile not found');
        }

        // Check if player has set payout method
        if (!player.payoutMethod || !player.payoutMethodType) {
          throw new Error('Please set your payout method in your profile before requesting a cashout');
        }

        // Security: Check daily cashout limit (10 transactions per day)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const allCashouts = await db.getAllCashouts(100);
        const todayCashouts = allCashouts.filter(
          (c: any) => 
            c.playerId === player.id &&
            new Date(c.createdAt) >= today
        );

        if (todayCashouts.length >= 10) {
          throw new Error('Daily cashout limit reached (10 transactions per day). Please try again tomorrow.');
        }

        // Check if player has enough credits
        if (player.accountBalance < input.amount) {
          throw new Error('Insufficient credits for cashout');
        }

        // Deduct credits immediately
        const newBalance = player.accountBalance - input.amount;
        await db.updatePlayerStats(player.id, { accountBalance: newBalance });
        
        // Create cashout transaction record
        await db.addCredits(
          player.id,
          -input.amount,
          `Cashout request for $${(input.amount / 100).toFixed(2)} USD via ${player.payoutMethodType}`
        );

        // Create cashout request for admin processing
        const usdAmount = (input.amount / 100).toFixed(2);
        await db.createCashoutRequest({
          playerId: player.id,
          amount: input.amount,
          usdAmount,
          payoutMethod: player.payoutMethod,
          payoutMethodType: player.payoutMethodType,
          status: 'pending',
        });

        // TODO: Send notification to admin
        
        return {
          success: true,
          amount: input.amount,
          usdAmount,
          remainingToday: 10 - (todayCashouts.length + 1),
          message: `Cashout request submitted for $${usdAmount} to your ${player.payoutMethodType} account. Admin will process it within 1-2 business days. You have ${10 - (todayCashouts.length + 1)} cashouts remaining today.`,
        };
      }),
  }),

  wager: router({
    // Propose a wager for a game
    propose: protectedProcedure
      .input(z.object({
        gameId: z.number(),
        amount: z.number().min(1),
      }))
      .mutation(async ({ input, ctx }) => {
        const { gameId, amount } = input;
        const player = await db.getPlayerByUserId(ctx.user.id);
        if (!player) {
          throw new Error('Player not found');
        }

        // Check if player has enough credits
        if (player.accountBalance < amount) {
          throw new Error('Insufficient credits');
        }

        // Check if there's already an active proposal
        const existingProposal = await db.getActiveWagerProposal(gameId);
        if (existingProposal && existingProposal.status === 'pending') {
          throw new Error('There is already a pending wager proposal');
        }

        // Get game to verify player is in it
        const game = await db.getGameById(gameId);
        if (!game) {
          throw new Error('Game not found');
        }

        if (game.whitePlayerId !== player.id && game.blackPlayerId !== player.id) {
          throw new Error('You are not a player in this game');
        }

        if (game.status !== 'active') {
          throw new Error('Can only propose wagers on active games');
        }

        if (game.stakeAmount > 0) {
          throw new Error('This game already has a wager');
        }

        const proposal = await db.createWagerProposal(gameId, player.id, amount);
        return proposal;
      }),

    // Get active wager proposal for a game
    getProposal: publicProcedure
      .input(z.object({ gameId: z.number() }))
      .query(async ({ input }) => {
        return await db.getActiveWagerProposal(input.gameId);
      }),

    // Accept a wager proposal
    accept: protectedProcedure
      .input(z.object({ proposalId: z.number(), gameId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const { proposalId, gameId } = input;
        const player = await db.getPlayerByUserId(ctx.user.id);
        if (!player) {
          throw new Error('Player not found');
        }

        const proposal = await db.getActiveWagerProposal(gameId);
        if (!proposal || proposal.id !== proposalId) {
          throw new Error('Proposal not found');
        }

        if (proposal.status !== 'pending') {
          throw new Error('Proposal is no longer pending');
        }

        // Get game
        const game = await db.getGameById(gameId);
        if (!game) {
          throw new Error('Game not found');
        }

        // Verify acceptor is the other player
        if (proposal.proposerId === player.id) {
          throw new Error('Cannot accept your own proposal');
        }

        if (game.whitePlayerId !== player.id && game.blackPlayerId !== player.id) {
          throw new Error('You are not a player in this game');
        }

        // Check if acceptor has enough credits
        if (player.accountBalance < proposal.amount) {
          throw new Error('Insufficient credits to accept wager');
        }

        // Accept the proposal (locks credits from both players)
        await db.acceptWagerProposal(
          proposalId,
          gameId,
          game.whitePlayerId!,
          game.blackPlayerId!,
          proposal.amount
        );

        return { success: true };
      }),

    // Reject a wager proposal
    reject: protectedProcedure
      .input(z.object({ proposalId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const { proposalId } = input;
        const player = await db.getPlayerByUserId(ctx.user.id);
        if (!player) {
          throw new Error('Player not found');
        }

        await db.rejectWagerProposal(proposalId);
        return { success: true };
      }),
  }),

  admin: router({
    // Check if user is admin
    isAdmin: protectedProcedure.query(async ({ ctx }) => {
      const ADMIN_EMAIL = 'schuldt91@gmail.com';
      return ctx.user.email === ADMIN_EMAIL;
    }),

    // Get all players (admin only)
    getAllPlayers: protectedProcedure.query(async ({ ctx }) => {
      const ADMIN_EMAIL = 'schuldt91@gmail.com';
      if (ctx.user.email !== ADMIN_EMAIL) {
        throw new Error('Unauthorized: Admin access required');
      }
      return await db.getAllPlayers();
    }),

    // Adjust player credits (admin only)
    adjustCredits: protectedProcedure
      .input(z.object({
        playerId: z.number(),
        amount: z.number().min(-500).max(500), // Max $5 worth of credits
        reason: z.string().min(5),
      }))
      .mutation(async ({ input, ctx }) => {
        const ADMIN_EMAIL = 'schuldt91@gmail.com';
        if (ctx.user.email !== ADMIN_EMAIL) {
          throw new Error('Unauthorized: Admin access required');
        }

        // Check daily limit (10 admin transactions per day)
        const actionsToday = await db.getAdminActionCountToday(ctx.user.email);
        if (actionsToday >= 10) {
          throw new Error('Daily admin transaction limit reached (10 per day). Please try again tomorrow.');
        }

        const player = await db.getPlayerById(input.playerId);
        if (!player) {
          throw new Error('Player not found');
        }

        const newBalance = player.accountBalance + input.amount;
        if (newBalance < 0) {
          throw new Error('Cannot reduce balance below zero');
        }

        // Use addCredits which handles both balance update and transaction creation
        await db.addCredits(
          input.playerId,
          input.amount,
          `Admin adjustment: ${input.reason}`
        );

        await db.logAdminAction({
          adminEmail: ctx.user.email,
          actionType: input.amount > 0 ? 'credit_add' : 'credit_remove',
          targetPlayerId: input.playerId,
          amount: input.amount,
          reason: input.reason,
        });

        return {
          success: true,
          newBalance,
          remainingToday: 10 - (actionsToday + 1),
        };
      }),

    // Get admin action log
    getAdminActions: protectedProcedure
      .input(z.object({ limit: z.number().optional() }))
      .query(async ({ input, ctx }) => {
        const ADMIN_EMAIL = 'schuldt91@gmail.com';
        if (ctx.user.email !== ADMIN_EMAIL) {
          throw new Error('Unauthorized: Admin access required');
        }

        return await db.getAdminActions(input.limit || 50);
      }),

    // Get all transactions (admin only)
    getAllTransactions: protectedProcedure
      .input(z.object({
        limit: z.number().optional(),
        playerId: z.number().optional(),
        type: z.string().optional(),
      }))
      .query(async ({ input, ctx }) => {
        const ADMIN_EMAIL = 'schuldt91@gmail.com';
        if (ctx.user.email !== ADMIN_EMAIL) {
          throw new Error('Unauthorized: Admin access required');
        }

        return await db.getAllTransactions(input.limit || 100, input.playerId, input.type);
      }),

    // Get system stats (admin only)
    getSystemStats: protectedProcedure.query(async ({ ctx }) => {
      const ADMIN_EMAIL = 'schuldt91@gmail.com';
      if (ctx.user.email !== ADMIN_EMAIL) {
        throw new Error('Unauthorized: Admin access required');
      }

      const players = await db.getAllPlayers();
      const totalCredits = players.reduce((sum, p) => sum + p.accountBalance, 0);
      const totalGames = players.reduce((sum, p) => sum + p.gamesPlayed, 0);
      const totalWins = players.reduce((sum, p) => sum + p.wins, 0);
      
      return {
        totalPlayers: players.length,
        totalCredits,
        totalGames,
        totalWins,
        averageRating: Math.round(players.reduce((sum, p) => sum + p.rating, 0) / players.length),
      };
    }),

    // Get pending cashouts (admin only)
    getPendingCashouts: protectedProcedure.query(async ({ ctx }) => {
      const ADMIN_EMAIL = 'schuldt91@gmail.com';
      if (ctx.user.email !== ADMIN_EMAIL) {
        throw new Error('Unauthorized: Admin access required');
      }
      const cashouts = await db.getPendingCashouts();
      // Fetch player data for each cashout
      const cashoutsWithPlayers = await Promise.all(
        cashouts.map(async (cashout) => {
          const player = await db.getPlayerById(cashout.playerId);
          return { ...cashout, player };
        })
      );
      return cashoutsWithPlayers;
    }),

    // Get all cashouts (admin only)
    getAllCashouts: protectedProcedure
      .input(z.object({ limit: z.number().optional() }))
      .query(async ({ input, ctx }) => {
        const ADMIN_EMAIL = 'schuldt91@gmail.com';
        if (ctx.user.email !== ADMIN_EMAIL) {
          throw new Error('Unauthorized: Admin access required');
        }
        const cashouts = await db.getAllCashouts(input.limit || 50);
        // Fetch player data for each cashout
        const cashoutsWithPlayers = await Promise.all(
          cashouts.map(async (cashout) => {
            const player = await db.getPlayerById(cashout.playerId);
            return { ...cashout, player };
          })
        );
        return cashoutsWithPlayers;
      }),

    // Complete cashout (admin only)
    completeCashout: protectedProcedure
      .input(z.object({ 
        cashoutId: z.number(),
        notes: z.string().optional()
      }))
      .mutation(async ({ input, ctx }) => {
        const ADMIN_EMAIL = 'schuldt91@gmail.com';
        if (ctx.user.email !== ADMIN_EMAIL) {
          throw new Error('Unauthorized: Admin access required');
        }
        await db.completeCashout(input.cashoutId, ctx.user.email, input.notes);
        return { success: true };
      }),

    // Fail cashout and refund credits (admin only)
    failCashout: protectedProcedure
      .input(z.object({ 
        cashoutId: z.number(),
        notes: z.string().min(5)
      }))
      .mutation(async ({ input, ctx }) => {
        const ADMIN_EMAIL = 'schuldt91@gmail.com';
        if (ctx.user.email !== ADMIN_EMAIL) {
          throw new Error('Unauthorized: Admin access required');
        }
        // Get cashout details to refund credits
        const cashouts = await db.getAllCashouts(1000);
        const cashout = cashouts.find((c: any) => c.id === input.cashoutId);
        if (!cashout) {
          throw new Error('Cashout not found');
        }
        // Refund credits to player
        await db.addCredits(
          cashout.playerId,
          cashout.amount,
          `Cashout failed - refund: ${input.notes}`
        );
        // Mark cashout as failed
        await db.failCashout(input.cashoutId, ctx.user.email, input.notes);
        return { success: true };
      }),
  }),
});
export type AppRouter = typeof appRouter;
