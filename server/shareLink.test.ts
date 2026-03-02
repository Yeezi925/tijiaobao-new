import { describe, expect, it, beforeEach, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import * as db from "./db";

// Mock the database functions
vi.mock("./db", async () => {
  const actual = await vi.importActual<typeof db>("./db");
  return {
    ...actual,
    createShareLink: vi.fn(),
    getSharedStudentData: vi.fn(),
    getShareLinkByCode: vi.fn(),
  };
});

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "teacher-user",
    email: "teacher@example.com",
    name: "Teacher User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };

  return ctx;
}

describe("Share Link with Student Data", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should accept studentData when creating share link", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Mock the database function
    const mockCreateShareLink = vi.spyOn(db, "createShareLink" as any);
    mockCreateShareLink.mockResolvedValueOnce({ insertId: 1 });

    const studentData = [
      {
        name: "Student 1",
        grade: "高一",
        class: "1班",
        gender: "男",
        total40: "30",
        longContrib: 8,
        ballContrib: 6,
        selectContrib: 16,
      },
      {
        name: "Student 2",
        grade: "高一",
        class: "1班",
        gender: "女",
        total40: "32",
        longContrib: 9,
        ballContrib: 7,
        selectContrib: 16,
      },
    ];

    const result = await caller.teacher.createShareLink({
      title: "Test Share",
      description: "Test description",
      studentIds: [1, 2],
      studentData: JSON.stringify(studentData),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    expect(result.success).toBe(true);
    expect(result.shareCode).toBeDefined();
    expect(result.shareCode).toMatch(/^[A-Z0-9]{8}$/);
    expect(mockCreateShareLink).toHaveBeenCalled();

    // Verify that studentData was passed to the database
    const callArgs = mockCreateShareLink.mock.calls[0]?.[0];
    expect(callArgs?.studentData).toBe(JSON.stringify(studentData));
  });

  it("should prioritize studentData when retrieving shared data", async () => {
    const studentDataInDb = [
      {
        id: 1,
        name: "Student 1",
        grade: "高一",
        class: "1班",
        gender: "男",
        total40: "30",
      },
      {
        id: 2,
        name: "Student 2",
        grade: "高一",
        class: "1班",
        gender: "女",
        total40: "32",
      },
    ];

    const mockGetSharedStudentData = vi.spyOn(db, "getSharedStudentData" as any);
    mockGetSharedStudentData.mockResolvedValueOnce(studentDataInDb);

    const caller = appRouter.createCaller({} as TrpcContext);

    const result = await caller.parent.getSharedData({
      shareCode: "TEST1234",
    });

    expect(result.success).toBe(true);
    expect(result.data).toEqual(studentDataInDb);
    expect(result.data).toHaveLength(2);
  });

  it("should handle expired share links correctly", async () => {
    const mockGetSharedStudentData = vi.spyOn(db, "getSharedStudentData" as any);
    mockGetSharedStudentData.mockResolvedValueOnce(null);

    const caller = appRouter.createCaller({} as TrpcContext);

    const result = await caller.parent.getSharedData({
      shareCode: "EXPIRED123",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("Invalid or expired share code");
    expect(result.data).toEqual([]);
  });

  it("should handle invalid share codes", async () => {
    const mockGetSharedStudentData = vi.spyOn(db, "getSharedStudentData" as any);
    mockGetSharedStudentData.mockResolvedValueOnce(null);

    const caller = appRouter.createCaller({} as TrpcContext);

    const result = await caller.parent.getSharedData({
      shareCode: "INVALID",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("Invalid or expired share code");
  });
});
