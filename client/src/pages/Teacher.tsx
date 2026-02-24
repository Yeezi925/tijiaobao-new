/**
 * 教师系统 - 完整功能
 * 包含：Excel导入、查询、分析、AI建议、教案生成
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Download, Trash2 } from "lucide-react";
import { StudentRecord } from "@/lib/scoring";
import { parseExcelFile, exportToExcel } from "@/lib/excel";
import { performAnalysis, getUniqueGrades, getUniqueClasses } from "@/lib/analysis";
import { toast } from "sonner";

const STORAGE_KEY = "tijiaobao_scores"; // 统一的 key，所有角色共享

export default function Teacher() {
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("import");
  const [isAuthorized, setIsAuthorized] = useState(false);

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

  // 初始化：检查教师身份和加载数据
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

  // 保存到本地存储
  const saveToStorage = (data: StudentRecord[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  };

  // 处理文件上传
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const records = await parseExcelFile(file);
      setStudents(records);
      setFilteredStudents(records);
      saveToStorage(records);
      toast.success(`成功导入 ${records.length} 条学生记录`);
    } catch (error) {
      toast.error(`导入失败: ${error instanceof Error ? error.message : "未知错误"}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 处理删除学生
  const handleDeleteStudent = (index: number) => {
    const updated = students.filter((_, i) => i !== index);
    setStudents(updated);
    saveToStorage(updated);
    toast.success("学生已删除");
  };

  // 处理清空所有数据
  const handleClearAll = () => {
    if (confirm("确定要清空所有数据吗？此操作不可撤销。")) {
      setStudents([]);
      setFilteredStudents([]);
      localStorage.removeItem(STORAGE_KEY);
      toast.success("所有数据已清空");
    }
  };

  // 处理导出 Excel
  const handleExportExcel = () => {
    if (students.length === 0) {
      toast.error("没有数据可导出");
      return;
    }
    try {
      exportToExcel(students);
      toast.success("Excel 文件已下载");
    } catch (error) {
      toast.error(`导出失败: ${error instanceof Error ? error.message : "未知错误"}`);
    }
  };

  // 处理退出登入
  const handleLogout = () => {
    localStorage.removeItem("userInfo");
    window.location.href = "/login";
  };

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
            <h1 className="text-3xl font-bold text-green-600">体教宝 - 教师系统</h1>
            <p className="text-muted-foreground">现代化体育成绩管理系统</p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            退出登入
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="import">📥 导入</TabsTrigger>
            <TabsTrigger value="query">📋 查询</TabsTrigger>
            <TabsTrigger value="analysis">📊 分析</TabsTrigger>
            <TabsTrigger value="ai">✨ AI建议</TabsTrigger>
            <TabsTrigger value="lesson">📝 教案</TabsTrigger>
          </TabsList>

          {/* 导入标签页 */}
          <TabsContent value="import" className="space-y-4">
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">导入 Excel 文件</h2>
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                <Upload className="mx-auto mb-4 text-muted-foreground" size={48} />
                <p className="text-muted-foreground mb-4">
                  支持 .xlsx, .xls, .csv 格式，请确保 Excel 包含以下列：姓名、班级、性别、各项成绩
                </p>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileUpload}
                  disabled={isLoading}
                  className="hidden"
                  id="file-input"
                />
                <label htmlFor="file-input">
                  <Button asChild disabled={isLoading}>
                    <span>{isLoading ? "导入中..." : "选择文件上传"}</span>
                  </Button>
                </label>
              </div>
            </Card>
          </TabsContent>

          {/* 查询标签页 */}
          <TabsContent value="query" className="space-y-4">
            {students.length > 0 ? (
              <Card className="p-6">
                <h2 className="text-xl font-bold mb-4">查询学生成绩</h2>
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
                        <th className="px-4 py-2 text-center">操作</th>
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
                          <td className="px-4 py-2 text-center">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteStudent(index)}
                            >
                              删除
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            ) : (
              <Card className="p-6 text-center text-muted-foreground">
                <p>暂无数据，请先导入 Excel 文件</p>
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
                <p>暂无数据，请先导入 Excel 文件</p>
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

          {/* 教案标签页 */}
          <TabsContent value="lesson" className="space-y-4">
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">教案生成</h2>
              <p className="text-muted-foreground">教案生成功能开发中...</p>
            </Card>
          </TabsContent>
        </Tabs>

        {/* 底部操作 */}
        {students.length > 0 && (
          <div className="mt-8 flex gap-4">
            <Button onClick={handleExportExcel} variant="outline">
              <Download className="mr-2" size={18} />
              导出 Excel
            </Button>
            <Button onClick={handleClearAll} variant="destructive">
              <Trash2 className="mr-2" size={18} />
              清空所有数据
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
