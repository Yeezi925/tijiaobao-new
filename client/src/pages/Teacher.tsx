import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

export default function Teacher() {
  const [userInfo, setUserInfo] = useState<any>(null);

  useEffect(() => {
    const info = localStorage.getItem("userInfo");
    if (info) {
      setUserInfo(JSON.parse(info));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("userInfo");
    localStorage.removeItem("tijiaobao_scores");
    window.location.href = "/login";
  };

  if (!userInfo) {
    return <div className="text-center p-8">加载中...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* 顶部导航 */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-blue-600">体教宝 - 教师系统</h1>
            <p className="text-muted-foreground">欢迎, {userInfo.name}</p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            退出登入
          </Button>
        </div>

        {/* 用户信息卡片 */}
        <Card className="p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">您的信息</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">姓名</p>
              <p className="font-semibold">{userInfo.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">身份</p>
              <p className="font-semibold">教师</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">学校</p>
              <p className="font-semibold">{userInfo.school || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">登入时间</p>
              <p className="font-semibold text-sm">
                {new Date(userInfo.loginTime).toLocaleString("zh-CN")}
              </p>
            </div>
          </div>
        </Card>

        {/* 功能区域 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 学生成绩管理 */}
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-bold mb-2">学生成绩管理</h3>
            <p className="text-muted-foreground mb-4">
              导入学生成绩、查看分析、生成报告
            </p>
            <Button className="w-full">进入成绩管理</Button>
          </Card>

          {/* AI 建议生成 */}
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="text-4xl mb-4">✨</div>
            <h3 className="text-xl font-bold mb-2">AI 训练建议</h3>
            <p className="text-muted-foreground mb-4">
              为学生生成个性化的训练建议
            </p>
            <Button className="w-full">生成建议</Button>
          </Card>

          {/* 教案生成 */}
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="text-4xl mb-4">📝</div>
            <h3 className="text-xl font-bold mb-2">教案生成</h3>
            <p className="text-muted-foreground mb-4">
              基于课程标准生成体育教案
            </p>
            <Button className="w-full">生成教案</Button>
          </Card>

          {/* 数据分享 */}
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="text-4xl mb-4">🔗</div>
            <h3 className="text-xl font-bold mb-2">数据分享</h3>
            <p className="text-muted-foreground mb-4">
              生成分享链接，让学生和家长查看成绩
            </p>
            <Button className="w-full">管理分享</Button>
          </Card>
        </div>

        {/* 提示信息 */}
        <Card className="p-6 mt-8 bg-blue-50 border-blue-200">
          <p className="text-sm text-muted-foreground">
            💡 提示：所有功能正在开发中，敬请期待！
          </p>
        </Card>
      </div>
    </div>
  );
}
