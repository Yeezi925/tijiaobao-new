import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users } from "../drizzle/schema";
import { ENV } from './_core/env';
import { eq, and, desc } from "drizzle-orm";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// TODO: add feature queries here as your schema grows.

import { studentScoreData, shareLinks, InsertStudentScoreData, InsertShareLink } from "../drizzle/schema";

// 保存学生成绩数据
export async function saveStudentScoreData(data: InsertStudentScoreData) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    const result = await db.insert(studentScoreData).values(data);
    return result;
  } catch (error) {
    console.error("[Database] Failed to save student score data:", error);
    throw error;
  }
}

// 批量保存学生成绩数据（先清空该教师的旧数据，再批量插入）
export async function batchSaveStudentScoreData(userId: number, records: InsertStudentScoreData[]) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    // 先删除该教师的全部旧数据
    await db.delete(studentScoreData).where(eq(studentScoreData.userId, userId));
    // 批量插入新数据（每条带 userId）
    if (records.length > 0) {
      await db.insert(studentScoreData).values(records);
    }
    return { success: true, count: records.length };
  } catch (error) {
    console.error("[Database] Failed to batch save student score data:", error);
    throw error;
  }
}

// 获取教师的所有学生数据
export async function getTeacherStudentData(userId: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    const results = await db.select().from(studentScoreData).where(eq(studentScoreData.userId, userId));
    return results;
  } catch (error) {
    console.error("[Database] Failed to get teacher student data:", error);
    throw error;
  }
}

// 更新学生成绩数据
export async function updateStudentScoreData(id: number, data: any) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    // 不允许更新 id 和 userId
    const { id: _, userId: __, ...updateData } = data;
    const result = await db.update(studentScoreData).set(updateData).where(eq(studentScoreData.id, id));
    return result;
  } catch (error) {
    console.error("[Database] Failed to update student score data:", error);
    throw error;
  }
}

// 删除学生成绩数据
export async function deleteStudentScoreData(id: number, userId: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    const result = await db.delete(studentScoreData).where(
      and(eq(studentScoreData.id, id), eq(studentScoreData.userId, userId))
    );
    return result;
  } catch (error) {
    console.error("[Database] Failed to delete student score data:", error);
    throw error;
  }
}

// 生成分享链接
export async function createShareLink(data: InsertShareLink) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    const result = await db.insert(shareLinks).values(data);
    return result;
  } catch (error) {
    console.error("[Database] Failed to create share link:", error);
    throw error;
  }
}

// 获取分享链接信息
export async function getShareLinkByCode(shareCode: string) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    const results = await db.select().from(shareLinks).where(eq(shareLinks.shareCode, shareCode)).limit(1);
    return results.length > 0 ? results[0] : null;
  } catch (error) {
    console.error("[Database] Failed to get share link:", error);
    throw error;
  }
}

// 获取分享链接中的学生数据
export async function getSharedStudentData(shareCode: string) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    const shareLink = await getShareLinkByCode(shareCode);
    if (!shareLink || shareLink.isActive === 0) {
      return null;
    }

    // 检查是否过期
    if (shareLink.expiresAt && new Date(shareLink.expiresAt) < new Date()) {
      return null;
    }

    // 如果有 studentData，优先返回
    if (shareLink.studentData) {
      try {
        const studentData = JSON.parse(shareLink.studentData);
        if (Array.isArray(studentData) && studentData.length > 0) {
          return studentData;
        }
      } catch (error) {
        console.error("[Database] Failed to parse studentData:", error);
      }
    }

    // 解析学生ID列表
    const studentIds = JSON.parse(shareLink.studentIds || "[]") as number[];
    
    if (studentIds.length === 0) {
      return [];
    }

    // 获取学生数据
    const results = await db.select().from(studentScoreData).where(
      eq(studentScoreData.userId, shareLink.userId)
    );

    // 检查 studentIds 是否是假 ID (1, 2, 3, ...)
    // 假 ID 的特征：是连续的整数，且最大值等于数组长度
    const isFakeIds = studentIds.length > 0 && 
      studentIds.every((id, idx) => id === idx + 1) && 
      studentIds[studentIds.length - 1] === studentIds.length;
    
    // 如果是假 ID，直接返回所有学生数据（按顶部顺序）
    if (isFakeIds) {
      return results.slice(0, studentIds.length);
    }

    // 否则根据真实 ID 过滤
    return results.filter(s => s.id && studentIds.includes(s.id));
  } catch (error) {
    console.error("[Database] Failed to get shared student data:", error);
    throw error;
  }
}

// 获取教师的所有分享链接
export async function getTeacherShareLinks(userId: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    const results = await db.select().from(shareLinks).where(eq(shareLinks.userId, userId));
    return results;
  } catch (error) {
    console.error("[Database] Failed to get teacher share links:", error);
    throw error;
  }
}


// 更新分享链接的查询统计
export async function updateShareLinkQueryStats(shareCode: string) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    const shareLink = await getShareLinkByCode(shareCode);
    if (!shareLink) {
      return null;
    }

    const result = await db.update(shareLinks)
      .set({
        queryCount: (shareLink.queryCount || 0) + 1,
        lastQueryAt: new Date(),
      })
      .where(eq(shareLinks.shareCode, shareCode));
    
    return result;
  } catch (error) {
    console.error("[Database] Failed to update share link query stats:", error);
    throw error;
  }
}

// 根据权限过滤学生数据
export async function filterStudentDataByPermission(
  students: any[],
  filterType: string,
  filterValue: string
) {
  if (filterType === "all" || !filterType) {
    return students;
  }

  if (filterType === "grade") {
    return students.filter(s => s.grade === filterValue);
  }

  if (filterType === "class") {
    return students.filter(s => s.class === filterValue);
  }

  return students;
}


// ===== 咨询相关函数 =====

// 获取或创建老师的微信信息
export async function getTeacherWechat(userId: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    const { teacherWechat } = await import("../drizzle/schema");
    const result = await db.select().from(teacherWechat).where(eq(teacherWechat.userId, userId));
    return result[0] || null;
  } catch (error) {
    console.error("[Database] Failed to get teacher wechat:", error);
    throw error;
  }
}

// 更新老师的微信号
export async function updateTeacherWechat(userId: number, wechatId: string) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    const { teacherWechat } = await import("../drizzle/schema");
    
    // 先检查是否存在
    const existing = await getTeacherWechat(userId);
    
    if (existing) {
      // 更新
      const result = await db.update(teacherWechat)
        .set({ wechatId })
        .where(eq(teacherWechat.userId, userId));
      return result;
    } else {
      // 插入
      const result = await db.insert(teacherWechat).values({
        userId,
        wechatId,
      });
      return result;
    }
  } catch (error) {
    console.error("[Database] Failed to update teacher wechat:", error);
    throw error;
  }
}

// 提交家长咨询
export async function createParentConsultation(
  parentId: number,
  teacherId: number,
  title: string,
  content: string,
  studentId?: number
) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    const { parentConsultations } = await import("../drizzle/schema");
    const result = await db.insert(parentConsultations).values({
      parentId,
      teacherId,
      studentId,
      title,
      content,
      status: "pending",
    });
    return result;
  } catch (error) {
    console.error("[Database] Failed to create consultation:", error);
    throw error;
  }
}

// 获取家长的咨询历史
export async function getParentConsultations(parentId: number, teacherId: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    const { parentConsultations } = await import("../drizzle/schema");
    const result = await db.select()
      .from(parentConsultations)
      .where(and(
        eq(parentConsultations.parentId, parentId),
        eq(parentConsultations.teacherId, teacherId)
      ))
      .orderBy(desc(parentConsultations.createdAt));
    return result;
  } catch (error) {
    console.error("[Database] Failed to get consultations:", error);
    throw error;
  }
}


// ===== 家长绑定相关函数 =====

import { parentBindings, InsertParentBinding } from "../drizzle/schema";

// 创建家长绑定关系
export async function createParentBinding(data: InsertParentBinding) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    const result = await db.insert(parentBindings).values(data);
    return result;
  } catch (error) {
    console.error("[Database] Failed to create parent binding:", error);
    throw error;
  }
}

// 批量创建家长绑定关系
export async function batchCreateParentBindings(records: InsertParentBinding[]) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    if (records.length > 0) {
      await db.insert(parentBindings).values(records);
    }
    return { success: true, count: records.length };
  } catch (error) {
    console.error("[Database] Failed to batch create parent bindings:", error);
    throw error;
  }
}

// 获取家长的所有绑定关系
export async function getParentBindings(parentId: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    const results = await db.select().from(parentBindings).where(eq(parentBindings.parentId, parentId));
    return results;
  } catch (error) {
    console.error("[Database] Failed to get parent bindings:", error);
    throw error;
  }
}

// 获取家长绑定的学生成绩数据（核心查询）
export async function getParentStudentScores(parentId: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    // 1. 获取家长的所有绑定
    const bindings = await getParentBindings(parentId);
    if (bindings.length === 0) {
      return [];
    }

    // 2. 获取绑定的学生 ID 列表
    const studentIds = bindings.map(b => b.studentId);

    // 3. 查询这些学生的最新成绩数据
    const results = await db.select().from(studentScoreData);
    const filtered = results.filter(s => s.id && studentIds.includes(s.id));

    return filtered;
  } catch (error) {
    console.error("[Database] Failed to get parent student scores:", error);
    throw error;
  }
}

// 删除家长绑定（解绑）
export async function deleteParentBinding(parentId: number, studentId: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    const result = await db.delete(parentBindings).where(
      and(eq(parentBindings.parentId, parentId), eq(parentBindings.studentId, studentId))
    );
    return result;
  } catch (error) {
    console.error("[Database] Failed to delete parent binding:", error);
    throw error;
  }
}

// 根据分享码获取教师对应的所有学生列表（只返回 id, name, grade, class，不含成绩详情）
export async function getShareCodeStudents(shareCode: string) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    const shareLink = await getShareLinkByCode(shareCode);
    if (!shareLink || shareLink.isActive === 0) {
      return null;
    }

    // 检查是否过期
    if (shareLink.expiresAt && new Date(shareLink.expiresAt) < new Date()) {
      return null;
    }

    // 获取该教师的学生数据
    const students = await db.select().from(studentScoreData).where(
      eq(studentScoreData.userId, shareLink.userId)
    );

    // 只返回基本信息（姓名、年级、班级、id），不含成绩
    return {
      teacherId: shareLink.userId,
      teacherName: shareLink.title,
      students: students.map(s => ({
        id: s.id,
        name: s.name,
        grade: s.grade,
        class: s.class,
        gender: s.gender,
      })),
    };
  } catch (error) {
    console.error("[Database] Failed to get share code students:", error);
    throw error;
  }
}

// 检查家长是否已绑定某个学生
export async function checkParentBindingExists(parentId: number, studentId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    const results = await db.select().from(parentBindings).where(
      and(eq(parentBindings.parentId, parentId), eq(parentBindings.studentId, studentId))
    );
    return results.length > 0;
  } catch (error) {
    console.error("[Database] Failed to check parent binding:", error);
    throw error;
  }
}


