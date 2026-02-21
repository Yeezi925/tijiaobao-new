/**
 * 豆包 API 集成模块
 * 用于生成 AI 训练建议
 */

import crypto from "crypto";
import { ENV } from "./_core/env";

interface DoubaoMessage {
  role: "user" | "assistant";
  content: string;
}

interface DoubaoRequest {
  model: string;
  messages: DoubaoMessage[];
  temperature?: number;
  max_tokens?: number;
}

interface DoubaoResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * 豆包 API 认证签名
 */
function generateAuthHeader(
  accessKeyId: string,
  secretAccessKey: string,
  timestamp: string
): { Authorization: string; "X-BC-Timestamp": string } {
  // 构建签名字符串
  const signatureContent = `Timestamp=${timestamp}\nAuthorization=Bearer ${accessKeyId}`;

  // 使用 HMAC-SHA256 生成签名
  const signature = crypto
    .createHmac("sha256", secretAccessKey)
    .update(signatureContent)
    .digest("base64");

  // 构建 Authorization 头
  const authHeader = `Bearer ${accessKeyId}:${signature}`;

  return {
    Authorization: authHeader,
    "X-BC-Timestamp": timestamp
  };
}

/**
 * 调用豆包 API 生成 AI 建议
 */
export async function generateTrainingAdvice(studentInfo: {
  name: string;
  gender: string;
  total40: number;
  longContrib?: number;
  ballContrib?: number;
  selectContrib?: number;
}): Promise<string> {
  if (!ENV.doubanAccessKeyId || !ENV.doubanSecretAccessKey) {
    throw new Error("豆包 API 密钥未配置");
  }

  // 构建提示词
  const systemPrompt = `你是一位专业的体育教练和训练顾问。根据学生的体育成绩，为其提供个性化的训练建议。
  
评分标准：
- 总分：40分制
- 长跑/游泳：15分
- 球类项目：9分
- 选考项目（两项）：各8分

请根据学生的成绩分析其优势和不足，提供具体的训练建议。`;

  const userPrompt = `请为以下学生提供训练建议：

姓名：${studentInfo.name}
性别：${studentInfo.gender}
总分：${studentInfo.total40}/40分
长跑/游泳得分：${studentInfo.longContrib || 0}/15分
球类项目得分：${studentInfo.ballContrib || 0}/9分
选考项目得分：${studentInfo.selectContrib || 0}/16分

请提供：
1. 成绩分析（优势和不足）
2. 具体的训练建议（3-5条）
3. 预期改进目标`;

  const messages: DoubaoMessage[] = [
    {
      role: "user",
      content: userPrompt
    }
  ];

  const request: DoubaoRequest = {
    model: "doubao-pro-32k",
    messages,
    temperature: 0.7,
    max_tokens: 1000
  };

  // 生成时间戳
  const timestamp = Math.floor(Date.now() / 1000).toString();

  // 生成认证头
  const authHeaders = generateAuthHeader(
    ENV.doubanAccessKeyId,
    ENV.doubanSecretAccessKey,
    timestamp
  );

  try {
    const response = await fetch("https://ark.cn-beijing.volces.com/api/v3/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("[豆包 API 错误]", response.status, error);
      throw new Error(`豆包 API 请求失败: ${response.status}`);
    }

    const data: DoubaoResponse = await response.json();

    if (data.choices && data.choices.length > 0) {
      return data.choices[0].message.content;
    }

    throw new Error("豆包 API 返回空响应");
  } catch (error) {
    console.error("[豆包 API 调用失败]", error);
    throw error;
  }
}

/**
 * 测试豆包 API 连接
 */
export async function testDoubaoConnection(): Promise<boolean> {
  if (!ENV.doubanAccessKeyId || !ENV.doubanSecretAccessKey) {
    console.warn("[豆包 API] 密钥未配置");
    return false;
  }

  try {
    const advice = await generateTrainingAdvice({
      name: "测试学生",
      gender: "男",
      total40: 32,
      longContrib: 12,
      ballContrib: 7,
      selectContrib: 13
    });

    console.log("[豆包 API] 连接成功");
    return !!advice;
  } catch (error) {
    console.error("[豆包 API] 连接失败:", error);
    return false;
  }
}
