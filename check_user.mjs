import { drizzle } from "drizzle-orm/mysql2";
import { users, players } from "./drizzle/schema.js";
import { eq } from "drizzle-orm";

const db = drizzle(process.env.DATABASE_URL);

const allUsers = await db.select().from(users).limit(5);
console.log("Users:", JSON.stringify(allUsers, null, 2));

const allPlayers = await db.select().from(players).limit(5);
console.log("\nPlayers:", JSON.stringify(allPlayers, null, 2));

process.exit(0);
