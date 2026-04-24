/**
 * 体教宝 - 导入/查询页面
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { StudentRecord } from "@/lib/scoring";
import { parseExcelFile, exportToExcel } from "@/lib/excel";
import { getUniqueGrades, getUniqueClasses } from "@/lib/analysis";
import { toast } from "sonner";
import { Upload, Download, Trash2, Search } from "lucide-react";
import { trpc } from "@/lib/trpc";

const STORAGE_KEY = "tijiaobao_scores";

export default function Import() {
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 查询过滤器
  const [queryType, setQueryType] = useState<"all" | "grade" | "class" | "name">("all");
  const [selectedGrade, setSelectedGrade] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [searchName, setSearchName] = useState("");

  const grades = getUniqueGrades(students);
  const classes = getUniqueClasses(students);

  // tRPC 保存学生数据
  const saveStudentMutation = trpc.teacher.saveStudentData.useMutation({
    onError: (error) => {
      toast.error(`保存失败: ${error.message}`);
    },
  });

  // 初始化：从本地存储加载数据
  useEffect(() => {
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

  // 保存到本地存储
  const saveToStorage = (data: StudentRecord[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  };

  // 处理查询过滤
  useEffect(() => {
    let filtered = students;

    if (queryType === "grade" && selectedGrade) {
      filtered = filtered.filter((s) => s.grade?.toLowerCase() === selectedGrade.toLowerCase());
    } else if (queryType === "class" && selectedClass) {
      filtered = filtered.filter((s) => s.class?.toLowerCase() === selectedClass.toLowerCase());
    } else if (queryType === "name" && searchName) {
      const q = searchName.toLowerCase();
      filtered = filtered.filter((s) => s.name?.toLowerCase().includes(q));
    }

    setFilteredStudents(filtered);
  }, [students, queryType, selectedGrade, selectedClass, searchName]);

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

  // 清空数据
  const handleClearData = () => {
    if (confirm("确定要清空所有数据吗？此操作不可撤销。")) {
      setStudents([]);
      setFilteredStudents([]);
      localStorage.removeItem(STORAGE_KEY);
      toast.success("数据已清空");
    }
  };

  // 导出数据
  const handleExport = async () => {
    if (students.length === 0) {
      toast.error("没有可导出的数据");
      return;
    }

    try {
      await exportToExcel(students);
      toast.success("导出成功！文件已保存到下载文件夹");
    } catch (error) {
      toast.error("导出失败");
      console.error(error);
    }
  };

  // 保存到数据库
  const handleSaveToDatabase = async () => {
    if (students.length === 0) {
      toast.error("没有数据可保存");
      return;
    }

    setIsLoading(true);
    try {
      let successCount = 0;
      let failCount = 0;

      for (const student of students) {
        try {
          await saveStudentMutation.mutateAsync({
            name: student.name,
            grade: student.grade,
            class: student.class,
            school: student.school,
            gender: student.gender as "男" | "女",
            longrun: student.longrun,
            swim: student.swim,
            long100: student.long100,
            longContrib: student.longContrib?.toString(),
            football: student.football,
            basketball: student.basketball,
            volleyball: student.volleyball,
            ballContrib: student.ballContrib?.toString(),
            run50: student.run50,
            situp: student.situp,
            ball: student.ball,
            rope: student.rope,
            pullup: student.pullup,
            jump: student.jump,
            selectContrib: student.selectContrib?.toString(),
            selectedProjects: student.selectedProjects ? JSON.stringify(student.selectedProjects) : undefined,
            total40: student.total40?.toString(),
            status: student.status,
          });
          successCount++;
        } catch (error) {
          console.error(`保存 ${student.name} 失败:`, error);
          failCount++;
        }
      }

      if (failCount === 0) {
        toast.success(`已保存 ${successCount} 条学生记录到数据库`);
      } else {
        toast.warning(`保存完成: 成功 ${successCount} 条，失败 ${failCount} 条`);
      }
    } catch (error) {
      console.error("保存失败:", error);
      toast.error("保存失败");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">导入/查询</h1>
          <p className="text-muted-foreground mt-1">
            导入 Excel 文件或查询学生成绩
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          已导入: <span className="font-bold text-foreground">{students.length}</span> 条
        </div>
      </div>

      {/* 导入区域 */}
      {students.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>导入 Excel 文件</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              支持 .xlsx, .xls, .csv 格式。请确保 Excel 包含以下列：姓名、班级、性别、各项成绩
            </p>
            <div className="border-2 border-dashed border-border rounded-lg p-12 text-center hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer">
              <label className="cursor-pointer block">
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileUpload}
                  disabled={isLoading}
                  className="hidden"
                />
                <div className="flex flex-col items-center gap-3">
                  <div className="p-3 bg-primary/10 rounded-full">
                    <Upload className="w-8 h-8 text-primary" />
                  </div>
                  <p className="font-semibold text-lg">点击选择文件或拖拽上传</p>
                  <p className="text-sm text-muted-foreground">支持 Excel 和 CSV 格式</p>
                </div>
              </label>
            </div>
            {isLoading && (
              <div className="flex items-center justify-center gap-2 text-primary mt-4">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span>正在处理...</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 查询区域 */}
      {students.length > 0 && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>学生成绩查询</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 查询过滤器 */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg">
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">查询方式</label>
                  <select
                    value={queryType}
                    onChange={(e) => {
                      setQueryType(e.target.value as any);
                      setSelectedGrade("");
                      setSelectedClass("");
                      setSearchName("");
                    }}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                  >
                    <option value="all">全部学生</option>
                    <option value="grade">按年段</option>
                    <option value="class">按班级</option>
                    <option value="name">按姓名</option>
                  </select>
                </div>

                {queryType === "grade" && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1 block">选择年段</label>
                    <select
                      value={selectedGrade}
                      onChange={(e) => setSelectedGrade(e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                    >
                      <option value="">-- 选择年段 --</option>
                      {grades.map((grade) => (
                        <option key={grade} value={grade}>{grade}</option>
                      ))}
                    </select>
                  </div>
                )}

                {queryType === "class" && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1 block">选择班级</label>
                    <select
                      value={selectedClass}
                      onChange={(e) => setSelectedClass(e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                    >
                      <option value="">-- 选择班级 --</option>
                      {classes.map((cls) => (
                        <option key={cls} value={cls}>{cls}</option>
                      ))}
                    </select>
                  </div>
                )}

                {queryType === "name" && (
                  <div className="sm:col-span-3">
                    <label className="text-sm font-medium text-muted-foreground mb-1 block">输入姓名</label>
                    <Input
                      placeholder="搜索学生姓名..."
                      value={searchName}
                      onChange={(e) => setSearchName(e.target.value)}
                    />
                  </div>
                )}
              </div>

              {/* 成绩表格 */}
              <div className="rounded-lg border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="px-4 py-3 text-left font-semibold">姓名</th>
                        <th className="px-4 py-3 text-left font-semibold">班级</th>
                        <th className="px-4 py-3 text-center font-semibold">性别</th>
                        <th className="px-4 py-3 text-center font-semibold text-primary">总分</th>
                        <th className="px-4 py-3 text-center font-semibold">长跑/游泳</th>
                        <th className="px-4 py-3 text-center font-semibold">球类</th>
                        <th className="px-4 py-3 text-center font-semibold">选考</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center py-8 text-muted-foreground">
                            没有找到匹配的记录
                          </td>
                        </tr>
                      ) : (
                        filteredStudents.map((student, idx) => (
                          <tr key={idx} className="border-t hover:bg-muted/30 transition-colors">
                            <td className="px-4 py-3 font-medium">{student.name}</td>
                            <td className="px-4 py-3 text-sm">{student.class || "-"}</td>
                            <td className="px-4 py-3 text-center text-sm">{student.gender}</td>
                            <td className="px-4 py-3 text-center font-bold text-primary text-lg">
                              {student.total40}
                            </td>
                            <td className="px-4 py-3 text-center text-sm">
                              <div className="font-medium">{student.longContrib}</div>
                              <div className="text-xs text-muted-foreground">
                                {student.swim ? `游泳: ${student.swim}` : student.longrun ? `长跑: ${student.longrun}` : "-"}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center text-sm">
                              <div className="font-medium">{student.ballContrib}</div>
                              <div className="text-xs text-muted-foreground">
                                {student.football ? `足球: ${student.football}` : student.basketball ? `篮球: ${student.basketball}` : student.volleyball ? `排球: ${student.volleyball}` : "-"}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center text-sm">
                              <div className="font-medium">{student.selectContrib}</div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="flex gap-2 pt-4 border-t flex-wrap">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileUpload}
                    disabled={isLoading}
                    className="hidden"
                  />
                  <Button asChild variant="outline" className="gap-2">
                    <span><Upload className="w-4 h-4" /> 重新导入</span>
                  </Button>
                </label>
                <Button onClick={handleExport} variant="outline" className="gap-2">
                  <Download className="w-4 h-4" /> 导出 Excel
                </Button>
                <Button
                  onClick={handleSaveToDatabase}
                  className="gap-2"
                  disabled={saveStudentMutation.isPending || isLoading}
                >
                  {saveStudentMutation.isPending ? "保存中..." : "保存到数据库"}
                </Button>
                <Button onClick={handleClearData} variant="destructive" className="gap-2 ml-auto">
                  <Trash2 className="w-4 h-4" /> 清空数据
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
