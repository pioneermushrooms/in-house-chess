import { eq, desc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users,
  Player, InsertPlayer, players,
  Game, InsertGame, games,
  RatingChange, InsertRatingChange, ratingChanges,
  MatchmakingQueueEntry, InsertMatchmakingQueueEntry, matchmakingQueue
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

export async function findMatchmakingOpponent(timeControl: string, rating: number, playerId: number) {
  const db = await getDb();
  if (!db) return undefined;
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
