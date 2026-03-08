import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StudentRecord } from "@/lib/scoring";
import { performAnalysis, getUniqueGrades, getUniqueClasses } from "@/lib/analysis";
import { toast } from "sonner";
import { Sparkles, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Streamdown } from "streamdown";

const STORAGE_KEY = "tijiaobao_scores";

export default function Parent() {
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentRecord[]>([]);
  const [activeTab, setActiveTab] = useState("query");
  const [shareCode, setShareCode] = useState("");
  const [isLoadingShare, setIsLoadingShare] = useState(false);
  const [hasLoadedData, setHasLoadedData] = useState(false);
  const [shareStats, setShareStats] = useState<{ queryCount: number; lastQueryAt: string | null } | null>(null);
  const [teacherId, setTeacherId] = useState<number | null>(null);

  // 查询过滤器
  const [queryType, setQueryType] = useState<"all" | "grade" | "class" | "name">("all");
  const [selectedGrade, setSelectedGrade] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [searchName, setSearchName] = useState("");

  // AI 建议相关状态
  const [selectedStudent, setSelectedStudent] = useState<StudentRecord | null>(null);
  const [advice, setAdvice] = useState<string>("");

  // 初始化：从本地存储加载数据
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setStudents(data);
        setFilteredStudents(data);
        setHasLoadedData(true);
      } catch (error) {
        console.error("加载数据失败:", error);
      }
    }
  }, []);

  // 处理查询过滤
  const handleQuery = () => {
    let result = students;

    if (queryType === "grade" && selectedGrade) {
      result = result.filter((s) => s.grade === selectedGrade);
    } else if (queryType === "class" && selectedClass) {
      result = result.filter((s) => s.class === selectedClass);
    } else if (queryType === "name" && searchName) {
      result = result.filter((s) =>
        s.name.toLowerCase().includes(searchName.toLowerCase())
      );
    }

    setFilteredStudents(result);
  };

  // 使用 tRPC mutation 查询分享数据
  const getSharedDataMutation = trpc.parent.getSharedData.useMutation({
    onSuccess: (data) => {
      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        const convertedData = data.data.map((s: any) => {
          let selectedProjects = s.selectedProjects;
          if (typeof selectedProjects === 'string') {
            try {
              selectedProjects = JSON.parse(selectedProjects);
            } catch (e) {
              console.warn("Failed to parse selectedProjects", e);
            }
          }
          return {
            ...s,
            grade: s.grade || undefined,
            class: s.class || undefined,
            school: s.school || undefined,
            selectedProjects,
          };
        }) as StudentRecord[];
        setStudents(convertedData);
        setFilteredStudents(convertedData);
        setHasLoadedData(true);
        setTeacherId(data.teacherId || null);
        toast.success("成功加载分享数据");
        setActiveTab("query");
      } else {
        toast.error("分享码无效或已过期");
      }
    },
    onError: (error) => {
      console.error("[Share code query error]", error);
      toast.error("加载分享数据失败");
    },
  });

  // 处理分享码查询
  const handleQueryByShareCode = async () => {
    if (!shareCode.trim()) {
      toast.error("请输入分享码");
      return;
    }

    await getSharedDataMutation.mutateAsync({ shareCode });
  };

  // AI 建议生成
  const generateAdviceMutation = trpc.ai.generateAdvice.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        setAdvice(data.advice);
        toast.success("AI 建议生成成功");
      } else {
        toast.error(data.advice || "生成失败");
      }
    },
    onError: (error) => {
      toast.error(`错误: ${error.message}`);
    },
  });

  const handleGenerateAdvice = async () => {
    if (!selectedStudent) {
      toast.error("请先选择学生");
      return;
    }

    const selectTotal = selectedStudent.selectedProjects?.reduce((sum, p) => {
      const contrib = typeof p.contrib === "string" ? parseFloat(p.contrib) : p.contrib;
      return sum + (contrib || 0);
    }, 0) || 0;

    generateAdviceMutation.mutate({
      name: selectedStudent.name,
      gender: selectedStudent.gender,
      total40: typeof selectedStudent.total40 === "string" ? parseFloat(selectedStudent.total40) : selectedStudent.total40 || 0,
      longContrib: typeof selectedStudent.longContrib === "string" ? parseFloat(selectedStudent.longContrib) : selectedStudent.longContrib,
      ballContrib: typeof selectedStudent.ballContrib === "string" ? parseFloat(selectedStudent.ballContrib) : selectedStudent.ballContrib,
      selectContrib: selectTotal,
    });
  };

  const handleLogout = () => {
    localStorage.removeItem("userRole");
    window.location.href = "/login";
  };

  const grades = getUniqueGrades(students);
  const classes = getUniqueClasses(students);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* 顶部导航 */}
      <div className="bg-white shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-blue-600">体教宝</h1>
            <p className="text-sm text-muted-foreground">家长端 - 查看孩子成绩</p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            退出登入
          </Button>
        </div>
      </div>

      {/* 主要内容 */}
      <div className="max-w-7xl mx-auto p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="query">查询与建议</TabsTrigger>
            <TabsTrigger value="consultation">咨询老师</TabsTrigger>
          </TabsList>

          {/* 查询标签页 */}
          <TabsContent value="query" className="space-y-4">
            {!hasLoadedData && (
              <Card className="p-6 mb-6 bg-blue-50 border-blue-200">
                <h2 className="text-lg font-bold mb-4">输入教师分享码查询成绩</h2>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="输入教师提供的分享码"
                    value={shareCode}
                    onChange={(e) => setShareCode(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleQueryByShareCode()}
                  />
                  <Button 
                    onClick={handleQueryByShareCode}
                    disabled={isLoadingShare}
                  >
                    {isLoadingShare ? "加载中..." : "查询"}
                  </Button>
                </div>
              </Card>
            )}

            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">学生成绩查询</h2>

              <div className="space-y-4">
                {/* 查询类型选择 */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-sm font-medium">查询方式</label>
                    <select
                      value={queryType}
                      onChange={(e) => setQueryType(e.target.value as any)}
                      className="w-full mt-2 px-3 py-2 border border-border rounded-lg"
                    >
                      <option value="all">全部学生</option>
                      <option value="grade">按年段</option>
                      <option value="class">按班级</option>
                      <option value="name">按姓名</option>
                    </select>
                  </div>

                  {queryType === "grade" && (
                    <div>
                      <label className="text-sm font-medium">选择年段</label>
                      <select
                        value={selectedGrade}
                        onChange={(e) => setSelectedGrade(e.target.value)}
                        className="w-full mt-2 px-3 py-2 border border-border rounded-lg"
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
                      <label className="text-sm font-medium">选择班级</label>
                      <select
                        value={selectedClass}
                        onChange={(e) => setSelectedClass(e.target.value)}
                        className="w-full mt-2 px-3 py-2 border border-border rounded-lg"
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
                      <label className="text-sm font-medium">输入姓名</label>
                      <Input
                        type="text"
                        placeholder="输入学生姓名"
                        value={searchName}
                        onChange={(e) => setSearchName(e.target.value)}
                        className="mt-2"
                      />
                    </div>
                  )}

                  <div className="flex items-end">
                    <Button onClick={handleQuery} className="w-full">
                      查询
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            {/* 查询结果表格 */}
            {filteredStudents.length > 0 ? (
              <Card className="p-6 overflow-x-auto">
                <h3 className="text-lg font-bold mb-4">查询结果 ({filteredStudents.length} 人)</h3>
                <table className="w-full text-sm">
                  <thead className="border-b border-border">
                    <tr>
                      <th className="text-left py-2 px-2">姓名</th>
                      <th className="text-left py-2 px-2">班级</th>
                      <th className="text-left py-2 px-2">性别</th>
                      <th className="text-center py-2 px-2">长跑/游泳</th>
                      <th className="text-center py-2 px-2">球类项目</th>
                      <th className="text-center py-2 px-2">选考项目</th>
                      <th className="text-center py-2 px-2">总成绩</th>
                      <th className="text-center py-2 px-2">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((student, idx) => (
                      <tr key={idx} className="border-b border-border hover:bg-gray-50">
                        <td className="py-2 px-2 font-medium">{student.name}</td>
                        <td className="py-2 px-2">{student.class}</td>
                        <td className="py-2 px-2">{student.gender}</td>
                        <td className="py-2 px-2 text-center text-blue-600 font-semibold">{student.longContrib || "-"}</td>
                        <td className="py-2 px-2 text-center text-green-600 font-semibold">{student.ballContrib || "-"}</td>
                        <td className="py-2 px-2 text-center text-purple-600 font-semibold">{student.selectContrib || "-"}</td>
                        <td className="py-2 px-2 text-center font-bold text-primary text-lg">{student.total40}</td>
                        <td className="py-2 px-2 text-center">
                          <Button
                            size="sm"
                            variant={selectedStudent?.name === student.name ? "default" : "outline"}
                            onClick={() => {
                              setSelectedStudent(student);
                              setAdvice("");
                            }}
                          >
                            {selectedStudent?.name === student.name ? "已选择" : "选择"}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            ) : hasLoadedData ? (
              <Card className="p-6 text-center text-muted-foreground">
                暂无数据
              </Card>
            ) : null}

            {/* 选中学生的 AI 建议区域 */}
            {selectedStudent && (
              <Card className="p-6 bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-purple-600" />
                  AI 训练建议 - {selectedStudent.name}
                </h2>

                {/* 学生成绩详情 */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <p className="text-xs text-muted-foreground mb-1">长跑/游泳</p>
                    <p className="text-2xl font-bold text-blue-600">{selectedStudent.longContrib}</p>
                    <p className="text-xs text-muted-foreground">/ 15分</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <p className="text-xs text-muted-foreground mb-1">球类项目</p>
                    <p className="text-2xl font-bold text-green-600">{selectedStudent.ballContrib}</p>
                    <p className="text-xs text-muted-foreground">/ 9分</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                    <p className="text-xs text-muted-foreground mb-1">总分</p>
                    <p className="text-2xl font-bold text-purple-600">{selectedStudent.total40}</p>
                    <p className="text-xs text-muted-foreground">/ 40分</p>
                  </div>
                </div>

                {/* 生成建议按钮 */}
                <Button
                  onClick={handleGenerateAdvice}
                  disabled={generateAdviceMutation.isPending}
                  className="w-full gap-2 mb-4"
                >
                  {generateAdviceMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      生成中...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      生成 AI 训练建议
                    </>
                  )}
                </Button>

                {/* AI 建议展示 */}
                {advice && (
                  <div className="bg-white rounded-lg p-4 border border-border">
                    <div className="prose prose-sm max-w-none">
                      <Streamdown>{advice}</Streamdown>
                    </div>
                  </div>
                )}
              </Card>
            )}

            {/* 分享码输入区域 - 放在查询页面底部 */}
            {!hasLoadedData && (
              <Card className="p-6 bg-amber-50 border-amber-200 mt-6">
                <h3 className="text-lg font-bold mb-3">还没有加载成绩数据？</h3>
                <p className="text-sm text-muted-foreground mb-4">请输入教师提供的分享码来查询学生成绩</p>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="输入教师提供的分享码"
                    value={shareCode}
                    onChange={(e) => setShareCode(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleQueryByShareCode()}
                  />
                  <Button 
                    onClick={handleQueryByShareCode}
                    disabled={isLoadingShare}
                  >
                    {isLoadingShare ? "加载中..." : "查询"}
                  </Button>
                </div>
              </Card>
            )}
            {shareStats && (
              <Card className="p-4 mt-4 bg-blue-50 border-blue-200">
                <h4 className="font-semibold text-sm mb-2">分享统计信息</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">查询次数</p>
                    <p className="text-lg font-bold text-blue-600">{shareStats.queryCount}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">最后查询时间</p>
                    <p className="text-sm font-medium">
                      {shareStats.lastQueryAt 
                        ? new Date(shareStats.lastQueryAt).toLocaleString('zh-CN')
                        : "暂无"}
                    </p>
                  </div>
                </div>
              </Card>
            )}
          </TabsContent>

          {/* 咨询标签页 */}
          <TabsContent value="consultation" className="space-y-4">
            {!hasLoadedData ? (
              <Card className="p-6 text-center text-muted-foreground">
                请先查询成绩数据，然后可以联系老师
              </Card>
            ) : (
              <ConsultationPanel teacherId={teacherId} />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}


/**
 * 咨询面板组件
 */
function ConsultationPanel({ teacherId }: { teacherId: number | null }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [wechatId, setWechatId] = useState("");
  const [showWechatQR, setShowWechatQR] = useState(false);

  const getTeacherWechatQuery = trpc.parent.getTeacherWechat.useQuery({ teacherId: teacherId || 0 }, { enabled: !!teacherId });
  const submitConsultationMutation = trpc.parent.submitConsultation.useMutation({
    onSuccess: () => {
      toast.success("咨询已提交，老师会尽快回复");
      setTitle("");
      setContent("");
    },
    onError: (error) => {
      toast.error(`提交失败: ${error.message}`);
    },
  });
  const getConsultationHistoryQuery = trpc.parent.getConsultationHistory.useQuery({ teacherId: teacherId || 0 }, { enabled: !!teacherId });

  useEffect(() => {
    if (getTeacherWechatQuery.data?.wechatId) {
      setWechatId(getTeacherWechatQuery.data.wechatId);
    }
  }, [getTeacherWechatQuery.data]);

  const handleSubmitConsultation = () => {
    if (!title.trim() || !content.trim()) {
      toast.error("请填写咨询标题和内容");
      return;
    }
    if (!teacherId) {
      toast.error("无法获取老师信息，请重新查询");
      return;
    }
    submitConsultationMutation.mutate({
      teacherId,
      title: title.trim(),
      content: content.trim(),
    });
  };

  return (
    <div className="space-y-6">
      {/* 微信联系方式 */}
      {wechatId && (
        <Card className="p-6 bg-green-50 border-green-200">
          <h3 className="font-semibold mb-4">微信直接联系</h3>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              老师微信号：<span className="font-mono font-bold text-green-700">{wechatId}</span>
            </p>
            <Button
              onClick={() => setShowWechatQR(!showWechatQR)}
              variant="outline"
              className="w-full"
            >
              {showWechatQR ? "隐藏" : "显示"}微信二维码
            </Button>
            {showWechatQR && (
              <div className="mt-4 p-4 bg-white rounded-lg border border-green-200 text-center">
                <p className="text-sm text-muted-foreground mb-3">使用微信扫描二维码添加老师</p>
                <div className="inline-block p-4 bg-white border-2 border-green-300 rounded">
                  <div className="w-40 h-40 bg-gray-100 flex items-center justify-center">
                    <span className="text-xs text-muted-foreground">
                      二维码生成中...
                      <br />
                      (微信号: {wechatId})
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* 应用内咨询 */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">应用内咨询</h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">咨询标题</label>
            <Input
              placeholder="例如：关于孩子的体育成绩"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-2"
            />
          </div>
          <div>
            <label className="text-sm font-medium">咨询内容</label>
            <textarea
              placeholder="请详细描述你的问题..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full mt-2 p-3 border border-border rounded-lg resize-none"
              rows={5}
            />
          </div>
          <Button
            onClick={handleSubmitConsultation}
            disabled={submitConsultationMutation.isPending}
            className="w-full"
          >
            {submitConsultationMutation.isPending ? "提交中..." : "提交咨询"}
          </Button>
        </div>
      </Card>

      {/* 咨询历史 */}
      {getConsultationHistoryQuery.data?.consultations && getConsultationHistoryQuery.data.consultations.length > 0 && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4">咨询历史</h3>
          <div className="space-y-3">
            {getConsultationHistoryQuery.data.consultations.map((consultation: any) => (
              <div key={consultation.id} className="border border-border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium">{consultation.title}</h4>
                  <span className={`text-xs px-2 py-1 rounded ${
                    consultation.status === 'replied' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {consultation.status === 'replied' ? '已回复' : '待回复'}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{consultation.content}</p>
                {consultation.reply && (
                  <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
                    <p className="text-xs text-muted-foreground mb-1">老师回复：</p>
                    <p className="text-sm">{consultation.reply}</p>
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  {new Date(consultation.createdAt).toLocaleString('zh-CN')}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
