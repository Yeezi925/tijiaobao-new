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
  result?: { success: boolean; type?: string; title?: string; content?: string; error?: string };
  createdAt: number;
}

const tasks = new Map<string, Task>();

setInterval(() => {
  const now = Date.now();
  for (const [id, task] of tasks) {
    if (now - task.createdAt > 10 * 60 * 1000) tasks.delete(id);
  }
}, 60 * 1000);

// ========== 5 套 Prompt 模板（含 max_tokens 配置） ==========

const PROMPTS: Record<string, { system: string; buildUser: (data: Record<string, any>) => string; maxTokens: number }> = {
  "semester-plan": {
    system:
      "你是一位资深的中小学体育教师和教研专家，擅长制定学期教学计划。" +
      "请根据《义务教育体育与健康课程标准》和老师提供的信息，生成一份完整、规范的学期体育教学计划。\n\n" +
      "输出要求：\n" +
      "1. 使用 Markdown 格式\n" +
      "2. 包含：学情分析、教学目标（知识技能、体能发展、品德培养）、教学进度表（按周/课时编排）、考核评价方式\n" +
      "3. 教学进度表用表格形式，每周标注教学内容、重点、备注\n" +
      "4. 内容要具体、可执行，符合实际教学场景",
    buildUser: (data) => {
      let p = "请制定一份学期体育教学计划：\n\n";
      p += "学校/年级：" + (data.schoolGrade || "未指定") + "\n";
      p += "班级数量：" + (data.classCount || "未指定") + "\n";
      p += "学期：" + (data.semester || "未指定") + "\n";
      p += "学期周数：" + (data.weekCount || "18") + "周\n";
      p += "每周课时：" + (data.sessionsPerWeek || "3") + "节\n";
      p += "重点教学内容：" + (data.keyContent || "未指定") + "\n";
      p += "教学目标：" + (data.goal || "未指定") + "\n";
      if (data.note) p += "补充说明：" + data.note + "\n";
      return p;
    },
    maxTokens: 4096
  },

  "team-plan": {
    system:
      "你是一位专业的体育教练，擅长制定球队/运动队训练计划。" +
      "请根据老师提供的信息，生成一份科学、系统的训练计划。\n\n" +
      "输出要求：\n" +
      "1. 使用 Markdown 格式\n" +
      "2. 包含：队伍现状分析、训练目标（短期/长期）、阶段性训练安排（准备期/提高期/比赛期/调整期）、" +
      "每周训练课表、体能训练方案、技术训练要点\n" +
      "3. 训练课表用表格形式，标注时间、内容、强度、负荷\n" +
      "4. 注意训练量和恢复的平衡，避免过度训练",
    buildUser: (data) => {
      let p = "请制定一份球队训练计划：\n\n";
      p += "球队类型：" + (data.teamType || "未指定") + "\n";
      p += "队员人数：" + (data.memberCount || "未指定") + "\n";
      p += "队员水平：" + (data.level || "未指定") + "\n";
      p += "训练周期：" + (data.period || "一学期") + "\n";
      p += "每周训练次数：" + (data.sessionsPerWeek || "3") + "次\n";
      p += "训练目标：" + (data.goal || "未指定") + "\n";
      if (data.matchDate) p += "重要比赛时间：" + data.matchDate + "\n";
      if (data.note) p += "补充说明：" + data.note + "\n";
      return p;
    },
    maxTokens: 3072
  },

  "semester-summary": {
    system:
      "你是一位资深的体育教师和教学评估专家。" +
      "请根据老师提供的信息，生成一份专业、全面的学期体育教学总结。\n\n" +
      "输出要求：\n" +
      "1. 使用 Markdown 格式\n" +
      "2. 包含：教学工作概况、教学目标完成情况、学生体质提升情况、" +
      "教学亮点与创新、存在的问题与不足、改进措施与下学期展望\n" +
      "3. 用数据说话，尽量量化成果\n" +
      "4. 态度客观，既肯定成绩也直面问题",
    buildUser: (data) => {
      let p = "请生成一份学期体育教学总结：\n\n";
      p += "学校/年级：" + (data.schoolGrade || "未指定") + "\n";
      p += "班级数量：" + (data.classCount || "未指定") + "\n";
      p += "学期：" + (data.semester || "未指定") + "\n";
      p += "主要教学内容：" + (data.mainContent || "未指定") + "\n";
      p += "学生整体表现：" + (data.studentPerformance || "未指定") + "\n";
      p += "教学亮点：" + (data.highlights || "未指定") + "\n";
      p += "存在的问题：" + (data.problems || "未指定") + "\n";
      if (data.note) p += "补充说明：" + data.note + "\n";
      return p;
    },
    maxTokens: 3072
  },

  "competition-summary": {
    system:
      "你是一位经验丰富的体育教师和体育赛事评估专家。" +
      "请根据老师提供的信息，生成一份详尽的比赛/考试总结报告。\n\n" +
      "输出要求：\n" +
      "1. 使用 Markdown 格式\n" +
      "2. 包含：赛事概况、成绩统计与分析（分项目）、优势项目与短板、" +
      "个人/团队表现亮点、暴露的问题、下一步训练改进方向\n" +
      "3. 成绩统计用表格形式\n" +
      "4. 分析要深入，建议要具体可操作",
    buildUser: (data) => {
      let p = "请生成一份比赛/考试总结：\n\n";
      p += "比赛/考试名称：" + (data.eventName || "未指定") + "\n";
      p += "时间：" + (data.eventDate || "未指定") + "\n";
      p += "参与人数：" + (data.participantCount || "未指定") + "\n";
      p += "项目：" + (data.events || "未指定") + "\n";
      p += "成绩概况：" + (data.resultOverview || "未指定") + "\n";
      p += "亮点表现：" + (data.highlights || "未指定") + "\n";
      p += "存在不足：" + (data.weaknesses || "未指定") + "\n";
      if (data.note) p += "补充说明：" + data.note + "\n";
      return p;
    },
    maxTokens: 3072
  },

  "personal-plan": {
    system:
      "你是一位专业的体育教练和学生发展顾问。" +
      "请根据学生的个人信息和成绩数据，为其制定一份个性化的训练计划。\n\n" +
      "输出要求：\n" +
      "1. 使用 Markdown 格式\n" +
      "2. 包含：个人能力评估、优势与弱项分析、训练目标、" +
      "分阶段训练计划（每周详细安排）、营养与恢复建议、阶段性检查节点\n" +
      "3. 每周训练安排用表格形式，标注日期/次数、训练内容、时长、强度\n" +
      "4. 目标要合理（SMART原则），计划要循序渐进\n" +
      "5. 注意学生的年龄和身体条件，训练强度要适中",
    buildUser: (data) => {
      let p = "请为以下学生制定个性化训练计划：\n\n";
      p += "学生姓名：" + (data.name || "未指定") + "\n";
      p += "性别：" + (data.gender || "未指定") + "\n";
      p += "年级：" + (data.grade || "未指定") + "\n";
      p += "当前水平：" + (data.currentLevel || "未指定") + "\n";
      p += "目标项目：" + (data.targetEvent || "未指定") + "\n";
      p += "训练周期：" + (data.period || "一学期") + "\n";
      if (data.scores) p += "当前成绩：" + data.scores + "\n";
      if (data.note) p += "补充说明：" + data.note + "\n";
      return p;
    },
    maxTokens: 2048
  }
};

// ========== 异步生成逻辑 ==========

async function processTask(task: Task, type: string, formData: Record<string, any>) {
  const promptConfig = PROMPTS[type];
  task.status = "processing";

  try {
    const userPrompt = promptConfig.buildUser(formData);

    const response = await fetch(getForgeUrl(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + ENV.forgeApiKey,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: promptConfig.system },
          { role: "user", content: userPrompt },
        ],
        max_tokens: promptConfig.maxTokens,
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

    const titles: Record<string, string> = {
      "semester-plan": formData.semester + " " + formData.schoolGrade + " 体育教学计划",
      "team-plan": formData.teamType + "训练计划",
      "semester-summary": formData.semester + " " + formData.schoolGrade + " 体育教学总结",
      "competition-summary": formData.eventName + " 总结报告",
      "personal-plan": formData.name + " 个性化训练计划",
    };

    task.status = "done";
    task.result = {
      success: true,
      type: type,
      title: titles[type] || "文档",
      content: content,
    };
  } catch (error: any) {
    console.error("[GenerateDocument] Task " + task.id + " failed:", error.message);
    task.status = "error";
    task.result = { success: false, error: error.message || "生成失败" };
  }
}

// ========== 提交任务 ==========

function handleSubmit(req: Request, res: Response) {
  const { type, formData } = req.body;

  const validTypes = Object.keys(PROMPTS);
  if (!type || !validTypes.includes(type)) {
    res.status(400).json({
      success: false,
      error: "Invalid type. Supported: " + validTypes.join(", ")
    });
    return;
  }

  if (!formData || typeof formData !== "object") {
    res.status(400).json({ success: false, error: "formData is required" });
    return;
  }

  const taskId = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const task: Task = { id: taskId, status: "pending", createdAt: Date.now() };
  tasks.set(taskId, task);

  processTask(task, type, formData);

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

export function registerDocumentRoute(app: Express) {
  app.post("/api/generate-document", handleSubmit);
  app.get("/api/generate-document/:taskId", handleQuery);
}
