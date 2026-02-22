/**
 * 教案生成相关的 tRPC 路由和业务逻辑
 */

import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import {
  curriculumStandards,
  lessonTemplates,
  lessonPlanSessions,
  lessonPlanMessages,
  generatedLessonPlans,
} from "../drizzle/schema";
import { invokeLLM } from "./_core/llm";
import { eq } from "drizzle-orm";

export const lessonPlanRouter = router({
  // 获取课程标准列表
  getStandards: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    const standards = await db.select().from(curriculumStandards).limit(20);
    return standards;
  }),

  // 获取教案模板列表
  getTemplates: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    const templates = await db
      .select()
      .from(lessonTemplates)
      .where(eq(lessonTemplates.userId, ctx.user.id))
      .limit(20);

    return templates;
  }),

  // 获取用户的会话列表
  getSessions: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    const sessions = await db
      .select()
      .from(lessonPlanSessions)
      .where(eq(lessonPlanSessions.userId, ctx.user.id))
      .limit(20);

    return sessions;
  }),

  // 创建新会话
  createSession: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1),
        subject: z.string(),
        grade: z.string(),
        standardId: z.number().optional(),
        templateId: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("数据库连接失败");

      await db.insert(lessonPlanSessions).values({
        userId: ctx.user.id,
        title: input.title,
        subject: input.subject,
        grade: input.grade,
        standardId: input.standardId,
        templateId: input.templateId,
      });

      return {
        id: 1,
        ...input,
      };
    }),

  // 发送消息并获取 AI 响应
  sendMessage: protectedProcedure
    .input(
      z.object({
        sessionId: z.number(),
        message: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("数据库连接失败");

      // 保存用户消息
      await db.insert(lessonPlanMessages).values({
        sessionId: input.sessionId,
        role: "user",
        content: input.message,
      });

      // 获取会话信息
      const session = await db
        .select()
        .from(lessonPlanSessions)
        .where(eq(lessonPlanSessions.id, input.sessionId))
        .limit(1);

      if (!session.length) {
        throw new Error("会话不存在");
      }

      const sessionData = session[0];

      // 获取之前的消息历史
      const messageHistory = await db
        .select()
        .from(lessonPlanMessages)
        .where(eq(lessonPlanMessages.sessionId, input.sessionId))
        .limit(10);

      // 构建 LLM 提示
      const systemPrompt = `你是一位专业的教育工作者和教案设计专家。
当前教案生成会话信息：
- 标题: ${sessionData.title}
- 学科: ${sessionData.subject}
- 年级: ${sessionData.grade}

请根据用户的需求，帮助设计教案、制定教学计划、撰写教学总结和反思。
你的回答应该专业、详细、具有可操作性。`;

      const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
        { role: "system", content: systemPrompt },
        ...messageHistory.map((msg) => ({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        })),
      ];

      // 调用 LLM
      const response = await invokeLLM({
        messages: messages as any,
      });

      let aiResponse = "抱歉，生成回复时出现错误";
      const messageContent = response.choices[0]?.message?.content;
      if (typeof messageContent === "string") {
        aiResponse = messageContent;
      } else if (Array.isArray(messageContent)) {
        aiResponse = JSON.stringify(messageContent);
      } else if (messageContent) {
        aiResponse = JSON.stringify(messageContent);
      }

      // 保存 AI 响应
      await db.insert(lessonPlanMessages).values({
        sessionId: input.sessionId,
        role: "assistant",
        content: aiResponse,
      });

      return {
        response: aiResponse,
      };
    }),

  // 生成完整教案
  generateLessonPlan: protectedProcedure
    .input(z.object({ sessionId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("数据库连接失败");

      // 获取会话信息
      const session = await db
        .select()
        .from(lessonPlanSessions)
        .where(eq(lessonPlanSessions.id, input.sessionId))
        .limit(1);

      if (!session.length) {
        throw new Error("会话不存在");
      }

      const sessionData = session[0];

      // 获取所有消息历史
      const messages = await db
        .select()
        .from(lessonPlanMessages)
        .where(eq(lessonPlanMessages.sessionId, input.sessionId));

      // 构建生成教案的提示
      const conversationSummary = messages
        .map((m) => `${m.role === "user" ? "用户" : "AI"}：${m.content}`)
        .join("\n\n");

      const generatePrompt = `基于以下对话内容，生成一份完整的教案。

对话内容：
${conversationSummary}

请生成包含以下部分的完整教案（使用 JSON 格式）：
{
  "title": "教案标题",
  "teachingObjectives": "教学目标（列出具体的学习目标）",
  "keyPoints": "重点难点（分别说明重点和难点）",
  "teachingProcess": "教学过程（详细描述教学步骤，包括导入、新授、练习、总结等环节）",
  "summary": "课程总结（总结本课的主要内容和学生收获）",
  "reflection": "教学反思（分析教学效果、存在的问题和改进方向）",
  "homework": "作业设计（设计巩固知识的作业）"
}

请确保内容专业、详细、具有可操作性。`;

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content:
              "你是一位专业的教育工作者。请根据要求生成完整的教案，返回有效的 JSON 格式。",
          },
          {
            role: "user",
            content: generatePrompt,
          },
        ] as any,
      });

      let content = "";
      const messageContent = response.choices[0]?.message?.content;
      if (typeof messageContent === "string") {
        content = messageContent;
      } else if (Array.isArray(messageContent)) {
        content = JSON.stringify(messageContent);
      } else if (messageContent) {
        content = JSON.stringify(messageContent);
      }

      if (!content) {
        throw new Error("生成教案失败");
      }

      // 尝试从内容中提取 JSON
      let planData;
      try {
        // 首先尝试直接解析
        planData = JSON.parse(content);
      } catch {
        // 如果直接解析失败，尝试提取 JSON 部分
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            planData = JSON.parse(jsonMatch[0]);
          } catch {
            // 如果仍然失败，构建默认教案
            planData = {
              title: "教案",
              teachingObjectives: content.substring(0, 200),
              keyPoints: "待补充",
              teachingProcess: content,
              summary: "待补充",
              reflection: "待补充",
              homework: "待补充"
            };
          }
        } else {
          // 如果找不到 JSON，构建默认教案
          planData = {
            title: "教案",
            teachingObjectives: content.substring(0, 200),
            keyPoints: "待补充",
            teachingProcess: content,
            summary: "待补充",
            reflection: "待补充",
            homework: "待补充"
          };
        }
      }

      // 保存生成的教案
      await db.insert(generatedLessonPlans).values({
        userId: ctx.user.id,
        sessionId: input.sessionId,
        title: planData.title,
        subject: sessionData.subject,
        grade: sessionData.grade,
        teachingObjectives: planData.teachingObjectives,
        keyPoints: planData.keyPoints,
        teachingProcess: planData.teachingProcess,
        summary: planData.summary,
        reflection: planData.reflection,
        homework: planData.homework,
        fullContent: JSON.stringify(planData),
      });

      return planData;
    }),

  // 获取生成的教案列表
  getGeneratedPlans: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    const plans = await db
      .select()
      .from(generatedLessonPlans)
      .where(eq(generatedLessonPlans.userId, ctx.user.id))
      .limit(20);

    return plans;
  }),

  // 删除会话
  deleteSession: protectedProcedure
    .input(z.object({ sessionId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("数据库连接失败");

      // 验证会话所有者
      const session = await db
        .select()
        .from(lessonPlanSessions)
        .where(eq(lessonPlanSessions.id, input.sessionId))
        .limit(1);

      if (!session.length || session[0].userId !== ctx.user.id) {
        throw new Error("无权删除此会话");
      }

      // 删除相关消息
      await db
        .delete(lessonPlanMessages)
        .where(eq(lessonPlanMessages.sessionId, input.sessionId));

      // 删除会话
      await db
        .delete(lessonPlanSessions)
        .where(eq(lessonPlanSessions.id, input.sessionId));

      return { success: true };
    }),
});
