import type { Express, Request, Response } from "express";
import { ENV } from "./env";

const MODEL = "claude-sonnet-4-6";

function getForgeUrl(): string {
  return ENV.forgeApiUrl
    ? ENV.forgeApiUrl.replace(/\/$/, "") + "/v1/chat/completions"
    : "https://forge.manus.im/v1/chat/completions";
}

// ========== 内存任务存储 ==========
interface Task {
  id: string;
  status: "pending" | "processing" | "done" | "error";
  result?: { success: boolean; advice?: string; error?: string };
  createdAt: number;
}

const tasks = new Map<string, Task>();

setInterval(() => {
  const now = Date.now();
  for (const [id, task] of tasks) {
    if (now - task.createdAt > 10 * 60 * 1000) tasks.delete(id);
  }
}, 60 * 1000);

// ========== 异步生成逻辑 ==========

async function processAdviceTask(task: Task, body: Record<string, any>) {
  task.status = "processing";
  const { name, gender, total40, longContrib, ballContrib, selectContrib } = body;

  try {
    const weakAreas: string[] = [];
    if ((longContrib || 0) < 10) weakAreas.push("长跑/游泳");
    if ((ballContrib || 0) < 6) weakAreas.push("球类项目");
    if ((selectContrib || 0) < 12) weakAreas.push("选考项目");

    let userPrompt = "请为以下学生提供个性化训练建议：\n\n";
    userPrompt += "姓名：" + name + "\n";
    userPrompt += "性别：" + gender + "\n";
    userPrompt += "总分：" + total40 + "/40分\n";
    userPrompt += "长跑/游泳得分：" + (longContrib || 0) + "/15分\n";
    userPrompt += "球类项目得分：" + (ballContrib || 0) + "/9分\n";
    userPrompt += "选考项目得分：" + (selectContrib || 0) + "/16分\n";
    if (weakAreas.length > 0) {
      userPrompt += "\n弱项：" + weakAreas.join("、") + "\n";
    }
    userPrompt += "\n请提供：\n";
    userPrompt += "1. 成绩分析（优势和不足）\n";
    userPrompt += "2. 针对弱项的训练计划（训练项目、频次、时长、强度）\n";
    userPrompt += "3. 预期改进目标（控制在500字以内）";

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
              "你是一位专业的体育教练。根据学生的体育成绩，提供简洁、可执行的个性化训练建议，控制在500字以内。",
          },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error("LLM invoke failed: " + response.status + " " + errorText);
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content || "";

    if (!content) {
      task.status = "error";
      task.result = { success: false, error: "AI 未返回内容" };
      return;
    }

    task.status = "done";
    task.result = { success: true, advice: content };
  } catch (error: any) {
    console.error("[GenerateAdvice] Task " + task.id + " failed:", error.message);
    task.status = "error";
    task.result = { success: false, error: error.message || "生成失败" };
  }
}

// ========== 提交任务（立即返回 taskId） ==========

function handleSubmit(req: Request, res: Response) {
  const { name, gender } = req.body;

  if (!name || !gender) {
    res.status(400).json({ success: false, error: "name and gender are required" });
    return;
  }

  const taskId = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const task: Task = { id: taskId, status: "pending", createdAt: Date.now() };
  tasks.set(taskId, task);

  processAdviceTask(task, req.body);

  res.json({ success: true, taskId: taskId });
}

// ========== 查询任务结果 ==========

function handleQuery(req: Request, res: Response) {
  const taskId = req.params.taskId;
  const task = tasks.get(taskId);

  if (!task) {
    res.status(404).json({ success: false, error: "任务不存在或已过期" });
    return;
  }

  res.json({
    success: true,
    taskId: task.id,
    status: task.status,
    result: task.result || null,
  });
}

// ========== 路由导出 ==========

export function registerAdviceRoute(app: Express) {
  app.post("/api/generate-advice", handleSubmit);
  app.get("/api/generate-advice/:taskId", handleQuery);
}
