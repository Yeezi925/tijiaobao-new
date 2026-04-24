/**
 * 体教宝 - 数据统计页面
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StudentRecord } from "@/lib/scoring";
import { performAnalysis, getUniqueGrades, getUniqueClasses } from "@/lib/analysis";
import { BarChart3 } from "lucide-react";

const STORAGE_KEY = "tijiaobao_scores";

export default function Stats() {
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [analysisGrade, setAnalysisGrade] = useState("");
  const [analysisClass, setAnalysisClass] = useState("");
  const [showGenderCompare, setShowGenderCompare] = useState(false);
  const [analysisLevel, setAnalysisLevel] = useState<"school" | "year" | "class">("school");

  const grades = getUniqueGrades(students);
  const classes = getUniqueClasses(students);

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
  }, []);

  const analysis = students.length > 0
    ? performAnalysis(
        students,
        analysisLevel,
        analysisLevel === "year" ? analysisGrade : analysisLevel === "class" ? analysisClass : undefined,
        showGenderCompare
      )
    : null;

  const stats = analysis?.stats;

  if (students.length === 0) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold tracking-tight">数据统计</h1>
        <p className="text-muted-foreground mt-1">暂无数据，请先导入学生成绩</p>
        <Card className="mt-6">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">请先在「导入/查询」页面导入学生成绩数据</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">数据统计</h1>
        <p className="text-muted-foreground mt-1">
          查看学生成绩的详细统计分析
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>统计设置</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">分析级别</label>
              <select
                value={analysisLevel}
                onChange={(e) => {
                  setAnalysisLevel(e.target.value as any);
                  setAnalysisGrade("");
                  setAnalysisClass("");
                }}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background"
              >
                <option value="school">学校整体</option>
                <option value="year">按年段</option>
                <option value="class">按班级</option>
              </select>
            </div>

            {analysisLevel === "year" && (
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1 block">选择年段</label>
                <select
                  value={analysisGrade}
                  onChange={(e) => setAnalysisGrade(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                >
                  <option value="">-- 选择年段 --</option>
                  {grades.map((grade) => (
                    <option key={grade} value={grade}>{grade}</option>
                  ))}
                </select>
              </div>
            )}

            {analysisLevel === "class" && (
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1 block">选择班级</label>
                <select
                  value={analysisClass}
                  onChange={(e) => setAnalysisClass(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                >
                  <option value="">-- 选择班级 --</option>
                  {classes.map((cls) => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showGenderCompare}
                  onChange={(e) => setShowGenderCompare(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium">显示性别对比</span>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 关键指标 */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-4">
            <p className="text-xs opacity-90">总人数</p>
            <p className="text-2xl font-bold">{stats?.count || 0}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardContent className="p-4">
            <p className="text-xs opacity-90">平均分(40分)</p>
            <p className="text-2xl font-bold">{stats?.avgTotal || "—"}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardContent className="p-4">
            <p className="text-xs opacity-90">优秀率(≥36)</p>
            <p className="text-2xl font-bold">{stats?.excellentRate || "—"}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <CardContent className="p-4">
            <p className="text-xs opacity-90">及格率(≥30)</p>
            <p className="text-2xl font-bold">{stats?.passRate || "—"}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
          <CardContent className="p-4">
            <p className="text-xs opacity-90">低分率(&lt;20)</p>
            <p className="text-2xl font-bold">{stats?.lowRate || "—"}</p>
          </CardContent>
        </Card>
      </div>

      {/* 满分人数 */}
      <Card className="bg-yellow-50 border-yellow-200">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">满分(40分)人数</p>
          <p className="text-3xl font-bold text-yellow-600">{stats?.fullScoreCount || 0}</p>
        </CardContent>
      </Card>

      {/* 性别对比 */}
      {showGenderCompare && analysis.maleStats && analysis.femaleStats && (
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-blue-600 text-base">男生统计</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>人数</span>
                <span className="font-semibold">{analysis.maleStats.count}</span>
              </div>
              <div className="flex justify-between">
                <span>平均分</span>
                <span className="font-semibold">{analysis.maleStats.avgTotal}</span>
              </div>
              <div className="flex justify-between">
                <span>优秀率</span>
                <span className="font-semibold">{analysis.maleStats.excellentRate}</span>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-pink-50 border-pink-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-pink-600 text-base">女生统计</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>人数</span>
                <span className="font-semibold">{analysis.femaleStats.count}</span>
              </div>
              <div className="flex justify-between">
                <span>平均分</span>
                <span className="font-semibold">{analysis.femaleStats.avgTotal}</span>
              </div>
              <div className="flex justify-between">
                <span>优秀率</span>
                <span className="font-semibold">{analysis.femaleStats.excellentRate}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 三大项平均成绩 */}
      {analysis.projectStats && (
        <Card>
          <CardHeader>
            <CardTitle>三大项平均成绩 (40分制)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-muted/30 rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground mb-1">长跑/游泳</p>
                <p className="text-2xl font-bold text-primary">{analysis.projectStats.longrun.avg}</p>
                <p className="text-xs text-muted-foreground">满分 15 分 ({analysis.projectStats.longrun.count}人)</p>
              </div>
              <div className="bg-muted/30 rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground mb-1">球类</p>
                <p className="text-2xl font-bold text-green-600">{analysis.projectStats.ball.avg}</p>
                <p className="text-xs text-muted-foreground">满分 9 分 ({analysis.projectStats.ball.count}人)</p>
              </div>
              <div className="bg-muted/30 rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground mb-1">选考</p>
                <p className="text-2xl font-bold text-orange-600">{analysis.projectStats.select.avg}</p>
                <p className="text-xs text-muted-foreground">满分 16 分 ({analysis.projectStats.select.count}人)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 单项平均成绩 */}
      {analysis.singleItemStats && (
        <Card>
          <CardHeader>
            <CardTitle>单项平均成绩</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {Object.entries(analysis.singleItemStats).map(([name, data]) => (
                data.count > 0 && (
                  <div key={name} className="bg-muted/30 rounded-lg p-3">
                    <p className="text-sm text-muted-foreground">{name}</p>
                    <p className="text-lg font-bold">{data.avg}</p>
                    <p className="text-xs text-muted-foreground">({data.count}人)</p>
                  </div>
                )
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
