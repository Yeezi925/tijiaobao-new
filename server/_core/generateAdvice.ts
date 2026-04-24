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
}, 60 * 60 * 1000);

// ========== 获取评分等级 ==========
function getScoreLevel(contrib: number, maxScore: number): string {
  const percentage = (contrib / maxScore) * 100;
  if (percentage >= 90) return "优秀";
  if (percentage >= 75) return "良好";
  if (percentage >= 60) return "及格";
  return "待提高";
}

// ========== 获取弱项提示 ==========
function getWeakTip(contrib: number | undefined, maxScore: number, projectName: string): string {
  if ((contrib || 0) < maxScore * 0.6) {
    return `⚠️ ${projectName}是薄弱环节，需要重点加强`;
  }
  return "";
}

// ========== 异步生成逻辑 ==========

async function processAdviceTask(task: Task, body: Record<string, any>) {
  task.status = "processing";

  try {
    // 构建详细的学生成绩信息
    let scoreDetails = "";

    // 长跑/游泳
    if (body.longProject && body.longRaw) {
      const longMax = 15;
      const longLevel = getScoreLevel(body.longContrib || 0, longMax);
      const longWeakTip = getWeakTip(body.longContrib, longMax, body.longProject);
      scoreDetails += `【长跑/游泳】\n`;
      scoreDetails += `- 项目：${body.longProject}\n`;
      scoreDetails += `- 原始成绩：${body.longRaw}\n`;
      scoreDetails += `- 得分：${body.longContrib || 0}/${longMax}分（${longLevel}）\n`;
      if (longWeakTip) scoreDetails += `- ${longWeakTip}\n`;
      scoreDetails += `\n`;
    }

    // 球类
    if (body.ballProject && body.ballRaw) {
      const ballMax = 9;
      const ballLevel = getScoreLevel(body.ballContrib || 0, ballMax);
      const ballWeakTip = getWeakTip(body.ballContrib, ballMax, body.ballProject);
      scoreDetails += `【球类项目】\n`;
      scoreDetails += `- 项目：${body.ballProject}\n`;
      scoreDetails += `- 原始成绩：${body.ballRaw}\n`;
      scoreDetails += `- 得分：${body.ballContrib || 0}/${ballMax}分（${ballLevel}）\n`;
      if (ballWeakTip) scoreDetails += `- ${ballWeakTip}\n`;
      scoreDetails += `\n`;
    }

    // 选考1
    if (body.selectProject1 && body.selectRaw1) {
      const selectMax = 8;
      const contrib1 = typeof body.selectContrib1 === "string" ? parseFloat(body.selectContrib1) : body.selectContrib1 || 0;
      const selectLevel = getScoreLevel(contrib1, selectMax);
      const selectWeakTip = getWeakTip(contrib1, selectMax, body.selectProject1);
      scoreDetails += `【选考项目一】\n`;
      scoreDetails += `- 项目：${body.selectProject1}\n`;
      scoreDetails += `- 原始成绩：${body.selectRaw1}\n`;
      scoreDetails += `- 得分：${contrib1}/${selectMax}分（${selectLevel}）\n`;
      if (selectWeakTip) scoreDetails += `- ${selectWeakTip}\n`;
      scoreDetails += `\n`;
    }

    // 选考2
    if (body.selectProject2 && body.selectRaw2) {
      const selectMax = 8;
      const contrib2 = typeof body.selectContrib2 === "string" ? parseFloat(body.selectContrib2) : body.selectContrib2 || 0;
      const selectLevel = getScoreLevel(contrib2, selectMax);
      const selectWeakTip = getWeakTip(contrib2, selectMax, body.selectProject2);
      scoreDetails += `【选考项目二】\n`;
      scoreDetails += `- 项目：${body.selectProject2}\n`;
      scoreDetails += `- 原始成绩：${body.selectRaw2}\n`;
      scoreDetails += `- 得分：${contrib2}/${selectMax}分（${selectLevel}）\n`;
      if (selectWeakTip) scoreDetails += `- ${selectWeakTip}\n`;
      scoreDetails += `\n`;
    }

    // 构建用户提示词
    let userPrompt = `请为以下学生分析各项成绩并给出针对性训练建议：\n\n`;
    userPrompt += `【基本信息】\n`;
    userPrompt += `姓名：${body.name}\n`;
    userPrompt += `性别：${body.gender}\n`;
    if (body.grade) userPrompt += `年段：${body.grade}\n`;
    if (body.class) userPrompt += `班级：${body.class}\n`;
    userPrompt += `总分：${body.total40}/40分\n\n`;
    userPrompt += `【各项成绩详情】\n`;
    userPrompt += scoreDetails || "（暂无详细成绩数据）\n";
    userPrompt += `\n请按以下格式输出训练建议：\n\n`;
    userPrompt += `## 一、成绩综合分析\n`;
    userPrompt += `简要分析该生的整体体育水平，指出优势和薄弱项目。\n\n`;
    userPrompt += `## 二、分项目训练建议\n`;
    userPrompt += `针对每一项成绩，给出具体的训练方案：\n\n`;
    userPrompt += `### 1. 【项目名称】\n`;
    userPrompt += `- 当前水平：xxx\n`;
    userPrompt += `- 训练目标：xxx\n`;
    userPrompt += `- 推荐训练内容：\n`;
    userPrompt += `  - 训练动作1：动作要领 + 练习方法\n`;
    userPrompt += `  - 训练动作2：动作要领 + 练习方法\n`;
    userPrompt += `- 训练频次：每周x次\n`;
    userPrompt += `- 每次时长：x分钟\n`;
    userPrompt += `- 注意事项：xxx\n\n`;
    userPrompt += `## 三、训练重点提醒\n`;
    userPrompt += `指出最需要加强的项目，给出短期改进目标（1-2个月）。`;

    const systemPrompt = `你是一位专业的体育教练，擅长根据学生的具体体育成绩，提供针对每一项运动的个性化训练建议。

你的建议要求：
1. 针对学生参加的每一个体育项目，分别给出具体的训练建议
2. 训练建议要包含：训练内容、训练方法、训练频次、注意事项
3. 结合学生性别和年龄段（如果有），给出科学的训练强度建议
4. 突出重点薄弱项目的训练方案
5. 建议要具体、可执行，适合在学校或家庭环境中开展
6. 控制在500字以内，语言简洁专业`;

    console.log("[GenerateAdvice] 学生信息:", JSON.stringify({
      name: body.name,
      gender: body.gender,
      total40: body.total40,
      hasDetail: !!body.longProject
    }, null, 2));

    const response = await fetch(getForgeUrl(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + ENV.forgeApiKey,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 1500,
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
