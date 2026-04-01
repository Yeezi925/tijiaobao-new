/**
 * 阿里云百炼 DashScope LLM 集成
 * 用于支持中国用户的 AI 功能
 */

import { ENV } from "./env";

export type AliyunMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type AliyunInvokeParams = {
  messages: AliyunMessage[];
  maxTokens?: number;
};

export type AliyunInvokeResult = {
  output: {
    text: string;
  };
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
};

const API_ENDPOINT = "https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation";
const MODEL = "qwen-plus";

const assertApiKey = () => {
  if (!ENV.aliyunDashscopeApiKey) {
    throw new Error("ALIYUN_DASHSCOPE_API_KEY is not configured");
  }
};

export async function invokeAliyunLLM(
  params: AliyunInvokeParams
): Promise<AliyunInvokeResult> {
  assertApiKey();

  const payload = {
    model: MODEL,
    input: {
      messages: params.messages,
    },
    parameters: {
      max_tokens: params.maxTokens || 2048,
    },
  };

  const response = await fetch(API_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ENV.aliyunDashscopeApiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Aliyun LLM invoke failed: ${response.status} ${response.statusText} – ${errorText}`
    );
  }

  const result = (await response.json()) as AliyunInvokeResult;
  return result;
}
