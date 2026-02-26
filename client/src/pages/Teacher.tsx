import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Download, Trash2, BarChart3, Sparkles, FileText } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

interface StudentRecord {
  name: string;
  class: string;
  gender: string;
  total40: string;
  [key: string]: string;
}

const STORAGE_KEY = "tijiaobao_scores";

export default function Teacher() {
  const [isReady, setIsReady] = useState(false);
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentRecord[]>([]);
  const [queryType, setQueryType] = useState<"all" | "grade" | "class" | "name">("all");
  const [selectedGrade, setSelectedGrade] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [searchName, setSearchName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

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

    // 加载已保存的数据
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

  // 处理查询过滤
  useEffect(() => {
    let filtered = students;

    if (queryType === "grade" && selectedGrade) {
      filtered = filtered.filter((s) => s.class?.includes(selectedGrade));
    } else if (queryType === "class" && selectedClass) {
      filtered = filtered.filter((s) => s.class === selectedClass);
    } else if (queryType === "name" && searchName) {
      filtered = filtered.filter((s) =>
        s.name.toLowerCase().includes(searchName.toLowerCase())
      );
    }

    setFilteredStudents(filtered);
  }, [queryType, selectedGrade, selectedClass, searchName, students]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as StudentRecord[];

      if (jsonData.length === 0) {
        toast.error("Excel 文件为空");
        return;
      }

      setStudents(jsonData);
      setFilteredStudents(jsonData);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(jsonData));
      toast.success(`成功导入 ${jsonData.length} 条学生记录`);
    } catch (error) {
      toast.error(`导入失败: ${error instanceof Error ? error.message : "未知错误"}`);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleExportExcel = () => {
    if (students.length === 0) {
      toast.error("没有数据可导出");
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(students);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "学生成绩");
    XLSX.writeFile(workbook, "学生成绩.xlsx");
    toast.success("导出成功");
  };

  const handleClearData = () => {
    if (confirm("确定要清空所有数据吗？")) {
      setStudents([]);
      setFilteredStudents([]);
      localStorage.removeItem(STORAGE_KEY);
      toast.success("数据已清空");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("userInfo");
    window.location.href = "/login";
  };

  if (!isReady) {
    return <div className="min-h-screen bg-gray-50"></div>;
  }

  const uniqueGrades = Array.from(new Set(students.map((s) => s.class?.split(/[0-9]/)[0]).filter(Boolean)));
  const uniqueClasses = Array.from(new Set(students.map((s) => s.class).filter(Boolean)));

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
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button onClick={() => fileInputRef.current?.click()}>选择文件上传</Button>
              </div>

              {students.length > 0 && (
                <div className="mt-6 space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-600">已导入 {students.length} 条学生记录</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handleExportExcel} className="flex-1">
                      <Download className="mr-2" size={16} />
                      导出 Excel
                    </Button>
                    <Button variant="destructive" onClick={handleClearData} className="flex-1">
                      <Trash2 className="mr-2" size={16} />
                      清空数据
                    </Button>
                  </div>
                </div>
              )}
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
                        {uniqueGrades.map((g: any) => (
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
                        {uniqueClasses.map((c: any) => (
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
                <p>暂无数据，请先在导入页面上传 Excel 文件</p>
              </Card>
            )}
          </TabsContent>

          {/* 分析标签页 */}
          <TabsContent value="analysis" className="space-y-4">
            {students.length > 0 ? (
              <Card className="p-6">
                <h2 className="text-xl font-bold mb-4">数据分析</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card className="p-4 bg-blue-50">
                    <p className="text-sm text-muted-foreground">学生总数</p>
                    <p className="text-2xl font-bold text-blue-600">{students.length}</p>
                  </Card>
                  <Card className="p-4 bg-green-50">
                    <p className="text-sm text-muted-foreground">平均成绩</p>
                    <p className="text-2xl font-bold text-green-600">
                      {students.length > 0
                        ? (
                            students.reduce(
                              (sum, s) => sum + (parseFloat(s.total40 || "0") || 0),
                              0
                            ) / students.length
                          ).toFixed(1)
                        : "0"}
                    </p>
                  </Card>
                  <Card className="p-4 bg-purple-50">
                    <p className="text-sm text-muted-foreground">最高成绩</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {students.length > 0
                        ? Math.max(
                            ...students.map((s) => parseFloat(s.total40 || "0") || 0)
                          ).toFixed(1)
                        : "0"}
                    </p>
                  </Card>
                  <Card className="p-4 bg-orange-50">
                    <p className="text-sm text-muted-foreground">最低成绩</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {students.length > 0
                        ? Math.min(
                            ...students.map((s) => parseFloat(s.total40 || "0") || 0)
                          ).toFixed(1)
                        : "0"}
                    </p>
                  </Card>
                </div>
              </Card>
            ) : (
              <Card className="p-6 text-center text-muted-foreground">
                <p>暂无数据，请先在导入页面上传 Excel 文件</p>
              </Card>
            )}
          </TabsContent>

          {/* AI建议标签页 */}
          <TabsContent value="ai" className="space-y-4">
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">AI 训练建议</h2>
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Sparkles className="mx-auto mb-4 text-muted-foreground" size={48} />
                  <p className="text-muted-foreground">AI 建议功能开发中...</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    将为每个学生生成个性化的训练建议
                  </p>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* 教案标签页 */}
          <TabsContent value="lesson" className="space-y-4">
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">教案生成</h2>
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <FileText className="mx-auto mb-4 text-muted-foreground" size={48} />
                  <p className="text-muted-foreground">教案生成功能开发中...</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    将根据课程标准生成体育教案
                  </p>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
