import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function StudentHome() {
  const [userInfo, setUserInfo] = useState<any>(null);

  useEffect(() => {
    const info = localStorage.getItem("userInfo");
    if (!info) {
      window.location.href = "/login";
      return;
    }
    setUserInfo(JSON.parse(info));
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* 顶部导航 */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-green-600">体教宝 - 学生系统</h1>
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
              <p className="font-semibold">学生</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">年段</p>
              <p className="font-semibold">{userInfo.grade || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">班级</p>
              <p className="font-semibold">{userInfo.className || "-"}</p>
            </div>
          </div>
        </Card>

        {/* 功能区域 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 我的成绩 */}
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-bold mb-2">我的成绩</h3>
            <p className="text-muted-foreground mb-4">
              查看个人体育成绩和排名
            </p>
            <Button className="w-full">查看成绩</Button>
          </Card>

          {/* AI 建议 */}
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="text-4xl mb-4">✨</div>
            <h3 className="text-xl font-bold mb-2">AI 训练建议</h3>
            <p className="text-muted-foreground mb-4">
              获取个性化的训练建议
            </p>
            <Button className="w-full">查看建议</Button>
          </Card>

          {/* 成绩分析 */}
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="text-4xl mb-4">📈</div>
            <h3 className="text-xl font-bold mb-2">成绩分析</h3>
            <p className="text-muted-foreground mb-4">
              查看成绩趋势和分析
            </p>
            <Button className="w-full">查看分析</Button>
          </Card>

          {/* 教案资源 */}
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="text-4xl mb-4">📚</div>
            <h3 className="text-xl font-bold mb-2">教案资源</h3>
            <p className="text-muted-foreground mb-4">
              获取教师分享的教案资源
            </p>
            <Button className="w-full">查看资源</Button>
          </Card>
        </div>

        {/* 提示信息 */}
        <Card className="p-6 mt-8 bg-green-50 border-green-200">
          <p className="text-sm text-muted-foreground">
            💡 提示：所有功能正在开发中，敬请期待！
          </p>
        </Card>
      </div>
    </div>
  );
}
