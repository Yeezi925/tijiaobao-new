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
    
    updateWechatId: protectedProcedure
      .input(z.object({ wechatId: z.string() }))
      .mutation(async ({ input, ctx }) => {
        try {
          const { updateTeacherWechat } = await import("./db");
          const teacherId = ctx.user?.id;
          if (!teacherId) {
            return { success: false, error: "User not authenticated" };
          }
          await updateTeacherWechat(teacherId, input.wechatId);
          return { success: true };
        } catch (error) {
          console.error("[Update wechat failed]", error);
          return { success: false, error: "Failed to update wechat" };
        }
      }),
    
    getWechatId: protectedProcedure
      .query(async ({ ctx }) => {
        try {
          const { getTeacherWechat } = await import("./db");
          const teacherId = ctx.user?.id;
          if (!teacherId) {
            return { success: false, wechatId: null };
          }
          const wechat = await getTeacherWechat(teacherId);
          return { success: true, wechatId: wechat?.wechatId || null };
        } catch (error) {
          console.error("[Get wechat failed]", error);
          return { success: false, wechatId: null };
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
          let teacherId = null;
          const data = await getSharedStudentData(input.shareCode);
          if (!data) {
            return { success: false, error: "Invalid or expired share code", data: [], teacherId: null };
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
              
              teacherId = shareLink.userId;
              return { success: true, data: filteredData, teacherId };
            }
          } catch (statsError) {
            console.warn("[Failed to update stats or filter data]", statsError);
          }
          
          return { success: true, data };
        } catch (error) {
          console.error("[Get shared data failed]", error);
          return { success: false, error: "Failed to get shared data", data: [], teacherId: null };
        }
      }),
    
    // 获取老师的微信号（用于生成二维码）
    getTeacherWechat: publicProcedure
      .input(z.object({ teacherId: z.number() }))
      .query(async ({ input }) => {
        try {
          const { getTeacherWechat } = await import("./db");
          const wechat = await getTeacherWechat(input.teacherId);
          return { success: true, wechatId: wechat?.wechatId || null };
        } catch (error) {
          console.error("[Get teacher wechat failed]", error);
          return { success: false, wechatId: null };
        }
      }),
    
    // 提交咨询
    submitConsultation: protectedProcedure
      .input(z.object({
        teacherId: z.number(),
        title: z.string(),
        content: z.string(),
        studentId: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          const { createParentConsultation } = await import("./db");
          const parentId = ctx.user?.id;
          if (!parentId) {
            return { success: false, error: "User not authenticated" };
          }
          
          await createParentConsultation(
            parentId,
            input.teacherId,
            input.title,
            input.content,
            input.studentId
          );
          
          return { success: true };
        } catch (error) {
          console.error("[Submit consultation failed]", error);
          return { success: false, error: "Failed to submit consultation" };
        }
      }),
    
    // 获取咨询历史
    getConsultationHistory: protectedProcedure
      .input(z.object({ teacherId: z.number() }))
      .query(async ({ input, ctx }) => {
        try {
          const { getParentConsultations } = await import("./db");
          const parentId = ctx.user?.id;
          if (!parentId) {
            return { success: false, consultations: [] };
          }
          
          const consultations = await getParentConsultations(parentId, input.teacherId);
          return { success: true, consultations };
        } catch (error) {
          console.error("[Get consultations failed]", error);
          return { success: false, consultations: [] };
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
