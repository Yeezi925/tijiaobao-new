import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function Teacher() {
  const [userInfo, setUserInfo] = useState<any>(null);

  useEffect(() => {
    const info = localStorage.getItem("userInfo");
    if (!info) {
      window.location.href = "/login";
      return;
    }
    try {
      const user = JSON.parse(info);
      if (user.userType !== "teacher") {
        window.location.href = "/";
        return;
      }
      setUserInfo(user);
    } catch (error) {
      window.location.href = "/login";
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("userInfo");
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-green-600">体教宝 - 教师系统</h1>
            <p className="text-muted-foreground">欢迎, {userInfo?.name}</p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            退出登入
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">📥 导入成绩</h2>
            <p className="text-muted-foreground">上传 Excel 文件导入学生成绩数据</p>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">📋 查询成绩</h2>
            <p className="text-muted-foreground">按年段、班级、姓名查询学生成绩</p>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">📊 数据分析</h2>
            <p className="text-muted-foreground">查看成绩统计、男女对比、项目分析</p>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">✨ AI建议</h2>
            <p className="text-muted-foreground">为学生生成个性化训练建议</p>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">📝 教案生成</h2>
            <p className="text-muted-foreground">基于学生成绩生成体育教案</p>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">📈 统计报表</h2>
            <p className="text-muted-foreground">导出成绩统计报表和分析结果</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
