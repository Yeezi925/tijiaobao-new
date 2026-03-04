import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { generateTrainingAdvice } from "./douban";
import { lessonPlanRouter } from "./lessonPlan";
import { z } from "zod";
import { saveStudentScoreData, getTeacherStudentData, createShareLink, getShareLinkByCode, getSharedStudentData, getTeacherShareLinks } from "./db";

export const appRouter = router({
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

  // 教师数据管理
  teacher: router({
    // 保存学生成绩数据
    saveStudentData: protectedProcedure
      .input(
        z.object({
          name: z.string(),
          grade: z.string().optional(),
          class: z.string().optional(),
          school: z.string().optional(),
          gender: z.enum(["男", "女"]),
          longrun: z.number().optional(),
          swim: z.number().optional(),
          long100: z.number().optional(),
          longContrib: z.string().optional(),
          football: z.number().optional(),
          basketball: z.number().optional(),
          volleyball: z.number().optional(),
          ballContrib: z.string().optional(),
          run50: z.number().optional(),
          situp: z.number().optional(),
          ball: z.number().optional(),
          rope: z.number().optional(),
          pullup: z.number().optional(),
          jump: z.number().optional(),
          selectContrib: z.string().optional(),
          selectedProjects: z.string().optional(),
          total40: z.string().optional(),
          status: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        try {
          const result = await saveStudentScoreData({
            userId: ctx.user?.id || 0,
            ...input,
          });
          return { success: true, data: result };
        } catch (error) {
          console.error("[Save student data failed]", error);
          return { success: false, error: "Failed to save student data" };
        }
      }),

    // 获取教师的所有学生数据
    getStudentData: protectedProcedure
      .query(async ({ ctx }) => {
        try {
          const data = await getTeacherStudentData(ctx.user?.id || 0);
          return { success: true, data };
        } catch (error) {
          console.error("[Get student data failed]", error);
          return { success: false, data: [] };
        }
      }),

    // 生成分享链接
    createShareLink: protectedProcedure
      .input(
        z.object({
          title: z.string(),
          description: z.string().optional(),
          studentIds: z.array(z.number()),
          studentData: z.string().optional(),
          expiresAt: z.date().optional(),
          filterType: z.enum(["all", "grade", "class"]).default("all"),
          filterValue: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        try {
          // 生成一个随机分享码
          const shareCode = Math.random().toString(36).substring(2, 10).toUpperCase();
          
          const result = await createShareLink({
            userId: ctx.user?.id || 0,
            shareCode,
            title: input.title,
            description: input.description,
            studentIds: JSON.stringify(input.studentIds),
            studentData: input.studentData,
            filterType: input.filterType,
            filterValue: input.filterValue,
            expiresAt: input.expiresAt,
            isActive: 1,
          });
          
          return { success: true, shareCode, data: result };
        } catch (error) {
          console.error("[Create share link failed]", error);
          return { success: false, error: "Failed to create share link" };
        }
      }),

    // 获取教师的所有分享链接
    getShareLinks: protectedProcedure
      .query(async ({ ctx }) => {
        try {
          const data = await getTeacherShareLinks(ctx.user?.id || 0);
          return { success: true, data };
        } catch (error) {
          console.error("[Get share links failed]", error);
          return { success: false, data: [] };
        }
      }),
  }),

  // 家长查询功能
  parent: router({
    // 通过分享码查询数据
    getSharedData: publicProcedure
      .input(z.object({ shareCode: z.string() }))
      .mutation(async ({ input }) => {
        try {
          const { updateShareLinkQueryStats, filterStudentDataByPermission, getShareLinkByCode } = await import("./db");
          const data = await getSharedStudentData(input.shareCode);
          if (!data) {
            return { success: false, error: "Invalid or expired share code", data: [] };
          }
          
          // 更新查询统计
          try {
            const shareLink = await getShareLinkByCode(input.shareCode);
            
            if (shareLink) {
              await updateShareLinkQueryStats(input.shareCode);
              
              // 应用权限控制
              const filteredData = await filterStudentDataByPermission(
                data,
                shareLink.filterType || "all",
                shareLink.filterValue || ""
              );
              
              return { success: true, data: filteredData };
            }
          } catch (statsError) {
            console.warn("[Failed to update stats or filter data]", statsError);
          }
          
          return { success: true, data };
        } catch (error) {
          console.error("[Get shared data failed]", error);
          return { success: false, error: "Failed to get shared data", data: [] };
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
