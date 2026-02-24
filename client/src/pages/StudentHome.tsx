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
  const [isAuthorized, setIsAuthorized] = useState(false);
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
      setIsAuthorized(true);
    } catch (error) {
      console.error("解析用户信息失败:", error);
      window.location.href = "/login";
      return;
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
  }, []);

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

  // 如果未授权，返回空
  if (!isAuthorized) {
    return null;
  }

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
                          <td className="px-4 py-2 text-center font-bold text-green-600">
                            {student.total40 || "--"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            ) : (
              <Card className="p-6 text-center text-muted-foreground">
                <p>暂无数据，请等待教师上传</p>
              </Card>
            )}
          </TabsContent>

          {/* 分析标签页 */}
          <TabsContent value="analysis" className="space-y-4">
            {students.length > 0 ? (
              <Card className="p-6">
                <h2 className="text-xl font-bold mb-4">数据分析</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">分析级别</label>
                    <select
                      value={analysisLevel}
                      onChange={(e) => setAnalysisLevel(e.target.value as any)}
                      className="w-full mt-2 px-3 py-2 border border-border rounded-lg bg-white"
                    >
                      <option value="school">学校整体</option>
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
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card className="p-4 bg-blue-50">
                    <p className="text-sm text-muted-foreground">学生总数</p>
                    <p className="text-2xl font-bold text-blue-600">{students.length}</p>
                  </Card>
                  <Card className="p-4 bg-green-50">
                    <p className="text-sm text-muted-foreground">平均成绩</p>
                    <p className="text-2xl font-bold text-green-600">
                      {students.length > 0 ? (students.reduce((sum, s) => sum + (parseFloat(s.total40 || "0") || 0), 0) / students.length).toFixed(1) : "0"}
                    </p>
                  </Card>
                  <Card className="p-4 bg-purple-50">
                    <p className="text-sm text-muted-foreground">最高成绩</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {students.length > 0 ? Math.max(...students.map(s => parseFloat(s.total40 || "0") || 0)).toFixed(1) : "0"}
                    </p>
                  </Card>
                  <Card className="p-4 bg-orange-50">
                    <p className="text-sm text-muted-foreground">最低成绩</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {students.length > 0 ? Math.min(...students.map(s => parseFloat(s.total40 || "0") || 0)).toFixed(1) : "0"}
                    </p>
                  </Card>
                </div>
              </Card>
            ) : (
              <Card className="p-6 text-center text-muted-foreground">
                <p>暂无数据，请等待教师上传</p>
              </Card>
            )}
          </TabsContent>

          {/* AI建议标签页 */}
          <TabsContent value="ai" className="space-y-4">
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">AI 训练建议</h2>
              <p className="text-muted-foreground">AI 建议功能开发中...</p>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
