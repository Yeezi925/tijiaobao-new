/**
 * 体教宝 - 主页面 (最终版)
 * 
 * 功能模块：
 * 1. Excel 导入与成绩解析（与查询合并）
 * 2. 多层级学生成绩查询（学校、年段、班级、个人）
 * 3. 完整的数据统计与分析（按40分制显示）
 * 4. AI 训练建议生成
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, BarChart3, Sparkles, Download, Trash2, Copy } from "lucide-react";
import { StudentRecord } from "@/lib/scoring";
import { parseExcelFile, exportToExcel } from "@/lib/excel";
import { performAnalysis, getUniqueGrades, getUniqueClasses } from "@/lib/analysis";
import { toast } from "sonner";
import AIAdvice from "./AIAdvice";
import LessonPlanGenerator from "./LessonPlanGenerator";
import { BookOpen } from "lucide-react";
import { trpc } from "@/lib/trpc";

const STORAGE_KEY = "tijiaobao_scores";

export default function Home() {
  const userRole = localStorage.getItem("userRole");
  
  // 如果未登入或角色不是教师，重定向到登入页面
  if (!userRole || userRole !== "teacher") {
    window.location.href = "/login";
    return null;
  }

  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("query");
  const [shareCode, setShareCode] = useState("");
  const [showShareCode, setShowShareCode] = useState(false);
  const [expireOption, setExpireOption] = useState<"7" | "30" | "90" | "never">("7");
  // 分享权限控制
  const [shareFilterType, setShareFilterType] = useState<"all" | "grade" | "class">("all");
  const [shareFilterValue, setShareFilterValue] = useState("");

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

  // tRPC 保存学生数据
  const saveStudentMutation = trpc.teacher.saveStudentData.useMutation({
    onError: (error) => {
      toast.error(`保存失败: ${error.message}`);
    },
  });

  // tRPC 创建分享链接
  const createShareLinkMutation = trpc.teacher.createShareLink.useMutation({
    onSuccess: (data) => {
      if (data.shareCode) {
        setShareCode(data.shareCode);
        setShowShareCode(true);
        toast.success(`分享码已生成: ${data.shareCode}`);
      }
    },
    onError: (error) => {
      toast.error(`生成分享码失败: ${error.message}`);
    },
  });

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
      // 使用 tRPC 保存每个学生的数据
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

  // 生成分享链接
  // 生成分享链接
  const handleGenerateShareLink = async () => {
    if (students.length === 0) {
      toast.error("没有数据可分享");
      return;
    }

    setIsLoading(true);
    try {
      // 计算过期时间
      let expiresAt: Date | undefined;
      if (expireOption !== "never") {
        const days = parseInt(expireOption);
        expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + days);
      }

      // 根据权限过滤学生数据
      let dataToShare = students;
      if (shareFilterType === "grade" && shareFilterValue) {
        dataToShare = students.filter(s => s.grade === shareFilterValue);
      } else if (shareFilterType === "class" && shareFilterValue) {
        dataToShare = students.filter(s => s.class === shareFilterValue);
      }

      if (dataToShare.length === 0) {
        toast.error("没有符合条件的学生数据");
        return;
      }

      // 使用 tRPC 生成分享链接
      // 发送学生数据，不仅是 ID
      await createShareLinkMutation.mutateAsync({
        title: "学生成绩分享",
        description: `分享 ${dataToShare.length} 名学生的成绩数据`,
        studentIds: dataToShare.map((_, idx) => idx + 1),
        studentData: JSON.stringify(dataToShare),
        expiresAt,
        filterType: shareFilterType,
        filterValue: shareFilterValue,
      });
    } catch (error) {
      console.error("生成分享码失败:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const grades = getUniqueGrades(students);
  const classes = getUniqueClasses(students);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* 顶部导航栏 */}
      <header className="bg-white shadow-sm border-b border-border sticky top-0 z-50">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                体教宝
              </h1>
              <p className="text-sm text-muted-foreground">现代化体育成绩管理系统</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">已导入</p>
                <p className="text-2xl font-bold text-primary">{students.length}</p>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  localStorage.removeItem("userRole");
                  window.location.href = "/login";
                }}
              >
                退出登入
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="container py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6 mb-6">
            <TabsTrigger value="query" className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">导入/查询</span>
            </TabsTrigger>
            <TabsTrigger value="analysis" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">分析</span>
            </TabsTrigger>
            <TabsTrigger value="ai" className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">AI</span>
            </TabsTrigger>
            <TabsTrigger value="lesson" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">教案</span>
            </TabsTrigger>
            <TabsTrigger value="manage" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">数据管理</span>
            </TabsTrigger>
            <TabsTrigger value="wechat" className="flex items-center gap-2">
              <span className="text-sm">微信</span>
            </TabsTrigger>
          </TabsList>

          {/* 导入/查询标签页 */}
          <TabsContent value="query" className="space-y-4">
            {/* 导入区域 */}
            {students.length === 0 && (
              <Card className="p-8 bg-white">
                <div className="space-y-4">
                  <h2 className="text-2xl font-semibold">导入 Excel 文件</h2>
                  <p className="text-sm text-muted-foreground">
                    支持 .xlsx, .xls, .csv 格式。请确保 Excel 包含以下列：姓名、班级、性别、各项成绩
                  </p>

                  <div className="border-2 border-dashed border-primary rounded-lg p-12 text-center hover:bg-primary/5 transition-colors cursor-pointer">
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
                    <div className="flex items-center justify-center gap-2 text-primary">
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      <span>正在处理...</span>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* 查询区域 */}
            {students.length > 0 && (
              <Card className="p-6 bg-white">
                <h2 className="text-2xl font-semibold mb-6">学生成绩查询</h2>

                {/* 查询过滤器 */}
                <div className="space-y-4 mb-6 p-4 bg-secondary/30 rounded-lg">
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">查询方式</label>
                      <select
                        value={queryType}
                        onChange={(e) => {
                          setQueryType(e.target.value as any);
                          setSelectedGrade("");
                          setSelectedClass("");
                          setSearchName("");
                        }}
                        className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-white"
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
                          className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-white"
                        >
                          <option value="">-- 选择年段 --</option>
                          {grades.map((grade) => (
                            <option key={grade} value={grade}>
                              {grade}
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
                          className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-white"
                        >
                          <option value="">-- 选择班级 --</option>
                          {classes.map((cls) => (
                            <option key={cls} value={cls}>
                              {cls}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {queryType === "name" && (
                      <div className="sm:col-span-3">
                        <label className="text-sm font-medium text-muted-foreground">输入姓名</label>
                        <Input
                          placeholder="搜索学生姓名..."
                          value={searchName}
                          onChange={(e) => setSearchName(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* 成绩表格 */}
                {filteredStudents.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    没有找到匹配的记录
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-gradient-to-r from-blue-50 to-indigo-50">
                          <th className="px-4 py-3 text-left font-semibold">姓名</th>
                          <th className="px-4 py-3 text-left font-semibold">班级</th>
                          <th className="px-4 py-3 text-center font-semibold">性别</th>
                          <th className="px-4 py-3 text-center font-semibold text-primary font-bold">总分</th>
                          <th className="px-4 py-3 text-center font-semibold">长跑/游泳</th>
                          <th className="px-4 py-3 text-center font-semibold">球类项目</th>
                          <th className="px-4 py-3 text-center font-semibold">选考项目1</th>
                          <th className="px-4 py-3 text-center font-semibold">选考项目2</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredStudents.map((student, idx) => (
                          <tr
                            key={idx}
                            className="border-b border-border hover:bg-blue-50/50 transition-colors"
                          >
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
                              <div className="font-medium">{student.selectedProjects?.[0]?.contrib || "-"}</div>
                              <div className="text-xs text-muted-foreground">{student.selectedProjects?.[0]?.name || "-"}</div>
                            </td>
                            <td className="px-4 py-3 text-center text-sm">
                              <div className="font-medium">{student.selectedProjects?.[1]?.contrib || "-"}</div>
                              <div className="text-xs text-muted-foreground">{student.selectedProjects?.[1]?.name || "-"}</div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* 操作按针 */}
                <div className="flex gap-2 pt-6 border-t border-border flex-wrap">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleFileUpload}
                      disabled={isLoading}
                      className="hidden"
                    />
                    <Button asChild variant="outline" className="gap-2 cursor-pointer">
                      <span>
                        <Upload className="w-4 h-4" />
                        重新导入
                      </span>
                    </Button>
                  </label>
                  <Button onClick={handleExport} variant="outline" className="gap-2">
                    <Download className="w-4 h-4" />
                    导出 Excel
                  </Button>
                  <Button onClick={handleSaveToDatabase} variant="default" className="gap-2" disabled={saveStudentMutation.isPending || isLoading}>
                    <Sparkles className="w-4 h-4" />
                    {saveStudentMutation.isPending ? "保存中..." : "保存到数据库"}
                  </Button>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium">过期时间:</label>
                      <select
                        value={expireOption}
                        onChange={(e) => setExpireOption(e.target.value as "7" | "30" | "90" | "never")}
                        className="px-3 py-2 border border-border rounded-md text-sm bg-white"
                      >
                        <option value="7">7天</option>
                        <option value="30">30天</option>
                        <option value="90">90天</option>
                        <option value="never">永久</option>
                      </select>
                    </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium">分享范围:</label>
                      <select
                        value={shareFilterType}
                        onChange={(e) => {
                          setShareFilterType(e.target.value as "all" | "grade" | "class");
                          setShareFilterValue("");
                        }}
                        className="px-3 py-2 border border-border rounded-md text-sm bg-white"
                      >
                        <option value="all">全部学生</option>
                        <option value="grade">按年段</option>
                        <option value="class">按班级</option>
                      </select>
                    </div>
                    {shareFilterType === "grade" && (
                      <select
                        value={shareFilterValue}
                        onChange={(e) => setShareFilterValue(e.target.value)}
                        className="px-3 py-2 border border-border rounded-md text-sm bg-white"
                      >
                        <option value="">选择年段</option>
                        {grades.map(grade => (
                          <option key={grade} value={grade}>{grade}</option>
                        ))}
                      </select>
                    )}
                    {shareFilterType === "class" && (
                      <select
                        value={shareFilterValue}
                        onChange={(e) => setShareFilterValue(e.target.value)}
                        className="px-3 py-2 border border-border rounded-md text-sm bg-white"
                      >
                        <option value="">选择班级</option>
                        {classes.map(cls => (
                          <option key={cls} value={cls}>{cls}</option>
                        ))}
                      </select>
                    )}
                  </div>
                    <Button onClick={handleGenerateShareLink} variant="default" className="gap-2" disabled={createShareLinkMutation.isPending || isLoading}>
                      <Sparkles className="w-4 h-4" />
                      {createShareLinkMutation.isPending ? "生成中..." : "生成分享链接"}
                    </Button>
                  </div>
                  <Button onClick={handleClearData} variant="destructive" className="gap-2">
                    <Trash2 className="w-4 h-4" />
                    清空数据
                  </Button>
                </div>
                
                {showShareCode && shareCode && (
                  <Card className="p-4 mt-4 bg-green-50 border-green-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">分享码已生成</p>
                        <p className="text-2xl font-bold text-green-600 font-mono">{shareCode}</p>
                      </div>
                      <Button
                        onClick={() => {
                          navigator.clipboard.writeText(shareCode);
                          toast.success("分享码已复制到剪贴板");
                        }}
                        variant="outline"
                        className="gap-2"
                      >
                        <Copy className="w-4 h-4" />
                        复制
                      </Button>
                    </div>
                    <div className="border-t border-green-200 pt-3 mt-3">
                      <p className="text-sm text-muted-foreground mb-2">分享链接</p>
                      <div className="flex items-center gap-2">
                        <Input
                          readOnly
                          value={`${window.location.origin}/parent?code=${shareCode}`}
                          className="text-sm bg-white"
                        />
                        <Button
                          onClick={() => {
                            const url = `${window.location.origin}/parent?code=${shareCode}`;
                            navigator.clipboard.writeText(url);
                            toast.success("链接已复制");
                          }}
                          size="sm"
                          variant="outline"
                          className="gap-2"
                        >
                          <Copy className="w-4 h-4" />
                          复制
                        </Button>
                      </div>
                    </div>
                    <div className="border-t border-green-200 pt-3 mt-3">
                      <p className="text-sm text-muted-foreground mb-1">过期时间</p>
                      <p className="text-sm font-medium">
                        {expireOption === "never" ? "永久有效" : `${expireOption}天后失效`}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">将分享码或链接分享给家长查看学生成绩</p>
                  </Card>
                )}
              </Card>
            )}
          </TabsContent>

          {/* 分析标签页 */}
          <TabsContent value="analysis" className="space-y-4">
            <Card className="p-6 bg-white">
              <h2 className="text-2xl font-semibold mb-6">数据统计分析</h2>

              {students.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  请先导入数据以查看统计信息
                </div>
              ) : (
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
              )}
            </Card>
          </TabsContent>

          {/* AI 建议标签页 */}
          <TabsContent value="ai" className="space-y-4">
            <AIAdvice students={students} />
          </TabsContent>

          {/* 教案生成标签页 */}
          <TabsContent value="lesson" className="space-y-4">
            <LessonPlanGenerator />
          </TabsContent>

          <TabsContent value="manage" className="space-y-4">
            <Card className="p-6">
              <h2 className="text-2xl font-semibold mb-6">Data Management</h2>
              <div className="space-y-4">
                <p className="text-muted-foreground">View and manage all saved share links for student data.</p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">How to use share links:</h3>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
                    <li>Import student data in the Import/Query tab</li>
                    <li>Click Generate Share Link button to create a share code</li>
                    <li>Copy the share code and send to parents</li>
                    <li>Parents can enter the code in the Parent Portal to view scores</li>
                  </ol>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* 微信管理标签页 */}
          <TabsContent value="wechat" className="space-y-4">
            <WechatManagement />
          </TabsContent>
        </Tabs>
      </main>
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
    return <div className="text-center text-muted-foreground">无法计算统计数据</div>;
  }

  return (
    <div className="space-y-6">
      {/* 分析级别选择 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-secondary/30 rounded-lg">
        <div>
          <label className="text-sm font-medium text-muted-foreground">分析级别</label>
          <select
            value={analysisLevel}
            onChange={(e) => {
              setAnalysisLevel(e.target.value as any);
              setAnalysisGrade("");
              setAnalysisClass("");
            }}
            className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-white"
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
              className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-white"
            >
              <option value="">-- 选择年段 --</option>
              {grades.map((grade) => (
                <option key={grade} value={grade}>
                  {grade}
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
              className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-white"
            >
              <option value="">-- 选择班级 --</option>
              {classes.map((cls) => (
                <option key={cls} value={cls}>
                  {cls}
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
            <span className="text-sm font-medium">显示性别对比</span>
          </label>
        </div>
      </div>

      {/* 关键指标 */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <StatCard label="总人数" value={stats.count.toString()} color="from-blue-500 to-blue-600" />
        <StatCard label="平均分(40分)" value={stats.avgTotal} color="from-green-500 to-green-600" />
        <StatCard label="优秀率(≥36)" value={stats.excellentRate} color="from-purple-500 to-purple-600" />
        <StatCard label="及格率(≥30)" value={stats.passRate} color="from-orange-500 to-orange-600" />
        <StatCard label="低分率(<20)" value={stats.lowRate} color="from-red-500 to-red-600" />
      </div>

      {/* 满分人数 */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-muted-foreground">满分(40分)人数</p>
        <p className="text-3xl font-bold text-yellow-600">{stats.fullScoreCount}</p>
      </div>

      {/* 性别对比 */}
      {showGenderCompare && analysis.maleStats && analysis.femaleStats && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h3 className="font-semibold mb-3 text-blue-600">男生统计</h3>
            <div className="space-y-2 text-sm">
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
            </div>
          </div>
          <div className="bg-pink-50 rounded-lg p-4 border border-pink-200">
            <h3 className="font-semibold mb-3 text-pink-600">女生统计</h3>
            <div className="space-y-2 text-sm">
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
            </div>
          </div>
        </div>
      )}

      {/* 三大项平均成绩（40分制） */}
      {analysis.projectStats && (
        <div className="bg-secondary/30 rounded-lg p-4">
          <h3 className="font-semibold mb-4">三大项平均成绩(40分制)</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-3 border border-border">
              <p className="text-xs text-muted-foreground mb-1">长跑/游泳(15分)</p>
              <p className="text-lg font-bold text-primary">{analysis.projectStats.longrun.avg}</p>
              <p className="text-xs text-muted-foreground">({analysis.projectStats.longrun.count}人)</p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-border">
              <p className="text-xs text-muted-foreground mb-1">球类(9分)</p>
              <p className="text-lg font-bold text-primary">{analysis.projectStats.ball.avg}</p>
              <p className="text-xs text-muted-foreground">({analysis.projectStats.ball.count}人)</p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-border">
              <p className="text-xs text-muted-foreground mb-1">选考(16分)</p>
              <p className="text-lg font-bold text-primary">{analysis.projectStats.select.avg}</p>
              <p className="text-xs text-muted-foreground">({analysis.projectStats.select.count}人)</p>
            </div>
          </div>
        </div>
      )}

      {/* 单项平均成绩（40分制） */}
      {analysis.singleItemStats && (
        <div className="bg-secondary/30 rounded-lg p-4">
          <h3 className="font-semibold mb-4">单项平均成绩(40分制)</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {Object.entries(analysis.singleItemStats).map(([name, data]) => (
              data.count > 0 && (
                <div key={name} className="bg-white rounded-lg p-3 border border-border">
                  <p className="text-xs text-muted-foreground mb-1">{name}</p>
                  <p className="text-lg font-bold text-primary">{data.avg}</p>
                  <p className="text-xs text-muted-foreground">({data.count}人)</p>
                </div>
              )
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * 统计卡片组件
 */
function StatCard({
  label,
  value,
  color
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className={`bg-gradient-to-br ${color} rounded-lg p-4 text-white shadow-md`}>
      <p className="text-xs opacity-90 mb-1">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}


/**
 * 微信管理组件
 */
function WechatManagement() {
  const [wechatId, setWechatId] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  
  const getWechatQuery = trpc.teacher.getWechatId.useQuery();
  const updateWechatMutation = trpc.teacher.updateWechatId.useMutation();
  const isLoading = updateWechatMutation.isPending;

  useEffect(() => {
    if (getWechatQuery.data?.wechatId) {
      setWechatId(getWechatQuery.data.wechatId);
    }
  }, [getWechatQuery.data?.wechatId]);

  const handleSaveWechat = () => {
    if (!wechatId.trim()) {
      toast.error("请输入微信号");
      return;
    }
    updateWechatMutation.mutate(
      { wechatId: wechatId.trim() },
      {
        onSuccess: () => {
          toast.success("微信号已保存");
          getWechatQuery.refetch();
        },
        onError: (error) => {
          toast.error(`保存失败: ${error.message}`);
        },
      }
    );
  };

  return (
    <Card className="p-6 bg-white">
      <h2 className="text-2xl font-semibold mb-6">微信号管理</h2>
      <div className="space-y-4 max-w-md">
        <div>
          <label className="text-sm font-medium text-muted-foreground">微信号</label>
          <Input
            placeholder="请输入你的微信号"
            value={wechatId}
            onChange={(e) => setWechatId(e.target.value)}
            className="mt-2"
          />
          <p className="text-xs text-muted-foreground mt-2">
            家长可通过此微信号扫描二维码添加你，进行咨询沟通
          </p>
        </div>
        <Button
          onClick={handleSaveWechat}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? "保存中..." : "保存微信号"}
        </Button>
        {wechatId && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-muted-foreground mb-3">家长可以通过以下方式添加你：</p>
            <div className="space-y-2 text-sm">
              <p>1. 在家长端输入你的微信号</p>
              <p>2. 系统会生成微信二维码</p>
              <p>3. 家长扫描二维码添加你的微信</p>
              <p>4. 在应用内提交咨询问题</p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
