import { describe, expect, it, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId: number): { ctx: TrpcContext } {
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

describe("game.create", () => {
  beforeAll(async () => {
    // Create test players
    const { ctx: ctx1 } = createAuthContext(3001);
    const caller1 = appRouter.createCaller(ctx1);
    try {
      await caller1.player.create({ alias: `GameTestPlayer3001_${Date.now()}` });
    } catch (e) {
      // Player might already exist
    }

    const { ctx: ctx2 } = createAuthContext(3002);
    const caller2 = appRouter.createCaller(ctx2);
    try {
      await caller2.player.create({ alias: `GameTestPlayer3002_${Date.now()}` });
    } catch (e) {
      // Player might already exist
    }
  });

  it("creates a new game with invite code", async () => {
    const { ctx } = createAuthContext(3001);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.game.create({
      timeControl: "10+0",
      initialTime: 600,
      increment: 0,
    });

    expect(result).toBeDefined();
    expect(result.gameId).toBeGreaterThan(0);
    expect(result.inviteCode).toBeDefined();
    expect(result.inviteCode.length).toBeGreaterThan(0);
  });

  it("allows joining a game with invite code", async () => {
    const { ctx: ctx1 } = createAuthContext(3001);
    const caller1 = appRouter.createCaller(ctx1);

    const createResult = await caller1.game.create({
      timeControl: "5+3",
      initialTime: 300,
      increment: 3,
    });

    const { ctx: ctx2 } = createAuthContext(3002);
    const caller2 = appRouter.createCaller(ctx2);

    const joinResult = await caller2.game.join({
      inviteCode: createResult.inviteCode,
    });

    expect(joinResult).toBeDefined();
    expect(joinResult.gameId).toBe(createResult.gameId);
  });

  it("rejects joining non-existent game", async () => {
    const { ctx } = createAuthContext(3002);
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.game.join({ inviteCode: "INVALID" })
    ).rejects.toThrow("Game not found");
  });
});

describe("game.getById", () => {
  it("retrieves game by ID", async () => {
    const { ctx } = createAuthContext(3001);
    const caller = appRouter.createCaller(ctx);

    const createResult = await caller.game.create({
      timeControl: "10+0",
      initialTime: 600,
      increment: 0,
    });

    const game = await caller.game.getById({ gameId: createResult.gameId });

    expect(game).toBeDefined();
    expect(game.id).toBe(createResult.gameId);
    expect(game.timeControl).toBe("10+0");
    expect(game.status).toBe("waiting");
  });

  it("throws error for non-existent game", async () => {
    const { ctx } = createAuthContext(3001);
    const caller = appRouter.createCaller(ctx);

    await expect(caller.game.getById({ gameId: 999999 })).rejects.toThrow(
      "Game not found"
    );
  });
});
