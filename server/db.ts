import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users } from "../drizzle/schema";
import { ENV } from './_core/env';

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

    // 解析学生ID列表
    const studentIds = JSON.parse(shareLink.studentIds || "[]") as number[];
    
    if (studentIds.length === 0) {
      return [];
    }

    // 获取学生数据
    const results = await db.select().from(studentScoreData).where(
      eq(studentScoreData.userId, shareLink.userId)
    );

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
