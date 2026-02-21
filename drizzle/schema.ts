import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// 课程标准表
export const curriculumStandards = mysqlTable("curriculum_standards", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(), // 标准名称
  subject: varchar("subject", { length: 100 }).notNull(), // 学科（体育等）
  grade: varchar("grade", { length: 50 }).notNull(), // 年级
  content: text("content").notNull(), // 标准内容
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CurriculumStandard = typeof curriculumStandards.$inferSelect;
export type InsertCurriculumStandard = typeof curriculumStandards.$inferInsert;

// 教案模板表
export const lessonTemplates = mysqlTable("lesson_templates", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // 用户ID
  name: varchar("name", { length: 255 }).notNull(), // 模板名称
  subject: varchar("subject", { length: 100 }).notNull(), // 学科
  content: text("content").notNull(), // 模板内容
  fileUrl: varchar("fileUrl", { length: 500 }), // 上传的文件URL
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LessonTemplate = typeof lessonTemplates.$inferSelect;
export type InsertLessonTemplate = typeof lessonTemplates.$inferInsert;

// 教案生成会话表
export const lessonPlanSessions = mysqlTable("lesson_plan_sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // 用户ID
  title: varchar("title", { length: 255 }).notNull(), // 会话标题
  subject: varchar("subject", { length: 100 }).notNull(), // 学科
  grade: varchar("grade", { length: 50 }).notNull(), // 年级
  standardId: int("standardId"), // 关联的课程标准ID
  templateId: int("templateId"), // 关联的模板ID
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LessonPlanSession = typeof lessonPlanSessions.$inferSelect;
export type InsertLessonPlanSession = typeof lessonPlanSessions.$inferInsert;

// 教案聊天消息表
export const lessonPlanMessages = mysqlTable("lesson_plan_messages", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull(), // 会话ID
  role: mysqlEnum("role", ["user", "assistant"]).notNull(), // 消息角色
  content: text("content").notNull(), // 消息内容
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type LessonPlanMessage = typeof lessonPlanMessages.$inferSelect;
export type InsertLessonPlanMessage = typeof lessonPlanMessages.$inferInsert;

// 生成的教案表
export const generatedLessonPlans = mysqlTable("generated_lesson_plans", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // 用户ID
  sessionId: int("sessionId").notNull(), // 会话ID
  title: varchar("title", { length: 255 }).notNull(), // 教案标题
  subject: varchar("subject", { length: 100 }).notNull(), // 学科
  grade: varchar("grade", { length: 50 }).notNull(), // 年级
  teachingObjectives: text("teachingObjectives"), // 教学目标
  keyPoints: text("keyPoints"), // 重点难点
  teachingProcess: text("teachingProcess"), // 教学过程
  summary: text("summary"), // 课程总结
  reflection: text("reflection"), // 教学反思
  homework: text("homework"), // 作业设计
  fullContent: text("fullContent"), // 完整教案内容
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type GeneratedLessonPlan = typeof generatedLessonPlans.$inferSelect;
export type InsertGeneratedLessonPlan = typeof generatedLessonPlans.$inferInsert;