/**
 * Type-only exports for client-side tRPC usage
 * This file contains NO runtime code, only TypeScript types
 * This prevents server-side dependencies (like jose/crypto) from being bundled into the client
 */

import type { appRouter } from "./routers";

export type AppRouter = typeof appRouter;
