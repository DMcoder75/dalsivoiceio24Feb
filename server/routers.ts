import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import {
  getAllVoiceProfiles,
  getVoiceProfileById,
  createOrGetUserSession,
  getUserSessionByToken,
  incrementGenerationCount,
  createGenerationRecord,
} from "./db";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  voice: router({
    getAllProfiles: publicProcedure.query(async () => {
      return await getAllVoiceProfiles();
    }),

    getProfile: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await getVoiceProfileById(input.id);
      }),

    initSession: protectedProcedure.mutation(async ({ ctx }) => {
      const sessionToken = await createOrGetUserSession(ctx.user.id);
      return { sessionToken };
    }),

    getSession: protectedProcedure
      .input(z.object({ sessionToken: z.string() }))
      .query(async ({ input }) => {
        const session = await getUserSessionByToken(input.sessionToken);
        if (!session) return null;
        return {
          id: session.id,
          generationCount: session.generationCount,
          remainingGenerations: Math.max(0, 2 - (session.generationCount || 0)),
          canGenerate: (session.generationCount || 0) < 2,
        };
      }),

    generate: protectedProcedure
      .input(
        z.object({
          sessionToken: z.string(),
          voiceProfileId: z.number(),
          text: z.string().min(1).max(5000),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const session = await getUserSessionByToken(input.sessionToken);
        if (!session) {
          throw new Error("Invalid session");
        }

        if ((session.generationCount || 0) >= 2) {
          throw new Error("Generation limit reached");
        }

        const voiceProfile = await getVoiceProfileById(input.voiceProfileId);
        if (!voiceProfile) {
          throw new Error("Voice profile not found");
        }

        const audioUrl = `https://example.com/audio/${Date.now()}.mp3`;

        await createGenerationRecord(
          ctx.user.id,
          session.id,
          input.voiceProfileId,
          input.text,
          audioUrl
        );

        await incrementGenerationCount(session.id);

        return {
          success: true,
          audioUrl,
          voiceProfile,
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;
