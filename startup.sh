#!/bin/bash
set -e

echo "[STARTUP] Starting Railway deployment..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "[STARTUP] ERROR: DATABASE_URL is not set"
  exit 1
fi

echo "[STARTUP] DATABASE_URL is set (length: ${#DATABASE_URL})"

# Run database migrations
echo "[STARTUP] Running database migrations..."
pnpm drizzle-kit push --force || {
  echo "[STARTUP] WARNING: Migration failed, but continuing..."
}

# Start the application
echo "[STARTUP] Starting application..."
exec node dist/index.js
