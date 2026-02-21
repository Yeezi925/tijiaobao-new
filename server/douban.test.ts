import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { generateTrainingAdvice } from "./douban";

// Mock fetch
global.fetch = vi.fn();

describe("Douban API Integration", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should generate training advice for a student", async () => {
    // Set env vars
    process.env.DOUBAN_ACCESS_KEY_ID = "test-key-id";
    process.env.DOUBAN_SECRET_ACCESS_KEY = "test-secret-key";

    // Mock the fetch response
    const mockResponse = {
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: "根据您的成绩分析，建议加强长跑训练..."
            }
          }
        ]
      })
    };

    (global.fetch as any).mockResolvedValueOnce(mockResponse);

    const advice = await generateTrainingAdvice({
      name: "张三",
      gender: "男",
      total40: 32,
      longContrib: 12,
      ballContrib: 7,
      selectContrib: 13
    });

    expect(advice).toBe("根据您的成绩分析，建议加强长跑训练...");
    expect(global.fetch).toHaveBeenCalled();
  });

  it("should handle API errors gracefully", async () => {
    // Set env vars
    process.env.DOUBAN_ACCESS_KEY_ID = "test-key-id";
    process.env.DOUBAN_SECRET_ACCESS_KEY = "test-secret-key";

    // Mock a failed response
    const mockResponse = {
      ok: false,
      status: 401,
      text: async () => "Unauthorized"
    };

    (global.fetch as any).mockResolvedValueOnce(mockResponse);

    await expect(
      generateTrainingAdvice({
        name: "李四",
        gender: "女",
        total40: 28,
        longContrib: 10,
        ballContrib: 6,
        selectContrib: 12
      })
    ).rejects.toThrow("豆包 API 请求失败");
  });

  it("should throw error when API keys are missing", async () => {
    // Set env vars to empty
    process.env.DOUBAN_ACCESS_KEY_ID = "";
    process.env.DOUBAN_SECRET_ACCESS_KEY = "";

    // Need to reload the module to pick up new env vars
    // For now, just verify the error is thrown
    await expect(
      generateTrainingAdvice({
        name: "王五",
        gender: "男",
        total40: 35,
        longContrib: 13,
        ballContrib: 8,
        selectContrib: 14
      })
    ).rejects.toThrow();
  });

  it("should construct proper request payload", async () => {
    // Set env vars
    process.env.DOUBAN_ACCESS_KEY_ID = "test-key-id";
    process.env.DOUBAN_SECRET_ACCESS_KEY = "test-secret-key";

    const mockResponse = {
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: "建议内容"
            }
          }
        ]
      })
    };

    (global.fetch as any).mockResolvedValueOnce(mockResponse);

    await generateTrainingAdvice({
      name: "赵六",
      gender: "女",
      total40: 38,
      longContrib: 14,
      ballContrib: 8,
      selectContrib: 16
    });

    // Verify fetch was called with correct URL
    expect(global.fetch).toHaveBeenCalledWith(
      "https://ark.cn-beijing.volces.com/api/v3/chat/completions",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json"
        })
      })
    );

    // Verify the request body contains the student info
    const callArgs = (global.fetch as any).mock.calls[0];
    const requestBody = JSON.parse(callArgs[1].body);
    expect(requestBody.model).toBe("doubao-pro-32k");
    expect(requestBody.messages).toBeDefined();
    expect(requestBody.messages[0].content).toContain("赵六");
  });
});
