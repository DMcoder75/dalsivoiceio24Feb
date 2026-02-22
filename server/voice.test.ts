import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext; user: AuthenticatedUser } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-" + Date.now(),
    email: "test@example.com",
    name: "Test User",
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
    } as unknown as TrpcContext["res"],
  };

  return { ctx, user };
}

describe("voice router", () => {
  describe("getAllProfiles", () => {
    it("should return list of voice profiles", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const profiles = await caller.voice.getAllProfiles();

      expect(Array.isArray(profiles)).toBe(true);
      expect(profiles.length).toBeGreaterThan(0);
      expect(profiles[0]).toHaveProperty("id");
      expect(profiles[0]).toHaveProperty("name");
    });
  });

  describe("getProfile", () => {
    it("should return a specific voice profile by id", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const profiles = await caller.voice.getAllProfiles();
      const profile = await caller.voice.getProfile({ id: profiles[0].id });

      expect(profile).toBeDefined();
      expect(profile?.id).toBe(profiles[0].id);
    });
  });

  describe("initSession", () => {
    it("should create a new session for authenticated user", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.voice.initSession();

      expect(result).toHaveProperty("sessionToken");
      expect(typeof result.sessionToken).toBe("string");
    });
  });

  describe("generate", () => {
    it("should reject generation without valid session", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const profiles = await caller.voice.getAllProfiles();

      await expect(
        caller.voice.generate({
          sessionToken: "invalid-token",
          voiceProfileId: profiles[0].id,
          text: "Test text",
        })
      ).rejects.toThrow("Invalid session");
    });

    it("should reject generation with empty text", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const sessionResult = await caller.voice.initSession();
      const profiles = await caller.voice.getAllProfiles();

      await expect(
        caller.voice.generate({
          sessionToken: sessionResult.sessionToken,
          voiceProfileId: profiles[0].id,
          text: "",
        })
      ).rejects.toThrow();
    });

    it("should generate audio successfully with valid inputs", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const sessionResult = await caller.voice.initSession();
      const profiles = await caller.voice.getAllProfiles();

      const result = await caller.voice.generate({
        sessionToken: sessionResult.sessionToken,
        voiceProfileId: profiles[0].id,
        text: "Hello, this is a test.",
      });

      expect(result).toHaveProperty("success");
      expect(result.success).toBe(true);
      expect(result).toHaveProperty("audioUrl");
    });
  });
});
