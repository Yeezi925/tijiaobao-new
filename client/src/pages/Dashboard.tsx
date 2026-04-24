/**
 * 体教宝 - 仪表盘页面
 */

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StudentRecord } from "@/lib/scoring";
import { performAnalysis } from "@/lib/analysis";
import { Upload, BarChart3, Users, TrendingUp, Award, AlertTriangle } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "tijiaobao_scores";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setStudents(data);
      } catch (error) {
        console.error("加载数据失败:", error);
      }
    }
    setLoading(false);
  }, []);

  const analysis = students.length > 0 ? performAnalysis(students, "school") : null;
  const stats = analysis?.stats;

  return (
    <div className="p-6 space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">仪表盘</h1>
        <p className="text-muted-foreground mt-1">
          欢迎使用体教宝体育成绩管理系统
        </p>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              已导入学生
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students.length}</div>
            <p className="text-xs text-muted-foreground">
              {students.length === 0 ? "请导入学生数据" : "名学生的成绩记录"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              平均成绩
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.avgTotal || "—"}
            </div>
            <p className="text-xs text-muted-foreground">
              {students.length > 0 ? "40分制平均分" : "暂无数据"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              优秀率
            </CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.excellentRate || "—"}
            </div>
            <p className="text-xs text-muted-foreground">
              {students.length > 0 ? "≥36分占比" : "暂无数据"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              及格率
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.passRate || "—"}
            </div>
            <p className="text-xs text-muted-foreground">
              {students.length > 0 ? "≥30分占比" : "暂无数据"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 快捷操作 */}
      <div>
        <h2 className="text-lg font-semibold mb-4">快捷操作</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setLocation("/import")}>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">导入数据</h3>
                <p className="text-sm text-muted-foreground">导入 Excel 成绩文件</p>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setLocation("/stats")}>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="p-3 bg-green-500/10 rounded-lg">
                <BarChart3 className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold">数据统计</h3>
                <p className="text-sm text-muted-foreground">查看成绩分析</p>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setLocation("/ai-advice")}>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="p-3 bg-purple-500/10 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold">AI 建议</h3>
                <p className="text-sm text-muted-foreground">生成训练建议</p>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setLocation("/share")}>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="p-3 bg-orange-500/10 rounded-lg">
                <Users className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold">分享成绩</h3>
                <p className="text-sm text-muted-foreground">生成分享链接</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 提示信息 */}
      {students.length === 0 && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="flex items-start gap-4 p-6">
            <div className="p-2 bg-primary/10 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">开始使用</h3>
              <p className="text-sm text-muted-foreground mt-1">
                点击「导入数据」上传学生的 Excel 成绩文件，开始使用体教宝管理系统。
              </p>
              <Button className="mt-4" onClick={() => setLocation("/import")}>
                <Upload className="w-4 h-4 mr-2" />
                立即导入
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 三大项分析 */}
      {stats && (
        <div>
          <h2 className="text-lg font-semibold mb-4">三大项平均成绩</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">长跑/游泳</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">
                  {analysis.projectStats?.longrun.avg || "—"}
                </div>
                <p className="text-xs text-muted-foreground">满分 15 分</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">球类项目</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {analysis.projectStats?.ball.avg || "—"}
                </div>
                <p className="text-xs text-muted-foreground">满分 9 分</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">选考项目</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600">
                  {analysis.projectStats?.select.avg || "—"}
                </div>
                <p className="text-xs text-muted-foreground">满分 16 分</p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
