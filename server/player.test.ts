import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId: number = 1): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `test-user-${userId}`,
    email: `test${userId}@example.com`,
    name: `Test User ${userId}`,
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("player.create", () => {
  it("creates a new player profile with unique alias", async () => {
    const userId = Math.floor(Math.random() * 1000000) + 10000;
    const { ctx } = createAuthContext(userId);
    const caller = appRouter.createCaller(ctx);

    const alias = `TestPlayer${Date.now()}_${userId}`;
    const player = await caller.player.create({ alias });

    expect(player).toBeDefined();
    expect(player?.alias).toBe(alias);
    expect(player?.rating).toBe(1200);
    expect(player?.wins).toBe(0);
    expect(player?.losses).toBe(0);
    expect(player?.draws).toBe(0);
  });

  it("rejects duplicate alias", async () => {
    const userId1 = Math.floor(Math.random() * 1000000) + 20000;
    const userId2 = Math.floor(Math.random() * 1000000) + 30000;
    const { ctx: ctx1 } = createAuthContext(userId1);
    const caller1 = appRouter.createCaller(ctx1);

    const alias = `DuplicateTest${Date.now()}_${userId1}`;
    await caller1.player.create({ alias });

    const { ctx: ctx2 } = createAuthContext(userId2);
    const caller2 = appRouter.createCaller(ctx2);

    await expect(caller2.player.create({ alias })).rejects.toThrow(
      "Alias already taken"
    );
  });

  it("rejects alias that is too short", async () => {
    const userId = Math.floor(Math.random() * 1000000) + 40000;
    const { ctx } = createAuthContext(userId);
    const caller = appRouter.createCaller(ctx);

    await expect(caller.player.create({ alias: "ab" })).rejects.toThrow();
  });
});

describe("player.getOrCreate", () => {
  it("returns null when player does not exist", async () => {
    const userId = Math.floor(Math.random() * 1000000) + 50000;
    const { ctx } = createAuthContext(userId);
    const caller = appRouter.createCaller(ctx);

    const player = await caller.player.getOrCreate();
    expect(player).toBeNull();
  });

  it("returns existing player profile", async () => {
    const userId = Math.floor(Math.random() * 1000000) + 60000;
    const { ctx } = createAuthContext(userId);
    const caller = appRouter.createCaller(ctx);

    const alias = `ExistingPlayer${Date.now()}_${userId}`;
    await caller.player.create({ alias });

    const player = await caller.player.getOrCreate();
    expect(player).toBeDefined();
    expect(player?.alias).toBe(alias);
  });
});
