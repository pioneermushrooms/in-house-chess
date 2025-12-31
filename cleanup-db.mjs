#!/usr/bin/env node

/**
 * One-time cleanup script to drop malformed users table
 * This allows drizzle-kit push to create it fresh without interactive prompts
 */

import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('[CLEANUP] ERROR: DATABASE_URL not set');
  process.exit(1);
}

console.log('[CLEANUP] Connecting to database...');

try {
  const connection = await mysql.createConnection(DATABASE_URL);
  
  console.log('[CLEANUP] Dropping malformed users table if it exists...');
  await connection.execute('DROP TABLE IF EXISTS users');
  
  console.log('[CLEANUP] ✅ Cleanup complete - users table dropped');
  await connection.end();
  process.exit(0);
} catch (error) {
  console.error('[CLEANUP] ❌ Error:', error.message);
  process.exit(1);
}
