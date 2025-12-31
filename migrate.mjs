#!/usr/bin/env node

/**
 * Startup migration script for Railway deployment
 * Runs drizzle-kit push to sync database schema before server starts
 */

import { execSync } from 'child_process';

console.log('[MIGRATE] Starting database migration...');

try {
  // Run drizzle-kit push with --force flag to skip interactive prompts
  execSync('pnpm drizzle-kit push --force', {
    stdio: 'inherit',
    env: { ...process.env, FORCE: 'true' }
  });
  
  console.log('[MIGRATE] ✅ Database migration completed successfully');
  process.exit(0);
} catch (error) {
  console.error('[MIGRATE] ❌ Migration failed:', error.message);
  process.exit(1);
}
