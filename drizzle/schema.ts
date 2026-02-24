import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean } from "drizzle-orm/mysql-core";

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
  userType: mysqlEnum("userType", ["teacher", "student", "parent"]), // 用户类型：教师、学生、家长
  phoneNumber: varchar("phoneNumber", { length: 20 }), // 手机号
  school: varchar("school", { length: 255 }), // 学校
  grade: varchar("grade", { length: 50 }), // 年段
  className: varchar("className", { length: 100 }), // 班级
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
// 学生成绩数据表（教师导入的数据）
export const studentScoreData = mysqlTable("student_score_data", {
  id: int("id").autoincrement().primaryKey(),
  teacherId: int("teacherId").notNull(), // 教师ID
  studentName: varchar("studentName", { length: 100 }).notNull(), // 学生姓名
  studentId: varchar("studentId", { length: 100 }), // 学生ID（可选）
  className: varchar("className", { length: 100 }).notNull(), // 班级
  grade: varchar("grade", { length: 50 }).notNull(), // 年段
  gender: mysqlEnum("gender", ["male", "female"]), // 性别
  // 12项运动成绩
  longDistance: int("longDistance"), // 长跑/游泳
  basketball: int("basketball"), // 篮球
  volleyball: int("volleyball"), // 排球
  badminton: int("badminton"), // 羽毛球
  tabletennis: int("tabletennis"), // 乒乓球
  soccerFootball: int("soccerFootball"), // 足球
  selected1: varchar("selected1", { length: 100 }), // 选考项目1
  selected1Score: int("selected1Score"), // 选考项目1成绩
  selected2: varchar("selected2", { length: 100 }), // 选考项目2
  selected2Score: int("selected2Score"), // 选考项目2成绩
  totalScore: int("totalScore"), // 总分（40分制）
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type StudentScoreData = typeof studentScoreData.$inferSelect;
export type InsertStudentScoreData = typeof studentScoreData.$inferInsert;

// 用户权限表（数据分享关系）
export const userPermissions = mysqlTable("user_permissions", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(), // 数据所有者（教师）ID
  granteeId: int("granteeId").notNull(), // 被授予权限的用户ID
  permissionType: mysqlEnum("permissionType", ["view", "edit", "delete"]).default("view").notNull(), // 权限类型
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserPermission = typeof userPermissions.$inferSelect;
export type InsertUserPermission = typeof userPermissions.$inferInsert;

// 分享链接表
export const shareLinks = mysqlTable("share_links", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(), // 分享者ID
  shareCode: varchar("shareCode", { length: 50 }).notNull().unique(), // 分享码
  dataType: mysqlEnum("dataType", ["class", "student", "all"]).default("class").notNull(), // 分享数据类型
  className: varchar("className", { length: 100 }), // 班级（如果是班级分享）
  studentId: int("studentId"), // 学生ID（如果是学生分享）
  expiresAt: timestamp("expiresAt"), // 过期时间
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ShareLink = typeof shareLinks.$inferSelect;
export type InsertShareLink = typeof shareLinks.$inferInsert;
