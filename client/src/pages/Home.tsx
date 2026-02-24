/**
 * 体教宝 - 学生/家长首页
 * 重定向到对应的系统
 */

import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    const userInfo = localStorage.getItem("userInfo");
    if (!userInfo) {
      window.location.href = "/login";
      return;
    }

    try {
      const user = JSON.parse(userInfo);
      if (user.userType === "teacher") {
        window.location.href = "/teacher";
      } else {
        window.location.href = "/student";
      }
    } catch (error) {
      console.error("解析用户信息失败:", error);
      window.location.href = "/login";
    }
  }, []);

  return null;
}
