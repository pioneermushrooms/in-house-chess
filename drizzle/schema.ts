import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Chess player profile extension.
 * Stores chess-specific data like alias, rating, and game statistics.
 */
export const players = mysqlTable("players", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  alias: varchar("alias", { length: 64 }).notNull().unique(),
  rating: int("rating").default(1200).notNull(),
  wins: int("wins").default(0).notNull(),
  losses: int("losses").default(0).notNull(),
  draws: int("draws").default(0).notNull(),
  gamesPlayed: int("gamesPlayed").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Player = typeof players.$inferSelect;
export type InsertPlayer = typeof players.$inferInsert;

/**
 * Chess games table.
 * Stores game state, moves, and metadata for each chess match.
 */
export const games = mysqlTable("games", {
  id: int("id").autoincrement().primaryKey(),
  inviteCode: varchar("inviteCode", { length: 16 }).unique(),
  whitePlayerId: int("whitePlayerId").references(() => players.id),
  blackPlayerId: int("blackPlayerId").references(() => players.id),
  timeControl: varchar("timeControl", { length: 16 }).notNull(), // e.g., "10+0", "5+3"
  initialTime: int("initialTime").notNull(), // in seconds
  increment: int("increment").notNull(), // in seconds
  currentFen: text("currentFen").notNull(),
  moveList: text("moveList").notNull(), // JSON array of moves in SAN notation
  status: mysqlEnum("status", ["waiting", "active", "completed", "abandoned"]).default("waiting").notNull(),
  result: mysqlEnum("result", ["white_win", "black_win", "draw", "abandoned"]),
  endReason: varchar("endReason", { length: 64 }), // "checkmate", "timeout", "resignation", "stalemate", etc.
  whiteTimeRemaining: int("whiteTimeRemaining"), // in milliseconds
  blackTimeRemaining: int("blackTimeRemaining"), // in milliseconds
  lastMoveAt: timestamp("lastMoveAt"),
  isRated: int("isRated").default(1).notNull(), // 1 for rated, 0 for unrated
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  startedAt: timestamp("startedAt"),
  endedAt: timestamp("endedAt"),
});

export type Game = typeof games.$inferSelect;
export type InsertGame = typeof games.$inferInsert;

/**
 * Rating changes table.
 * Tracks Elo rating adjustments after each rated game.
 */
export const ratingChanges = mysqlTable("ratingChanges", {
  id: int("id").autoincrement().primaryKey(),
  gameId: int("gameId").notNull().references(() => games.id),
  playerId: int("playerId").notNull().references(() => players.id),
  oldRating: int("oldRating").notNull(),
  newRating: int("newRating").notNull(),
  delta: int("delta").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type RatingChange = typeof ratingChanges.$inferSelect;
export type InsertRatingChange = typeof ratingChanges.$inferInsert;

/**
 * Matchmaking queue table.
 * Stores players waiting for quick play matchmaking.
 */
export const matchmakingQueue = mysqlTable("matchmakingQueue", {
  id: int("id").autoincrement().primaryKey(),
  playerId: int("playerId").notNull().references(() => players.id),
  timeControl: varchar("timeControl", { length: 16 }).notNull(),
  rating: int("rating").notNull(),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
});

export type MatchmakingQueueEntry = typeof matchmakingQueue.$inferSelect;
export type InsertMatchmakingQueueEntry = typeof matchmakingQueue.$inferInsert;