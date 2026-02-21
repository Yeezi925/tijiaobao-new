import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { generateTrainingAdvice } from "./douban";

// Mock invokeLLM
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn()
}));

import { invokeLLM } from "./_core/llm";

describe("AI Training Advice Generation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should generate training advice for a student", async () => {
    const mockResponse = {
      choices: [
        {
          message: {
            content: "根据您的成绩分析，建议加强长跑训练..."
          }
        }
      ]
    };

    (invokeLLM as any).mockResolvedValueOnce(mockResponse);

    const advice = await generateTrainingAdvice({
      name: "张三",
      gender: "男",
      total40: 32,
      longContrib: 12,
      ballContrib: 7,
      selectContrib: 13
    });

    expect(advice).toBe("根据您的成绩分析，建议加强长跑训练...");
    expect(invokeLLM).toHaveBeenCalled();
  });

  it("should include grade and class in the prompt", async () => {
    const mockResponse = {
      choices: [
        {
          message: {
            content: "建议内容"
          }
        }
      ]
    };

    (invokeLLM as any).mockResolvedValueOnce(mockResponse);

    await generateTrainingAdvice({
      name: "李四",
      gender: "女",
      grade: "高一",
      class: "1班",
      total40: 28,
      longContrib: 10,
      ballContrib: 6,
      selectContrib: 12
    });

    const callArgs = (invokeLLM as any).mock.calls[0][0];
    expect(callArgs.messages).toBeDefined();
    expect(callArgs.messages[1].content).toContain("李四");
    expect(callArgs.messages[1].content).toContain("高一");
    expect(callArgs.messages[1].content).toContain("1班");
  });

  it("should handle missing optional fields", async () => {
    const mockResponse = {
      choices: [
        {
          message: {
            content: "建议内容"
          }
        }
      ]
    };

    (invokeLLM as any).mockResolvedValueOnce(mockResponse);

    const advice = await generateTrainingAdvice({
      name: "王五",
      gender: "男",
      total40: 35
    });

    expect(advice).toBe("建议内容");
    expect(invokeLLM).toHaveBeenCalled();
  });

  it("should throw error when LLM returns empty response", async () => {
    const mockResponse = {
      choices: []
    };

    (invokeLLM as any).mockResolvedValueOnce(mockResponse);

    await expect(
      generateTrainingAdvice({
        name: "赵六",
        gender: "女",
        total40: 38,
        longContrib: 14,
        ballContrib: 8,
        selectContrib: 16
      })
    ).rejects.toThrow("LLM 返回空响应");
  });

  it("should throw error when LLM call fails", async () => {
    (invokeLLM as any).mockRejectedValueOnce(new Error("LLM 服务不可用"));

    await expect(
      generateTrainingAdvice({
        name: "孙七",
        gender: "男",
        total40: 25,
        longContrib: 9,
        ballContrib: 5,
        selectContrib: 11
      })
    ).rejects.toThrow("LLM 服务不可用");
  });

  it("should format student info correctly in prompt", async () => {
    const mockResponse = {
      choices: [
        {
          message: {
            content: "建议内容"
          }
        }
      ]
    };

    (invokeLLM as any).mockResolvedValueOnce(mockResponse);

    await generateTrainingAdvice({
      name: "周八",
      gender: "女",
      grade: "高二",
      class: "2班",
      total40: 36,
      longContrib: 13,
      ballContrib: 8,
      selectContrib: 15
    });

    const callArgs = (invokeLLM as any).mock.calls[0][0];
    const userMessage = callArgs.messages[1].content;

    expect(userMessage).toContain("周八");
    expect(userMessage).toContain("女");
    expect(userMessage).toContain("高二");
    expect(userMessage).toContain("2班");
    expect(userMessage).toContain("36/40分");
    expect(userMessage).toContain("13/15分");
    expect(userMessage).toContain("8/9分");
    expect(userMessage).toContain("15/16分");
  });
});
