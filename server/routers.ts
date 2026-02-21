import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { generateTrainingAdvice } from "./douban";
import { lessonPlanRouter } from "./lessonPlan";
import { z } from "zod";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  ai: router({
    generateAdvice: publicProcedure
      .input(
        z.object({
          name: z.string(),
          gender: z.string(),
          total40: z.number(),
          longContrib: z.number().optional(),
          ballContrib: z.number().optional(),
          selectContrib: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        try {
          const advice = await generateTrainingAdvice(input);
          return {
            success: true,
            advice,
          };
        } catch (error) {
          console.error("[AI advice generation failed]", error);
          return {
            success: false,
            advice: "Sorry, AI advice generation failed. Please try again later.",
          };
        }
      }),
  }),

  lessonPlan: lessonPlanRouter,
});

export type AppRouter = typeof appRouter;
