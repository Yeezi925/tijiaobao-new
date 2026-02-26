import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function StudentHome() {
  const [userInfo, setUserInfo] = useState<any>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const info = localStorage.getItem("userInfo");
    if (!info) {
      window.location.href = "/login";
      return;
    }

    try {
      const user = JSON.parse(info);
      if (user.userType === "teacher") {
        window.location.href = "/teacher";
        return;
      }
      setUserInfo(user);
      setIsReady(true);
    } catch (error) {
      window.location.href = "/login";
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("userInfo");
    window.location.href = "/login";
  };

  if (!isReady || !userInfo) {
    return <div className="min-h-screen bg-gray-50"></div>;
  }

  const userTypeText = userInfo.userType === "student" ? "学生" : "家长";

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-green-600">体教宝 - {userTypeText}系统</h1>
            <p className="text-muted-foreground">欢迎, {userInfo.name}</p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            退出登入
          </Button>
        </div>

        <Tabs defaultValue="query" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="query">📋 查询</TabsTrigger>
            <TabsTrigger value="analysis">📊 分析</TabsTrigger>
            <TabsTrigger value="ai">✨ AI建议</TabsTrigger>
          </TabsList>

          <TabsContent value="query" className="space-y-4">
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">查询成绩</h2>
              <p className="text-muted-foreground">功能开发中...</p>
            </Card>
          </TabsContent>

          <TabsContent value="analysis" className="space-y-4">
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">数据分析</h2>
              <p className="text-muted-foreground">功能开发中...</p>
            </Card>
          </TabsContent>

          <TabsContent value="ai" className="space-y-4">
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">AI 训练建议</h2>
              <p className="text-muted-foreground">功能开发中...</p>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
