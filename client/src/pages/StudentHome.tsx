/**
 * 学生/家长系统 - 简化功能
 * 包含：查询、分析、AI建议（无教案）
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StudentRecord } from "@/lib/scoring";
import { performAnalysis, getUniqueGrades, getUniqueClasses } from "@/lib/analysis";

const STORAGE_KEY = "tijiaobao_scores"; // 统一的 key，教师上传的数据

export default function StudentHome() {
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentRecord[]>([]);
  const [activeTab, setActiveTab] = useState("query");
  const [isReady, setIsReady] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);

  // 查询过滤器
  const [queryType, setQueryType] = useState<"all" | "grade" | "class" | "name">("all");
  const [selectedGrade, setSelectedGrade] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [searchName, setSearchName] = useState("");

  // 分析过滤器
  const [analysisLevel, setAnalysisLevel] = useState<"school" | "year" | "class">("school");
  const [analysisGrade, setAnalysisGrade] = useState("");
  const [analysisClass, setAnalysisClass] = useState("");
  const [showGenderCompare, setShowGenderCompare] = useState(false);

  // 初始化：检查身份和加载数据
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
    } catch (error) {
      console.error("解析用户信息失败:", error);
    }

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setStudents(data);
        setFilteredStudents(data);
      } catch (error) {
        console.error("加载数据失败:", error);
      }
    }
    
    setIsReady(true);
  }, []);

  if (!isReady) {
    return null;
  }

  // 处理查询过滤
  useEffect(() => {
    let filtered = students;

    if (queryType === "grade" && selectedGrade) {
      filtered = filtered.filter((s) => s.grade === selectedGrade);
    } else if (queryType === "class" && selectedClass) {
      filtered = filtered.filter((s) => s.class === selectedClass);
    } else if (queryType === "name" && searchName) {
      filtered = filtered.filter((s) =>
        s.name.toLowerCase().includes(searchName.toLowerCase())
      );
    }

    setFilteredStudents(filtered);
  }, [queryType, selectedGrade, selectedClass, searchName, students]);

  // 获取唯一的年段和班级
  const grades = getUniqueGrades(students);
  const classes = getUniqueClasses(students);

  // 处理退出登入
  const handleLogout = () => {
    localStorage.removeItem("userInfo");
    window.location.href = "/login";
  };

  const userTypeText = userInfo?.userType === "student" ? "学生" : "家长";

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* 顶部导航 */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-green-600">体教宝 - {userTypeText}系统</h1>
            <p className="text-muted-foreground">欢迎, {userInfo?.name}</p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            退出登入
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="query">📋 查询</TabsTrigger>
            <TabsTrigger value="analysis">📊 分析</TabsTrigger>
            <TabsTrigger value="ai">✨ AI建议</TabsTrigger>
          </TabsList>

          {/* 查询标签页 */}
          <TabsContent value="query" className="space-y-4">
            {students.length > 0 ? (
              <Card className="p-6">
                <h2 className="text-xl font-bold mb-4">查询成绩</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">查询类型</label>
                    <select
                      value={queryType}
                      onChange={(e) => setQueryType(e.target.value as any)}
                      className="w-full mt-2 px-3 py-2 border border-border rounded-lg bg-white"
                    >
                      <option value="all">全部学生</option>
                      <option value="grade">按年段</option>
                      <option value="class">按班级</option>
                      <option value="name">按姓名</option>
                    </select>
                  </div>

                  {queryType === "grade" && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">选择年段</label>
                      <select
                        value={selectedGrade}
                        onChange={(e) => setSelectedGrade(e.target.value)}
                        className="w-full mt-2 px-3 py-2 border border-border rounded-lg bg-white"
                      >
                        <option value="">-- 选择年段 --</option>
                        {grades.map((g) => (
                          <option key={g} value={g}>
                            {g}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {queryType === "class" && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">选择班级</label>
                      <select
                        value={selectedClass}
                        onChange={(e) => setSelectedClass(e.target.value)}
                        className="w-full mt-2 px-3 py-2 border border-border rounded-lg bg-white"
                      >
                        <option value="">-- 选择班级 --</option>
                        {classes.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {queryType === "name" && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">输入姓名</label>
                      <Input
                        type="text"
                        placeholder="请输入学生姓名"
                        value={searchName}
                        onChange={(e) => setSearchName(e.target.value)}
                        className="mt-2"
                      />
                    </div>
                  )}
                </div>

                {/* 学生列表 */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-secondary">
                      <tr>
                        <th className="px-4 py-2 text-left">姓名</th>
                        <th className="px-4 py-2 text-left">班级</th>
                        <th className="px-4 py-2 text-left">性别</th>
                        <th className="px-4 py-2 text-center">成绩</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.map((student, index) => (
                        <tr key={index} className="border-b hover:bg-secondary/50">
                          <td className="px-4 py-2">{student.name}</td>
                          <td className="px-4 py-2">{student.class}</td>
                          <td className="px-4 py-2">{student.gender}</td>
                          <td className="px-4 py-2 text-center text-xs">-</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            ) : (
              <Card className="p-8 text-center text-muted-foreground">
                暂无成绩数据
              </Card>
            )}
          </TabsContent>

          {/* 分析标签页 */}
          <TabsContent value="analysis">
            {students.length > 0 ? (
              <AnalysisPanel
                students={students}
                analysisLevel={analysisLevel}
                setAnalysisLevel={setAnalysisLevel}
                analysisGrade={analysisGrade}
                setAnalysisGrade={setAnalysisGrade}
                analysisClass={analysisClass}
                setAnalysisClass={setAnalysisClass}
                showGenderCompare={showGenderCompare}
                setShowGenderCompare={setShowGenderCompare}
                grades={grades}
                classes={classes}
              />
            ) : (
              <Card className="p-8 text-center text-muted-foreground">
                暂无成绩数据
              </Card>
            )}
          </TabsContent>

          {/* AI 建议标签页 */}
          <TabsContent value="ai">
            <Card className="p-8 text-center text-muted-foreground">
              AI 建议功能开发中...
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

/**
 * 分析面板组件
 */
function AnalysisPanel({
  students,
  analysisLevel,
  setAnalysisLevel,
  analysisGrade,
  setAnalysisGrade,
  analysisClass,
  setAnalysisClass,
  showGenderCompare,
  setShowGenderCompare,
  grades,
  classes
}: {
  students: any[];
  analysisLevel: "school" | "year" | "class";
  setAnalysisLevel: (level: "school" | "year" | "class") => void;
  analysisGrade: string;
  setAnalysisGrade: (grade: string) => void;
  analysisClass: string;
  setAnalysisClass: (cls: string) => void;
  showGenderCompare: boolean;
  setShowGenderCompare: (show: boolean) => void;
  grades: string[];
  classes: string[];
}) {
  const analysis = performAnalysis(
    students,
    analysisLevel,
    analysisLevel === "year" ? analysisGrade : analysisLevel === "class" ? analysisClass : undefined,
    showGenderCompare
  );

  const stats = analysis.stats;
  if (!stats) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* 分析级别选择 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-secondary/30 rounded-lg">
        <div>
          <label className="text-sm font-medium text-muted-foreground">分析级别</label>
          <select
            value={analysisLevel}
            onChange={(e) => setAnalysisLevel(e.target.value as any)}
            className="w-full mt-2 px-3 py-2 border border-border rounded-lg bg-white"
          >
            <option value="school">全校</option>
            <option value="year">按年段</option>
            <option value="class">按班级</option>
          </select>
        </div>

        {analysisLevel === "year" && (
          <div>
            <label className="text-sm font-medium text-muted-foreground">选择年段</label>
            <select
              value={analysisGrade}
              onChange={(e) => setAnalysisGrade(e.target.value)}
              className="w-full mt-2 px-3 py-2 border border-border rounded-lg bg-white"
            >
              <option value="">-- 选择年段 --</option>
              {grades.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
        )}

        {analysisLevel === "class" && (
          <div>
            <label className="text-sm font-medium text-muted-foreground">选择班级</label>
            <select
              value={analysisClass}
              onChange={(e) => setAnalysisClass(e.target.value)}
              className="w-full mt-2 px-3 py-2 border border-border rounded-lg bg-white"
            >
              <option value="">-- 选择班级 --</option>
              {classes.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
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
            <span className="text-sm font-medium text-muted-foreground">性别对比</span>
          </label>
        </div>
      </div>

      {/* 统计数据 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">总人数</p>
          <p className="text-2xl font-bold">{stats.count}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">平均分</p>
          <p className="text-2xl font-bold">{stats.avgTotal}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">优秀率</p>
          <p className="text-2xl font-bold">{stats.excellentRate}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">及格率</p>
          <p className="text-2xl font-bold">{stats.passRate}</p>
        </Card>
      </div>
    </div>
  );
}
