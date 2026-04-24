import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure, miniRouter, miniProcedure } from "./_core/trpc";
import { generateTrainingAdvice } from "./douban";
import { lessonPlanRouter } from "./lessonPlan";
import { z } from "zod";
import { saveStudentScoreData, getTeacherStudentData, createShareLink, getShareLinkByCode, getSharedStudentData, getTeacherShareLinks, batchSaveStudentScoreData, getShareCodeStudents, getParentBindings, createParentBinding, batchCreateParentBindings, getParentStudentScores, deleteParentBinding, checkParentBindingExists } from "./db";

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
          grade: z.string().optional(),
          class: z.string().optional(),
          total40: z.number(),
          // 长跑/游泳
          longProject: z.string().optional(),
          longRaw: z.number().optional(),
          longContrib: z.number().optional(),
          // 球类
          ballProject: z.string().optional(),
          ballRaw: z.number().optional(),
          ballContrib: z.number().optional(),
          // 选考1
          selectProject1: z.string().optional(),
          selectRaw1: z.number().optional(),
          selectContrib1: z.string().optional(),
          // 选考2
          selectProject2: z.string().optional(),
          selectRaw2: z.number().optional(),
          selectContrib2: z.string().optional(),
          // 总贡献分（兼容旧参数）
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

/**
 * 小程序专用成绩管理 router
 * 使用 miniProcedure（从 Authorization header 读取 token 认证）
 */
export const miniAppRouter = miniRouter({
  // 获取学生列表
  getStudents: miniProcedure.query(async ({ ctx }) => {
    try {
      const data = await getTeacherStudentData(ctx.user.id);
      return { success: true, data };
    } catch (error) {
      console.error("[Mini] Get students failed", error);
      return { success: false, data: [] };
    }
  }),

  // 保存/更新学生成绩
  saveStudent: miniProcedure
    .input(
      z.object({
        id: z.number().optional(), // 有 id 则更新，无 id 则新增
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
        if (input.id) {
          // 更新已有记录
          const { updateStudentScoreData } = await import("./db");
          await updateStudentScoreData(input.id, { userId: ctx.user.id, ...input });
          return { success: true, id: input.id };
        } else {
          // 新增记录
          const result = await saveStudentScoreData({ userId: ctx.user.id, ...input });
          return { success: true };
        }
      } catch (error) {
        console.error("[Mini] Save student failed", error);
        return { success: false, error: "Failed to save student data" };
      }
    }),

  // 批量保存学生成绩（先清空旧数据，再批量插入）
  batchSaveStudents: miniProcedure
    .input(
      z.object({
        students: z.array(
          z.object({
            id: z.number().optional(),
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
        ),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const records = input.students.map(s => ({
          userId: ctx.user.id,
          name: s.name,
          grade: s.grade,
          class: s.class,
          school: s.school,
          gender: s.gender,
          longrun: s.longrun,
          swim: s.swim,
          long100: s.long100,
          longContrib: s.longContrib,
          football: s.football,
          basketball: s.basketball,
          volleyball: s.volleyball,
          ballContrib: s.ballContrib,
          run50: s.run50,
          situp: s.situp,
          ball: s.ball,
          rope: s.rope,
          pullup: s.pullup,
          jump: s.jump,
          selectContrib: s.selectContrib,
          selectedProjects: s.selectedProjects,
          total40: s.total40,
          status: s.status,
        }));
        const result = await batchSaveStudentScoreData(ctx.user.id, records);
        return { success: true, count: result.count };
      } catch (error) {
        console.error("[Mini] Batch save students failed", error);
        return { success: false, error: "Failed to batch save student data" };
      }
    }),

  // 删除学生记录
  deleteStudent: miniProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const { deleteStudentScoreData } = await import("./db");
        await deleteStudentScoreData(input.id, ctx.user.id);
        return { success: true };
      } catch (error) {
        console.error("[Mini] Delete student failed", error);
        return { success: false, error: "Failed to delete student" };
      }
    }),

  // 生成分享链接
  createShareLink: miniProcedure
    .input(
      z.object({
        title: z.string(),
        description: z.string().optional(),
        studentIds: z.array(z.number()),
        studentData: z.string().optional(),
        expiresAt: z.string().optional(), // ISO date string，小程序端传字符串
        filterType: z.enum(["all", "grade", "class"]).default("all"),
        filterValue: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const shareCode = Math.random().toString(36).substring(2, 10).toUpperCase();
        const expiresAt = input.expiresAt ? new Date(input.expiresAt) : undefined;
        
        const result = await createShareLink({
          userId: ctx.user.id,
          shareCode,
          title: input.title,
          description: input.description,
          studentIds: JSON.stringify(input.studentIds),
          studentData: input.studentData,
          filterType: input.filterType,
          filterValue: input.filterValue,
          expiresAt,
          isActive: 1,
        });
        
        return { success: true, shareCode, data: result };
      } catch (error) {
        console.error("[Mini] Create share link failed", error);
        return { success: false, error: "Failed to create share link" };
      }
    }),

  // 获取教师的所有分享链接
  getShareLinks: miniProcedure.query(async ({ ctx }) => {
    try {
      const data = await getTeacherShareLinks(ctx.user.id);
      return { success: true, data };
    } catch (error) {
      console.error("[Mini] Get share links failed", error);
      return { success: false, data: [] };
    }
  }),

  // AI 生成训练建议（照搬 Web ai.generateAdvice）
  generateAdvice: miniProcedure
    .input(
      z.object({
        name: z.string(),
        gender: z.string(),
        grade: z.string().optional(),
        class: z.string().optional(),
        total40: z.number(),
        // 长跑/游泳
        longProject: z.string().optional(),
        longRaw: z.number().optional(),
        longContrib: z.number().optional(),
        // 球类
        ballProject: z.string().optional(),
        ballRaw: z.number().optional(),
        ballContrib: z.number().optional(),
        // 选考1
        selectProject1: z.string().optional(),
        selectRaw1: z.number().optional(),
        selectContrib1: z.string().optional(),
        // 选考2
        selectProject2: z.string().optional(),
        selectRaw2: z.number().optional(),
        selectContrib2: z.string().optional(),
        // 总贡献分（兼容旧参数）
        selectContrib: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const advice = await generateTrainingAdvice(input);
        return { success: true, advice };
      } catch (error) {
        console.error("[Mini] AI advice generation failed", error);
        return {
          success: false,
          advice: "AI 建议生成失败，请稍后再试。",
        };
      }
    }),

  // 获取当前用户信息（包含 role 判断）
  me: miniProcedure.query(async ({ ctx }) => {
    return {
      id: ctx.user.id,
      name: ctx.user.name,
      openId: ctx.user.openId,
      role: ctx.user.role,
    };
  }),

  // ===== 家长端路由 =====

  // 家长：通过分享码查看可选学生列表（只返回姓名+班级，不含成绩）
  parentGetStudentsByShareCode: miniProcedure
    .input(z.object({ shareCode: z.string() }))
    .mutation(async ({ input }) => {
      try {
        const result = await getShareCodeStudents(input.shareCode);
        if (!result) {
          return { success: false, error: "分享码无效或已过期" };
        }
        return { success: true, data: result };
      } catch (error) {
        console.error("[Mini] parentGetStudentsByShareCode failed:", error);
        return { success: false, error: "查询失败" };
      }
    }),

  // 家长：绑定学生（传入分享码 + 选中的学生ID列表）
  parentBindStudents: miniProcedure
    .input(z.object({
      shareCode: z.string(),
      studentIds: z.array(z.number()),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        // 先验证分享码
        const shareInfo = await getShareCodeStudents(input.shareCode);
        if (!shareInfo) {
          return { success: false, error: "分享码无效或已过期" };
        }

        // 验证传入的 studentIds 都在该分享码的学生列表中
        const validIds = new Set(shareInfo.students.map(s => s.id));
        const invalidIds = input.studentIds.filter(id => !validIds.has(id));
        if (invalidIds.length > 0) {
          return { success: false, error: "部分学生ID无效" };
        }

        // 过滤掉已绑定的
        const newBindings = [];
        for (const studentId of input.studentIds) {
          const exists = await checkParentBindingExists(ctx.user.id, studentId);
          if (!exists) {
            newBindings.push({
              parentId: ctx.user.id,
              studentId,
              teacherId: shareInfo.teacherId,
              shareCode: input.shareCode,
            });
          }
        }

        // 批量创建绑定
        if (newBindings.length > 0) {
          await batchCreateParentBindings(newBindings);
        }

        // 更新用户角色为 parent（如果还不是的话）
        if (ctx.user.role !== "parent") {
          const { upsertUser } = await import("./db");
          await upsertUser({
            openId: ctx.user.openId,
            role: "parent",
            lastSignedIn: new Date(),
          });
        }

        return { success: true, count: newBindings.length, total: input.studentIds.length };
      } catch (error) {
        console.error("[Mini] parentBindStudents failed:", error);
        return { success: false, error: "绑定失败" };
      }
    }),

  // 家长：获取已绑定的学生列表（含完整成绩数据）
  parentGetMyStudents: miniProcedure
    .query(async ({ ctx }) => {
      try {
        const students = await getParentStudentScores(ctx.user.id);
        return { success: true, data: students };
      } catch (error) {
        console.error("[Mini] parentGetMyStudents failed:", error);
        return { success: false, data: [] };
      }
    }),

  // 家长：解绑某个学生
  parentUnbindStudent: miniProcedure
    .input(z.object({ studentId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      try {
        await deleteParentBinding(ctx.user.id, input.studentId);
        return { success: true };
      } catch (error) {
        console.error("[Mini] parentUnbindStudent failed:", error);
        return { success: false, error: "解绑失败" };
      }
    }),

  // 家长：添加更多孩子（通过新的分享码继续绑定）
  parentGetBindings: miniProcedure
    .query(async ({ ctx }) => {
      try {
        const bindings = await getParentBindings(ctx.user.id);
        return { success: true, data: bindings };
      } catch (error) {
        console.error("[Mini] parentGetBindings failed:", error);
        return { success: false, data: [] };
      }
    }),
});

export type MiniAppRouter = typeof miniAppRouter;
