import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";

describe("auth.login", () => {
  it("should successfully login with valid input", async () => {
    const caller = appRouter.createCaller({
      user: null,
      req: {} as any,
      res: {} as any,
    });

    const result = await caller.auth.login({
      name: "张三",
      userType: "teacher",
      phoneNumber: "13800138000",
      school: "北京市第一中学",
      grade: "初一",
      className: "1班",
    });

    expect(result.success).toBe(true);
    expect(result.message).toBe("Login successful");
  });

  it("should accept optional fields", async () => {
    const caller = appRouter.createCaller({
      user: null,
      req: {} as any,
      res: {} as any,
    });

    const result = await caller.auth.login({
      name: "李四",
      userType: "student",
    });

    expect(result.success).toBe(true);
  });

  it("should accept all user types", async () => {
    const caller = appRouter.createCaller({
      user: null,
      req: {} as any,
      res: {} as any,
    });

    const userTypes = ["teacher", "student", "parent"] as const;

    for (const userType of userTypes) {
      const result = await caller.auth.login({
        name: `User_${userType}`,
        userType,
      });

      expect(result.success).toBe(true);
    }
  });
});
