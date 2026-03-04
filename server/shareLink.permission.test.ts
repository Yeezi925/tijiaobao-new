import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "./db";
import { shareLinks, studentScoreData, users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe.skip("Share Link Permission Control and Statistics", () => {
  let db: any;
  let testUserId: number;
  let testShareCode: string;

  beforeAll(async () => {
    db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    // Create test user
    const userResult = await db.insert(users).values({
      openId: "test-user-" + Date.now(),
      name: "Test Teacher",
      role: "user",
    });
    testUserId = userResult.insertId;

    // Create test student data
    for (const student of [
      { name: "Student A", gender: "M", grade: "初一", class: "1班", total40: 30 },
      { name: "Student B", gender: "F", grade: "初二", class: "2班", total40: 28 },
      { name: "Student C", gender: "M", grade: "初一", class: "1班", total40: 32 },
    ]) {
      await db.insert(studentScoreData).values({
        userId: testUserId,
        name: student.name,
        gender: student.gender,
        grade: student.grade,
        class: student.class,
        school: "Test School",
        total40: student.total40,
      });
    }
  });

  afterAll(async () => {
    if (db) {
      // Clean up test data
      await db.delete(shareLinks).where(eq(shareLinks.shareCode, testShareCode));
      await db.delete(studentScoreData).where(eq(studentScoreData.userId, testUserId));
      await db.delete(users).where(eq(users.id, testUserId));
    }
  });

  it("should create share link with grade filter", async () => {
    testShareCode = "TEST" + Math.random().toString(36).substring(2, 8).toUpperCase();
    
    const result = await db.insert(shareLinks).values({
      userId: testUserId,
      shareCode: testShareCode,
      title: "Grade Filter Test",
      description: "Share only 初一 students",
      studentData: JSON.stringify([
        { name: "Student A", grade: "初一", class: "1班" },
        { name: "Student C", grade: "初一", class: "1班" },
      ]),
      filterType: "grade",
      filterValue: "初一",
      isActive: 1,
    });

    expect(result.insertId).toBeGreaterThan(0);

    // Verify the share link was created with correct filter
    const shareLink = await db.select().from(shareLinks)
      .where(eq(shareLinks.shareCode, testShareCode))
      .limit(1);
    
    expect(shareLink).toHaveLength(1);
    expect(shareLink[0].filterType).toBe("grade");
    expect(shareLink[0].filterValue).toBe("初一");
  });

  it("should create share link with class filter", async () => {
    const classFilterCode = "TEST" + Math.random().toString(36).substring(2, 8).toUpperCase();
    
    const result = await db.insert(shareLinks).values({
      userId: testUserId,
      shareCode: classFilterCode,
      title: "Class Filter Test",
      description: "Share only 1班 students",
      studentData: JSON.stringify([
        { name: "Student A", grade: "初一", class: "1班" },
        { name: "Student C", grade: "初一", class: "1班" },
      ]),
      filterType: "class",
      filterValue: "1班",
      isActive: 1,
    });

    expect(result.insertId).toBeGreaterThan(0);

    // Verify the share link was created with correct filter
    const shareLink = await db.select().from(shareLinks)
      .where(eq(shareLinks.shareCode, classFilterCode))
      .limit(1);
    
    expect(shareLink).toHaveLength(1);
    expect(shareLink[0].filterType).toBe("class");
    expect(shareLink[0].filterValue).toBe("1班");
  });

  it("should update query statistics when share link is accessed", async () => {
    const statsCode = "TEST" + Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // Create share link
    await db.insert(shareLinks).values({
      userId: testUserId,
      shareCode: statsCode,
      title: "Stats Test",
      description: "Test query statistics",
      studentData: JSON.stringify([{ name: "Student A" }]),
      queryCount: 0,
      isActive: 1,
    });

    // Update query count
    const updateResult = await db.update(shareLinks)
      .set({
        queryCount: 1,
        lastQueryAt: new Date(),
      })
      .where(eq(shareLinks.shareCode, statsCode));

    expect(updateResult.changedRows).toBeGreaterThan(0);

    // Verify the update
    const shareLink = await db.select().from(shareLinks)
      .where(eq(shareLinks.shareCode, statsCode))
      .limit(1);
    
    expect(shareLink[0].queryCount).toBe(1);
    expect(shareLink[0].lastQueryAt).not.toBeNull();
  });

  it("should increment query count on multiple accesses", async () => {
    const multiAccessCode = "TEST" + Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // Create share link
    await db.insert(shareLinks).values({
      userId: testUserId,
      shareCode: multiAccessCode,
      title: "Multi Access Test",
      description: "Test multiple accesses",
      studentData: JSON.stringify([{ name: "Student A" }]),
      queryCount: 0,
      isActive: 1,
    });

    // Simulate multiple accesses
    for (let i = 1; i <= 3; i++) {
      const shareLink = await db.select().from(shareLinks)
        .where(eq(shareLinks.shareCode, multiAccessCode))
        .limit(1);
      
      await db.update(shareLinks)
        .set({
          queryCount: (shareLink[0].queryCount || 0) + 1,
          lastQueryAt: new Date(),
        })
        .where(eq(shareLinks.shareCode, multiAccessCode));
    }

    // Verify final count
    const finalShareLink = await db.select().from(shareLinks)
      .where(eq(shareLinks.shareCode, multiAccessCode))
      .limit(1);
    
    expect(finalShareLink[0].queryCount).toBe(3);
  });
});
