import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  // Try Passport.js session first
  if (opts.req.user) {
    user = opts.req.user as User;
    console.log("[Context] Using Passport session for user:", user.id, user.email);
  } else {
    // Fallback to legacy SDK authentication (guest sessions, etc.)
    try {
      user = await sdk.authenticateRequest(opts.req);
      if (user) {
        console.log("[Context] Using legacy SDK auth for user:", user.id, user.email || user.openId);
      }
    } catch (error) {
      // Authentication is optional for public procedures.
      console.error("[Context] SDK authentication failed:", error);
      user = null;
    }
  }

  if (!user) {
    console.log("[Context] No authenticated user");
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
