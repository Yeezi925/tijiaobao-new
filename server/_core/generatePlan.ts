/**
 * 教案生成接口（供微信小程序直接调用）
 * POST /api/generate-plan
 * body: { prompt: string }
 */

import type { Express } from "express";
import { invokeAliyunLLM } from "./aliyunLlm";

export function registerGeneratePlanRoute(app: Express) {
  app.post("/api/generate-plan", async (req, res) => {
    const { prompt } = req.body;
    if (!prompt) {
      res.status(400).json({ success: false, error: "prompt is required" });
      return;
    }

    try {
      const result = await invokeAliyunLLM({
        messages: [
          {
            role: "system",
            content:
              "你是专业的中小学体育教案生成专家，精通《义务教育体育与健康课程标准》。请严格按照用户要求的格式输出完整教案内容，每个章节都必须有实质性内容，不要省略任何部分。",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        maxTokens: 4096,
      });

      const content = result.output?.text || "";
      if (!content) {
        res.status(500).json({ success: false, error: "AI 未返回内容" });
        return;
      }

      res.json({ success: true, content });
    } catch (error: any) {
      console.error("[GeneratePlan] Failed:", error.message);
      res.status(500).json({ success: false, error: error.message || "生成失败" });
    }
  });
}
