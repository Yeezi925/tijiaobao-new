/**
 * 微信小程序登录与认证
 * - /api/wechat-login: 接收小程序 code，换 openId，签发 JWT
 * - authenticateMiniRequest: 从 Authorization header 读取 token 验证
 */

import axios from "axios";
import type { Express, Request } from "express";
import type { User } from "../../drizzle/schema";
import * as db from "../db";
import { ENV } from "./env";
import { sdk } from "./sdk";

const WX_APPID = process.env.WX_MINI_APPID || "wx04980fc05c469805";
const WX_SECRET = process.env.WX_MINI_APPSECRET || "";

/**
 * 用 code 换微信 openId
 */
async function code2Session(code: string): Promise<{ openid: string; session_key: string }> {
  const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${WX_APPID}&secret=${WX_SECRET}&js_code=${code}&grant_type=authorization_code`;
  const { data } = await axios.get(url);
  if (data.errcode) {
    throw new Error(`微信登录失败: ${data.errmsg} (code: ${data.errcode})`);
  }
  return {
    openid: data.openid,
    session_key: data.session_key,
  };
}

/**
 * 微信 openId 前缀，用于区分 Manus OAuth 用户和微信小程序用户
 */
const WX_OPENID_PREFIX = "wx_mini_";

/**
 * 注册微信小程序相关路由
 */
export function registerWechatMiniRoutes(app: Express) {
  // 微信小程序登录
  app.post("/api/wechat-login", async (req, res) => {
    const { code } = req.body;
    if (!code) {
      res.status(400).json({ error: "code is required" });
      return;
    }

    try {
      // 1. 用 code 换 openId
      const wxResult = await code2Session(code);
      const wxOpenId = wxResult.openid;

      // 2. 用带前缀的 openId 在数据库中查找或创建用户
      const prefixedOpenId = WX_OPENID_PREFIX + wxOpenId;
      let user = await db.getUserByOpenId(prefixedOpenId);

      if (!user) {
        // 自动创建用户（微信小程序注册不需要 Manus OAuth）
        await db.upsertUser({
          openId: prefixedOpenId,
          name: "微信用户",
          loginMethod: "wechat_mini",
          lastSignedIn: new Date(),
        });
        user = await db.getUserByOpenId(prefixedOpenId);
      }

      if (!user) {
        res.status(500).json({ error: "创建用户失败" });
        return;
      }

      // 3. 签发 JWT token（复用已有的 signSession）
      const token = await sdk.signSession(
        {
          openId: prefixedOpenId,
          appId: WX_APPID,
          name: user.name || "",
        },
        { expiresInMs: 1000 * 60 * 60 * 24 * 365 } // 1年有效
      );

      res.json({
        success: true,
        token,
        user: {
          id: user.id,
          name: user.name,
          openId: prefixedOpenId,
        },
      });
    } catch (error: any) {
      console.error("[WeChat Login] Failed:", error.message);
      res.status(500).json({ error: error.message || "微信登录失败" });
    }
  });
}

/**
 * 验证小程序请求：从 Authorization header 中提取并验证 token
 * 返回 User 对象或 null
 */
export async function authenticateMiniRequest(req: Request): Promise<User | null> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }

    const token = authHeader.slice(7); // 去掉 "Bearer " 前缀
    if (!token) {
      return null;
    }

    // 复用已有的 JWT 验证
    const session = await sdk.verifySession(token);
    if (!session) {
      return null;
    }

    // 从数据库查找用户
    const user = await db.getUserByOpenId(session.openId);
    if (!user) {
      return null;
    }

    return user;
  } catch (error) {
    console.warn("[Mini Auth] Authentication failed:", String(error));
    return null;
  }
}
