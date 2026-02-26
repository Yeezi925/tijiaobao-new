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
// 学生成绩数据表 - 教师保存的学生数据
export const studentScoreData = mysqlTable("student_score_data", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // 教师ID
  name: varchar("name", { length: 255 }).notNull(), // 学生姓名
  grade: varchar("grade", { length: 50 }), // 年级
  class: varchar("class", { length: 100 }), // 班级
  school: varchar("school", { length: 255 }), // 学校
  gender: mysqlEnum("gender", ["男", "女"]).notNull(), // 性别
  
  // 长跑/游泳
  longrun: int("longrun"), // 长跑成绩
  swim: int("swim"), // 游泳成绩
  long100: int("long100"), // 100米成绩
  longContrib: varchar("longContrib", { length: 50 }), // 长跑/游泳贡献分
  
  // 球类
  football: int("football"), // 足球成绩
  basketball: int("basketball"), // 篮球成绩
  volleyball: int("volleyball"), // 排球成绩
  ballContrib: varchar("ballContrib", { length: 50 }), // 球类贡献分
  
  // 选考项目
  run50: int("run50"), // 50米成绩
  situp: int("situp"), // 仰卧起坐成绩
  ball: int("ball"), // 球类成绩
  rope: int("rope"), // 跳绳成绩
  pullup: int("pullup"), // 引体向上成绩
  jump: int("jump"), // 跳远成绩
  selectContrib: varchar("selectContrib", { length: 50 }), // 选考项目贡献分
  selectedProjects: text("selectedProjects"), // JSON 格式的选考项目列表
  
  // 计算结果
  total40: varchar("total40", { length: 50 }), // 40分制总分
  status: varchar("status", { length: 50 }), // 状态
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type StudentScoreData = typeof studentScoreData.$inferSelect;
export type InsertStudentScoreData = typeof studentScoreData.$inferInsert;

// 分享链接表 - 教师生成的分享码
export const shareLinks = mysqlTable("share_links", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // 教师ID
  shareCode: varchar("shareCode", { length: 50 }).notNull().unique(), // 分享码
  title: varchar("title", { length: 255 }).notNull(), // 分享标题（如班级名称）
  description: text("description"), // 分享描述
  studentIds: text("studentIds"), // JSON 格式的学生ID列表
  expiresAt: timestamp("expiresAt"), // 过期时间
  isActive: int("isActive").default(1).notNull(), // 是否激活（1=激活，0=停用）
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ShareLink = typeof shareLinks.$inferSelect;
export type InsertShareLink = typeof shareLinks.$inferInsert;
