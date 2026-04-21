import type { Express, Request, Response } from "express";
import { ENV } from "./env";

const MODEL = "claude-sonnet-4-6";

function getForgeUrl(): string {
  return ENV.forgeApiUrl
    ? ENV.forgeApiUrl.replace(/\/$/, "") + "/v1/chat/completions"
    : "https://forge.manus.im/v1/chat/completions";
}

async function handleGeneratePlan(req: Request, res: Response) {
  const { prompt } = req.body;

  if (!prompt) {
    res.status(400).json({ success: false, error: "prompt is required" });
    return;
  }

  try {
    const response = await fetch(getForgeUrl(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + ENV.forgeApiKey,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: "system",
            content:
              "你是专业的中小学体育教案生成专家，精通《义务教育体育与健康课程标准》。" +
              "请根据用户需求生成规范的体育教案，包含教学目标、教学重难点、" +
              "教学过程（准备部分、基本部分、结束部分）、场地器材要求等。",
          },
          { role: "user", content: prompt },
        ],
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error("LLM invoke failed: " + response.status + " " + errorText);
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content || "";

    if (!content) {
      res.status(500).json({ success: false, error: "AI 未返回内容" });
      return;
    }

    res.json({ success: true, content });
  } catch (error: any) {
    console.error("[GeneratePlan] Failed:", error.message);
    res.status(500).json({ success: false, error: error.message || "生成失败" });
  }
}

/**
 * 导出路由配置，不在模块级别执行 app.post()，
 * 避免 esbuild bundle 将调用提升到 startServer() 之外。
 */
export const planRoute = {
  method: "post" as const,
  path: "/api/generate-plan",
  handler: handleGeneratePlan,
};

/**
 * 在 startServer() 内调用此函数注册路由。
 */
export function registerPlanRoute(app: Express) {
  app[planRoute.method](planRoute.path, planRoute.handler);
}
