/**
 * AI 训练建议生成模块
 * 使用 Manus 内置 LLM 服务
 * 根据每项成绩生成针对性训练建议
 */

import { invokeLLM } from "./_core/llm";

interface StudentDetailInfo {
  name: string;
  gender: string;
  grade?: string;
  class?: string;
  total40: number;
  // 长跑/游泳
  longProject?: string;
  longRaw?: number;
  longContrib?: number;
  // 球类
  ballProject?: string;
  ballRaw?: number;
  ballContrib?: number;
  // 选考1
  selectProject1?: string;
  selectRaw1?: number;
  selectContrib1?: string;
  // 选考2
  selectProject2?: string;
  selectRaw2?: number;
  selectContrib2?: string;
  // 总贡献分（兼容旧参数）
  longContrib?: number;
  ballContrib?: number;
  selectContrib?: number;
}

/**
 * 获取项目评分等级描述
 */
function getScoreLevel(contrib: number, maxScore: number): string {
  const percentage = (contrib / maxScore) * 100;
  if (percentage >= 90) return "优秀";
  if (percentage >= 75) return "良好";
  if (percentage >= 60) return "及格";
  return "待提高";
}

/**
 * 获取弱项提示语
 */
function getWeakTips(contrib: number | undefined, maxScore: number, projectName: string): string {
  if ((contrib || 0) < maxScore * 0.6) {
    return `⚠️ ${projectName}是薄弱环节，需要重点加强`;
  }
  return "";
}

/**
 * 调用 LLM 生成 AI 训练建议
 */
export async function generateTrainingAdvice(studentInfo: StudentDetailInfo): Promise<string> {
  // 构建详细的学生成绩信息
  let scoreDetails = "";

  // 长跑/游泳
  if (studentInfo.longProject && studentInfo.longRaw) {
    const longMax = 15;
    const longLevel = getScoreLevel(studentInfo.longContrib || 0, longMax);
    const longWeakTip = getWeakTips(studentInfo.longContrib, longMax, studentInfo.longProject);
    scoreDetails += `【长跑/游泳】\n`;
    scoreDetails += `- 项目：${studentInfo.longProject}\n`;
    scoreDetails += `- 原始成绩：${studentInfo.longRaw}\n`;
    scoreDetails += `- 得分：${studentInfo.longContrib || 0}/${longMax}分（${longLevel}）\n`;
    if (longWeakTip) scoreDetails += `- ${longWeakTip}\n`;
    scoreDetails += `\n`;
  }

  // 球类
  if (studentInfo.ballProject && studentInfo.ballRaw) {
    const ballMax = 9;
    const ballLevel = getScoreLevel(studentInfo.ballContrib || 0, ballMax);
    const ballWeakTip = getWeakTips(studentInfo.ballContrib, ballMax, studentInfo.ballProject);
    scoreDetails += `【球类项目】\n`;
    scoreDetails += `- 项目：${studentInfo.ballProject}\n`;
    scoreDetails += `- 原始成绩：${studentInfo.ballRaw}\n`;
    scoreDetails += `- 得分：${studentInfo.ballContrib || 0}/${ballMax}分（${ballLevel}）\n`;
    if (ballWeakTip) scoreDetails += `- ${ballWeakTip}\n`;
    scoreDetails += `\n`;
  }

  // 选考1
  if (studentInfo.selectProject1 && studentInfo.selectRaw1) {
    const selectMax = 8;
    const contrib1 = typeof studentInfo.selectContrib1 === "string" ? parseFloat(studentInfo.selectContrib1) : studentInfo.selectContrib1 || 0;
    const selectLevel = getScoreLevel(contrib1, selectMax);
    const selectWeakTip = getWeakTips(contrib1, selectMax, studentInfo.selectProject1);
    scoreDetails += `【选考项目一】\n`;
    scoreDetails += `- 项目：${studentInfo.selectProject1}\n`;
    scoreDetails += `- 原始成绩：${studentInfo.selectRaw1}\n`;
    scoreDetails += `- 得分：${contrib1}/${selectMax}分（${selectLevel}）\n`;
    if (selectWeakTip) scoreDetails += `- ${selectWeakTip}\n`;
    scoreDetails += `\n`;
  }

  // 选考2
  if (studentInfo.selectProject2 && studentInfo.selectRaw2) {
    const selectMax = 8;
    const contrib2 = typeof studentInfo.selectContrib2 === "string" ? parseFloat(studentInfo.selectContrib2) : studentInfo.selectContrib2 || 0;
    const selectLevel = getScoreLevel(contrib2, selectMax);
    const selectWeakTip = getWeakTips(contrib2, selectMax, studentInfo.selectProject2);
    scoreDetails += `【选考项目二】\n`;
    scoreDetails += `- 项目：${studentInfo.selectProject2}\n`;
    scoreDetails += `- 原始成绩：${studentInfo.selectRaw2}\n`;
    scoreDetails += `- 得分：${contrib2}/${selectMax}分（${selectLevel}）\n`;
    if (selectWeakTip) scoreDetails += `- ${selectWeakTip}\n`;
    scoreDetails += `\n`;
  }

  // 构建系统提示词
  const systemPrompt = `你是一位专业的体育教练，擅长根据学生的具体体育成绩，提供针对每一项运动的个性化训练建议。

你的建议要求：
1. 针对学生参加的每一个体育项目，分别给出具体的训练建议
2. 训练建议要包含：训练内容、训练方法、训练频次、注意事项
3. 结合学生性别和年龄段（如果有），给出科学的训练强度建议
4. 突出重点薄弱项目的训练方案
5. 建议要具体、可执行，适合在学校或家庭环境中开展
6. 控制在500字以内，语言简洁专业`;

  // 构建用户提示词
  let userPrompt = `请为以下学生分析各项成绩并给出针对性训练建议：

【基本信息】
姓名：${studentInfo.name}
性别：${studentInfo.gender}`;

  if (studentInfo.grade) {
    userPrompt += `\n年段：${studentInfo.grade}`;
  }

  if (studentInfo.class) {
    userPrompt += `\n班级：${studentInfo.class}`;
  }

  userPrompt += `\n总分：${studentInfo.total40}/40分

【各项成绩详情】\n`;
  userPrompt += scoreDetails;

  userPrompt += `\n请按以下格式输出训练建议：

## 一、成绩综合分析
简要分析该生的整体体育水平，指出优势和薄弱项目。

## 二、分项目训练建议
针对每一项成绩，给出具体的训练方案：

### 1. 【项目名称】
- **当前水平**：xxx
- **训练目标**：xxx
- **推荐训练内容**：
  - 训练动作1：动作要领 + 练习方法
  - 训练动作2：动作要领 + 练习方法
- **训练频次**：每周x次
- **每次时长**：x分钟
- **注意事项**：xxx

（其他项目类似格式）

## 三、训练重点提醒
指出最需要加强的项目，给出短期改进目标（1-2个月）。`;

  try {
    console.log("[AI 建议] 调用 LLM 服务生成详细建议...");
    console.log("[AI 建议] 学生信息:", JSON.stringify(studentInfo, null, 2));

    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: userPrompt
        }
      ]
    });

    console.log("[AI 建议] LLM 响应成功");

    // 提取响应内容
    if (response.choices && response.choices.length > 0) {
      const content = response.choices[0].message.content;
      return typeof content === "string" ? content : JSON.stringify(content);
    }

    throw new Error("LLM 返回空响应");
  } catch (error) {
    console.error("[AI 建议生成失败]", error);
    throw error;
  }
}

/**
 * 测试 LLM 连接
 */
export async function testDoubaoConnection(): Promise<boolean> {
  try {
    const result = await generateTrainingAdvice({
      name: "测试学生",
      gender: "男",
      total40: 30,
      longProject: "1000米跑",
      longRaw: 4.5,
      longContrib: 12,
      ballProject: "篮球运球",
      ballRaw: 15.2,
      ballContrib: 7,
      selectProject1: "立定跳远",
      selectRaw1: 220,
      selectContrib1: "6.4",
      selectProject2: "一分钟仰卧起坐",
      selectRaw2: 38,
      selectContrib2: "5.6",
    });
    return !!result;
  } catch (error) {
    console.error("[LLM 连接测试失败]", error);
    return false;
  }
}
