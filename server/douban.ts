/**
 * AI 训练建议生成模块
 * 使用 Manus 内置 LLM 服务
 */

import { invokeLLM } from "./_core/llm";

/**
 * 调用 LLM 生成 AI 训练建议
 */
export async function generateTrainingAdvice(studentInfo: {
  name: string;
  gender: string;
  grade?: string;
  class?: string;
  total40: number;
  longContrib?: number;
  ballContrib?: number;
  selectContrib?: number;
}): Promise<string> {
  // 构建提示词
  const systemPrompt = `你是一位专业的体育教练和训练顾问。根据学生的体育成绩，为其提供个性化的训练建议。
  
评分标准：
- 总分：40分制
- 长跑/游泳：15分
- 球类项目：9分
- 选考项目（两项）：各8分

请根据学生的成绩分析其优势和不足，提供具体的训练建议。`;

  let userPrompt = `请为以下学生提供训练建议：

姓名：${studentInfo.name}
性别：${studentInfo.gender}`;

  if (studentInfo.grade) {
    userPrompt += `\n年段：${studentInfo.grade}`;
  }

  if (studentInfo.class) {
    userPrompt += `\n班级：${studentInfo.class}`;
  }

  userPrompt += `\n总分：${studentInfo.total40}/40分
长跑/游泳得分：${studentInfo.longContrib || 0}/15分
球类项目得分：${studentInfo.ballContrib || 0}/9分
选考项目得分：${studentInfo.selectContrib || 0}/16分

请提供：
1. 成绩分析（优势和不足）
2. 具体的训练建议（3-5条）
3. 预期改进目标`;

  try {
    console.log("[AI 建议] 调用 LLM 服务生成建议...");

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
      longContrib: 12,
      ballContrib: 7,
      selectContrib: 11
    });
    return !!result;
  } catch (error) {
    console.error("[LLM 连接测试失败]", error);
    return false;
  }
}
