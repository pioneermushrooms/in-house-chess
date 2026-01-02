import { eq, desc, sql, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users,
  Player, InsertPlayer, players,
  Game, InsertGame, games,
  RatingChange, InsertRatingChange, ratingChanges,
  MatchmakingQueueEntry, InsertMatchmakingQueueEntry, matchmakingQueue,
  Transaction, InsertTransaction, transactions,
  WagerProposal, InsertWagerProposal, wagerProposals,
  AdminAction, InsertAdminAction, adminActions,
  SyncedSession, InsertSyncedSession, syncedSessions
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByGoogleId(googleId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.googleId, googleId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Player queries
export async function getPlayerByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(players).where(eq(players.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getPlayerByAlias(alias: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(players).where(eq(players.alias, alias)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getPlayerById(playerId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(players).where(eq(players.id, playerId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createPlayer(data: InsertPlayer) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(players).values(data);
  return Number(result[0].insertId);
}

export async function updatePlayerStats(playerId: number, updates: Partial<Player>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(players).set(updates).where(eq(players.id, playerId));
}

export async function updatePlayerRating(playerId: number, newRating: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(players).set({ rating: newRating }).where(eq(players.id, playerId));
}

// Game queries
export async function createGame(data: InsertGame) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(games).values(data);
  return Number(result[0].insertId);
}

export async function getGameById(gameId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(games).where(eq(games.id, gameId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getGameByInviteCode(inviteCode: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(games).where(eq(games.inviteCode, inviteCode)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateGame(gameId: number, updates: Partial<Game>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(games).set(updates).where(eq(games.id, gameId));
}

export async function getPlayerGames(playerId: number, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select().from(games)
    .where(
      sql`${games.whitePlayerId} = ${playerId} OR ${games.blackPlayerId} = ${playerId}`
    )
    .orderBy(sql`${games.createdAt} DESC`)
    .limit(limit);
  return result;
}

// Rating change queries
export async function recordRatingChange(data: InsertRatingChange) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(ratingChanges).values(data);
}

export async function getPlayerRatingHistory(playerId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select().from(ratingChanges)
    .where(eq(ratingChanges.playerId, playerId))
    .orderBy(sql`${ratingChanges.createdAt} DESC`)
    .limit(limit);
  return result;
}

// Matchmaking queue queries
export async function addToMatchmakingQueue(data: InsertMatchmakingQueueEntry) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(matchmakingQueue).values(data);
}

export async function removeFromMatchmakingQueue(playerId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(matchmakingQueue).where(eq(matchmakingQueue.playerId, playerId));
}

export async function getMatchmakingQueueEntry(playerId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(matchmakingQueue)
    .where(eq(matchmakingQueue.playerId, playerId))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function findMatchmakingOpponent(timeControl: string, rating: number, playerId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  // Clean up stale entries (older than 60 seconds)
  await db.delete(matchmakingQueue)
    .where(sql`TIMESTAMPDIFF(SECOND, ${matchmakingQueue.joinedAt}, NOW()) > 60`);
  
  // Find opponent with similar rating (within 200 points) and same time control
  const result = await db.select().from(matchmakingQueue)
    .where(
      sql`${matchmakingQueue.timeControl} = ${timeControl} 
          AND ${matchmakingQueue.playerId} != ${playerId}
          AND ABS(${matchmakingQueue.rating} - ${rating}) <= 200`
    )
    .orderBy(sql`ABS(${matchmakingQueue.rating} - ${rating})`)
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Leaderboard queries
export async function getLeaderboard(limit: number = 10) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(players)
    .orderBy(desc(players.rating))
    .limit(limit);
}

export async function getActiveGames() {
  const db = await getDb();
  if (!db) return [];

  const activeGames = await db
    .select()
    .from(games)
    .where(eq(games.status, "active"))
    .orderBy(desc(games.createdAt))
    .limit(20);

  // Fetch player data for each game
  const gamesWithPlayers = await Promise.all(
    activeGames.map(async (game) => {
      const whitePlayer = game.whitePlayerId
        ? await db.select().from(players).where(eq(players.id, game.whitePlayerId)).limit(1)
        : [];
      const blackPlayer = game.blackPlayerId
        ? await db.select().from(players).where(eq(players.id, game.blackPlayerId)).limit(1)
        : [];

      return {
        ...game,
        whitePlayer: whitePlayer[0] || null,
        blackPlayer: blackPlayer[0] || null,
      };
    })
  );

  return gamesWithPlayers;
}


// ==================== Credit & Transaction Functions ====================

export async function addCredits(playerId: number, amount: number, description: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const player = await db.select().from(players).where(eq(players.id, playerId)).limit(1);
  if (!player.length) throw new Error("Player not found");

  const newBalance = player[0].accountBalance + amount;
  
  await db.update(players)
    .set({ accountBalance: newBalance })
    .where(eq(players.id, playerId));

  await db.insert(transactions).values({
    playerId,
    amount,
    type: "admin_add",
    description,
    balanceAfter: newBalance,
  });
}

export async function removeCredits(playerId: number, amount: number, description: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const player = await db.select().from(players).where(eq(players.id, playerId)).limit(1);
  if (!player.length) throw new Error("Player not found");

  const newBalance = player[0].accountBalance - amount;
  if (newBalance < 0) throw new Error("Insufficient balance");

  await db.update(players)
    .set({ accountBalance: newBalance })
    .where(eq(players.id, playerId));

  await db.insert(transactions).values({
    playerId,
    amount: -amount,
    type: "admin_remove",
    description,
    balanceAfter: newBalance,
  });
}

export async function awardWagerToWinner(winnerPlayerId: number, loserPlayerId: number, stakeAmount: number, gameId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const winner = await db.select().from(players).where(eq(players.id, winnerPlayerId)).limit(1);
  const loser = await db.select().from(players).where(eq(players.id, loserPlayerId)).limit(1);
  
  if (!winner.length || !loser.length) throw new Error("Player not found");

  // Winner gets the total pot (stakeAmount is already the total from both players)
  const winnerNewBalance = winner[0].accountBalance + stakeAmount;

  // Update winner's balance
  await db.update(players)
    .set({ accountBalance: winnerNewBalance })
    .where(eq(players.id, winnerPlayerId));

  // Record winner's transaction
  await db.insert(transactions).values({
    playerId: winnerPlayerId,
    amount: stakeAmount,
    type: "game_win",
    gameId,
    description: `Won ${stakeAmount} credits from ${loser[0].alias}`,
    balanceAfter: winnerNewBalance,
  });

  // Record loser's transaction (no balance change, just for history)
  const perPlayerStake = stakeAmount / 2;
  await db.insert(transactions).values({
    playerId: loserPlayerId,
    amount: -perPlayerStake,
    type: "game_loss",
    gameId,
    description: `Lost ${perPlayerStake} credits to ${winner[0].alias}`,
    balanceAfter: loser[0].accountBalance, // Balance already 0 from locking
  });
}

export async function transferCredits(fromPlayerId: number, toPlayerId: number, amount: number, gameId: number, description: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const fromPlayer = await db.select().from(players).where(eq(players.id, fromPlayerId)).limit(1);
  const toPlayer = await db.select().from(players).where(eq(players.id, toPlayerId)).limit(1);
  
  if (!fromPlayer.length || !toPlayer.length) throw new Error("Player not found");

  const fromNewBalance = fromPlayer[0].accountBalance - amount;
  const toNewBalance = toPlayer[0].accountBalance + amount;

  if (fromNewBalance < 0) throw new Error("Insufficient balance");

  // Deduct from loser
  await db.update(players)
    .set({ accountBalance: fromNewBalance })
    .where(eq(players.id, fromPlayerId));

  await db.insert(transactions).values({
    playerId: fromPlayerId,
    amount: -amount,
    type: "game_loss",
    gameId,
    description,
    balanceAfter: fromNewBalance,
  });

  // Add to winner
  await db.update(players)
    .set({ accountBalance: toNewBalance })
    .where(eq(players.id, toPlayerId));

  await db.insert(transactions).values({
    playerId: toPlayerId,
    amount,
    type: "game_win",
    gameId,
    description,
    balanceAfter: toNewBalance,
  });
}
export async function getAllTransactions(limit: number = 100, playerId?: number, type?: string): Promise<Transaction[]> {
  const db = await getDb();
  if (!db) return [];

  let query = db.select().from(transactions).orderBy(desc(transactions.createdAt)).limit(limit);
  
  if (playerId) {
    query = query.where(eq(transactions.playerId, playerId)) as any;
  }
  
  if (type) {
    query = query.where(eq(transactions.type, type)) as any;
  }

  return await query;
}

export async function getTransactions(playerId: number, limit: number = 20): Promise<Transaction[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(transactions)
    .where(eq(transactions.playerId, playerId))
    .orderBy(desc(transactions.createdAt))
    .limit(limit);
}


export async function getAllPlayers(): Promise<Player[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(players).orderBy(desc(players.rating));
}


// ===== Wager Proposal Functions =====

export async function createWagerProposal(gameId: number, proposerId: number, amount: number): Promise<WagerProposal> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [proposal] = await db.insert(wagerProposals).values({
    gameId,
    proposerId,
    amount,
    status: "pending",
  });

  return db.select().from(wagerProposals)
    .where(eq(wagerProposals.id, proposal.insertId))
    .then(rows => rows[0]);
}

export async function getActiveWagerProposal(gameId: number): Promise<WagerProposal | null> {
  const db = await getDb();
  if (!db) return null;

  const proposals = await db.select().from(wagerProposals)
    .where(eq(wagerProposals.gameId, gameId))
    .orderBy(desc(wagerProposals.createdAt))
    .limit(1);

  return proposals[0] || null;
}

export async function acceptWagerProposal(proposalId: number, gameId: number, whitePlayerId: number, blackPlayerId: number, amount: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Update proposal status
  await db.update(wagerProposals)
    .set({ status: "accepted", acceptedAt: new Date() })
    .where(eq(wagerProposals.id, proposalId));

  // Update game stake amount
  await db.update(games)
    .set({ stakeAmount: amount })
    .where(eq(games.id, gameId));

  // Lock credits from both players
  const whitePlayer = await getPlayerById(whitePlayerId);
  const blackPlayer = await getPlayerById(blackPlayerId);

  if (!whitePlayer || !blackPlayer) {
    throw new Error("Players not found");
  }

  // Deduct from white player
  const whiteNewBalance = whitePlayer.accountBalance - amount;
  await db.update(players)
    .set({ accountBalance: whiteNewBalance })
    .where(eq(players.id, whitePlayerId));

  await db.insert(transactions).values({
    playerId: whitePlayerId,
    amount: -amount,
    type: "wager_locked",
    gameId,
    description: `Wager locked: ${amount} credits`,
    balanceAfter: whiteNewBalance,
  });

  // Deduct from black player
  const blackNewBalance = blackPlayer.accountBalance - amount;
  await db.update(players)
    .set({ accountBalance: blackNewBalance })
    .where(eq(players.id, blackPlayerId));

  await db.insert(transactions).values({
    playerId: blackPlayerId,
    amount: -amount,
    type: "wager_locked",
    gameId,
    description: `Wager locked: ${amount} credits`,
    balanceAfter: blackNewBalance,
  });
}

export async function rejectWagerProposal(proposalId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(wagerProposals)
    .set({ status: "rejected" })
    .where(eq(wagerProposals.id, proposalId));
}

// ============================================================================
// Admin Functions
// ============================================================================

export async function logAdminAction(action: InsertAdminAction): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(adminActions).values(action);
}

export async function getAdminActions(limit: number = 50): Promise<AdminAction[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.select()
    .from(adminActions)
    .orderBy(desc(adminActions.createdAt))
    .limit(limit);
}

export async function getAdminActionCountToday(adminEmail: string): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const actions = await db.select()
    .from(adminActions)
    .where(
      sql`${adminActions.adminEmail} = ${adminEmail} AND ${adminActions.createdAt} >= ${today} AND ${adminActions.actionType} IN ('credit_add', 'credit_remove')`
    );

  return actions.length;
}

// Re-export for use in routers
export { adminActions, transactions as transactionsTable, players as playersTable };
export * from "drizzle-orm";


/**
 * Check if a Stripe session has already been synced
 */
export async function isSessionSynced(sessionId: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const result = await db
    .select()
    .from(syncedSessions)
    .where(eq(syncedSessions.sessionId, sessionId))
    .limit(1);

  return result.length > 0;
}

/**
 * Record a Stripe session as synced
 */
export async function recordSyncedSession(sessionId: string, playerId: number, credits: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.insert(syncedSessions).values({
    sessionId,
    playerId,
    credits,
  });
}


/**
 * Get or create user by email (for Google OAuth)
 */
export async function getOrCreateUserByEmail(data: {
  email: string;
  name: string;
  avatarUrl?: string;
  googleId: string;
}) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Try to find existing user by email or googleId
  const existing = await db
    .select()
    .from(users)
    .where(or(eq(users.email, data.email), eq(users.googleId, data.googleId)))
    .limit(1);

  if (existing.length > 0) {
    const user = existing[0];
    
    // Update user info if changed
    await db
      .update(users)
      .set({
        name: data.name,
        avatarUrl: data.avatarUrl,
        googleId: data.googleId,
        loginMethod: "google",
        lastSignedIn: new Date(),
      })
      .where(eq(users.id, user.id));

    return { ...user, name: data.name, avatarUrl: data.avatarUrl };
  }

  // Create new user
  const result = await db.insert(users).values({
    email: data.email,
    name: data.name,
    avatarUrl: data.avatarUrl,
    googleId: data.googleId,
    loginMethod: "google",
    lastSignedIn: new Date(),
  });

  // Query by email since insertId might be BigInt
  const newUser = await db
    .select()
    .from(users)
    .where(eq(users.email, data.email))
    .limit(1);

  console.log("[OAuth] New user created:", newUser[0].id, newUser[0].email);

  return newUser[0];
}
