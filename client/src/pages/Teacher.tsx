import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload } from "lucide-react";
import { toast } from "sonner";

export default function Teacher() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const userInfo = localStorage.getItem("userInfo");
    if (!userInfo) {
      window.location.href = "/login";
      return;
    }

    try {
      const user = JSON.parse(userInfo);
      if (user.userType !== "teacher") {
        window.location.href = "/";
        return;
      }
    } catch (error) {
      console.error("解析用户信息失败:", error);
      window.location.href = "/login";
      return;
    }

    setIsReady(true);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("userInfo");
    window.location.href = "/login";
  };

  if (!isReady) {
    return <div className="min-h-screen bg-gray-50"></div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-green-600">体教宝 - 教师系统</h1>
            <p className="text-muted-foreground">现代化体育成绩管理系统</p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            退出登入
          </Button>
        </div>

        <Tabs defaultValue="import" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="import">📥 导入</TabsTrigger>
            <TabsTrigger value="query">📋 查询</TabsTrigger>
            <TabsTrigger value="analysis">📊 分析</TabsTrigger>
            <TabsTrigger value="ai">✨ AI建议</TabsTrigger>
            <TabsTrigger value="lesson">📝 教案</TabsTrigger>
          </TabsList>

          <TabsContent value="import" className="space-y-4">
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">导入 Excel 文件</h2>
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                <Upload className="mx-auto mb-4 text-muted-foreground" size={48} />
                <p className="text-muted-foreground mb-4">
                  支持 .xlsx, .xls, .csv 格式，请确保 Excel 包含以下列：姓名、班级、性别、各项成绩
                </p>
                <Button onClick={() => toast.info("功能开发中...")}>选择文件上传</Button>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="query" className="space-y-4">
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">查询学生成绩</h2>
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

          <TabsContent value="lesson" className="space-y-4">
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">教案生成</h2>
              <p className="text-muted-foreground">功能开发中...</p>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
