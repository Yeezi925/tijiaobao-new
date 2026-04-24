/**
 * 体教宝 - 客户端工作台 v2
 * 左侧功能栏 + 右侧聊天框/功能面板
 */
import { useState, useRef, useEffect } from "react";
import {
  ArrowLeft,
  BarChart3,
  BookOpen,
  Bot,
  FileText,
  GraduationCap,
  PanelLeft,
  Send,
  Sparkles,
  Upload,
  Loader2,
  Download,
  Search,
  Copy,
  Trash2,
  Calendar,
  Trophy,
  Target,
  Users,
  RotateCcw,
  CheckCircle2,
  X,
  ChevronRight,
  Settings,
  MessageCircle,
  RefreshCw,
  ThumbsUp,
  AlertCircle,
  Lightbulb,
  Clock,
  User,
  Trash,
  Plus,
  Minus,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { StudentRecord, calculateScores } from "@/lib/scoring";
import { parseExcelFile, exportToExcel } from "@/lib/excel";
import { getUniqueGrades, getUniqueClasses, getUniqueSchools } from "@/lib/analysis";
import { toast } from "sonner";


interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  type?: "text" | "table" | "advice";
  data?: any;
}

type ActiveFeature = "chat" | "import" | "query" | "share" | "analysis" | "plan" | "document";

interface MenuItem {
  icon: React.ElementType;
  label: string;
  feature: ActiveFeature;
  color: string;
}

const menuItems: { group: string; items: MenuItem[] }[] = [
  {
    group: "AI成绩管理",
    items: [
      { icon: Upload, label: "导入成绩", feature: "import", color: "text-blue-600" },
      { icon: BarChart3, label: "成绩查询与建议", feature: "query", color: "text-emerald-600" },
      { icon: FileText, label: "分享报告", feature: "share", color: "text-purple-600" },
      { icon: TrendingUp, label: "成绩分析", feature: "analysis", color: "text-amber-600" },
    ],
  },
  {
    group: "AI教案",
    items: [
      { icon: BookOpen, label: "生成教案", feature: "plan", color: "text-rose-600" },
    ],
  },
  {
    group: "AI训练总结",
    items: [
      { icon: FileText, label: "生成总结报告", feature: "document", color: "text-cyan-600" },
    ],
  },
];

// ============ 导入成绩面板 ============
function ImportPanel({ onClose }: { onClose: () => void }) {
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("tijiaobao_scores");
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setStudents(data);
      } catch (e) {
        console.error("加载数据失败", e);
      }
    }
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const records = await parseExcelFile(file);
      // 计算成绩
      records.forEach(r => calculateScores(r));
      setStudents(records);
      localStorage.setItem("tijiaobao_scores", JSON.stringify(records));
      toast.success(`成功导入 ${records.length} 条学生记录`);
    } catch (error) {
      toast.error(`导入失败: ${error instanceof Error ? error.message : "未知错误"}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearData = () => {
    if (confirm("确定要清空所有数据吗？")) {
      setStudents([]);
      localStorage.removeItem("tijiaobao_scores");
      toast.success("数据已清空");
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4 px-2">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Upload className="w-5 h-5 text-blue-600" />
          导入成绩
          {students.length > 0 && (
            <span className="text-sm font-normal text-slate-500">({students.length} 条记录)</span>
          )}
        </h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {students.length === 0 ? (
        <>
          <div
            className="flex-1 border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-blue-500 hover:bg-blue-50/30 transition-colors cursor-pointer flex flex-col items-center justify-center"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              disabled={isLoading}
              className="hidden"
            />
            {isLoading ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />
                <p className="text-xl font-medium text-slate-700">正在处理...</p>
              </div>
            ) : (
              <>
                <Upload className="w-16 h-16 text-slate-400 mb-4" />
                <p className="text-xl font-medium text-slate-700 mb-2">点击或拖拽上传文件</p>
                <p className="text-sm text-slate-500">支持 Excel (.xlsx, .xls) 和 CSV 格式</p>
              </>
            )}
          </div>
          <div className="mt-4 p-4 bg-slate-50 rounded-lg">
            <h4 className="font-medium text-sm text-slate-700 mb-2">导入说明：</h4>
            <ul className="text-sm text-slate-500 space-y-1">
              <li>• Excel 文件需包含：姓名、班级、性别、各项目成绩等列</li>
              <li>• 支持批量导入多个学生成绩</li>
              <li>• 导入后会自动换算国家体质健康标准</li>
            </ul>
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4 px-2">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              已导入 {students.length} 条记录
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                <Upload className="w-4 h-4 mr-1" />
                重新导入
              </Button>
              <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} className="hidden" />
              <Button variant="outline" size="sm" onClick={() => exportToExcel(students)}>
                <Download className="w-4 h-4 mr-1" />
                导出
              </Button>
              <Button variant="destructive" size="sm" onClick={handleClearData}>
                <Trash2 className="w-4 h-4 mr-1" />
                清空
              </Button>
            </div>
          </div>

          {/* 成绩表格 */}
          <div className="flex-1 rounded-lg border bg-white overflow-hidden">
            <div className="overflow-auto h-full">
              <table className="w-full text-xs">
                <thead className="bg-slate-100 sticky top-0">
                  <tr>
                    <th className="px-2 py-2 text-left font-semibold whitespace-nowrap">姓名</th>
                    <th className="px-2 py-2 text-left font-semibold whitespace-nowrap">班级</th>
                    <th className="px-2 py-2 text-center font-semibold whitespace-nowrap">性别</th>
                    <th className="px-2 py-2 text-center font-semibold bg-orange-50 whitespace-nowrap">长跑/游泳</th>
                    <th className="px-2 py-2 text-center font-semibold bg-orange-50 whitespace-nowrap">长跑得分</th>
                    <th className="px-2 py-2 text-center font-semibold bg-blue-50 whitespace-nowrap">球类</th>
                    <th className="px-2 py-2 text-center font-semibold bg-blue-50 whitespace-nowrap">球类得分</th>
                    <th className="px-2 py-2 text-center font-semibold bg-green-50 whitespace-nowrap">选考1</th>
                    <th className="px-2 py-2 text-center font-semibold bg-green-50 whitespace-nowrap">选考1得分</th>
                    <th className="px-2 py-2 text-center font-semibold bg-green-50 whitespace-nowrap">选考2</th>
                    <th className="px-2 py-2 text-center font-semibold bg-green-50 whitespace-nowrap">选考2得分</th>
                    <th className="px-2 py-2 text-center font-semibold bg-primary text-white whitespace-nowrap">总分(40)</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s, i) => {
                    const longProject = s.swim ? "游泳" : (s.longrun ? (s.gender === "男" ? "1000米" : "800米") : "-");
                    const ballProject = s.football ? "足球" : (s.basketball ? "篮球" : (s.volleyball ? "排球" : "-"));
                    const select1 = s.selectedProjects?.[0];
                    const select2 = s.selectedProjects?.[1];

                    return (
                      <tr key={i} className="border-t hover:bg-slate-50">
                        <td className="px-2 py-2 font-medium whitespace-nowrap">{s.name}</td>
                        <td className="px-2 py-2 text-slate-600 whitespace-nowrap">{s.class || "-"}</td>
                        <td className="px-2 py-2 text-center whitespace-nowrap">{s.gender}</td>
                        <td className="px-2 py-2 text-center whitespace-nowrap">{s.longrun || s.swim || "-"}</td>
                        <td className="px-2 py-2 text-center font-semibold bg-orange-50 whitespace-nowrap">{s.longContrib || "-"}</td>
                        <td className="px-2 py-2 text-center whitespace-nowrap">{s.football || s.basketball || s.volleyball || "-"}</td>
                        <td className="px-2 py-2 text-center font-semibold bg-blue-50 whitespace-nowrap">{s.ballContrib || "-"}</td>
                        <td className="px-2 py-2 text-center whitespace-nowrap">{select1 ? `${select1.name}: ${s.run50 || s.situp || s.ball || s.rope || s.pullup || s.jump || "-"}` : "-"}</td>
                        <td className="px-2 py-2 text-center font-semibold bg-green-50 whitespace-nowrap">{select1?.contrib || "-"}</td>
                        <td className="px-2 py-2 text-center whitespace-nowrap">{select2 ? `${select2.name}: ${s.run50 || s.situp || s.ball || s.rope || s.pullup || s.jump || "-"}` : "-"}</td>
                        <td className="px-2 py-2 text-center font-semibold bg-green-50 whitespace-nowrap">{select2?.contrib || "-"}</td>
                        <td className="px-2 py-2 text-center font-bold text-primary text-sm whitespace-nowrap">{s.total40 || "-"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ============ 成绩查询面板 ============
function QueryPanel({ onClose, onAnalysis }: { onClose: () => void; onAnalysis: (student: StudentRecord) => void }) {
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentRecord[]>([]);
  const [queryType, setQueryType] = useState<"all" | "grade" | "class" | "name">("name");
  const [selectedSchool, setSelectedSchool] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [searchName, setSearchName] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<StudentRecord | null>(null);



  // 统计分析数据
  const stats = (() => {
    if (filteredStudents.length === 0) return null;
    const totals = filteredStudents.map(s => parseFloat(s.total40 || "0"));
    const count = filteredStudents.length;
    const avgTotal = (totals.reduce((a, b) => a + b, 0) / count).toFixed(1);
    const excellentCount = totals.filter(t => t >= 36).length;
    const passCount = totals.filter(t => t >= 30).length;
    const lowCount = totals.filter(t => t < 20).length;
    const fullCount = totals.filter(t => t >= 40).length;
    
    // 长跑/游泳统计
    const longScores = filteredStudents.map(s => parseFloat(s.longContrib || "0")).filter(s => s > 0);
    const avgLong = longScores.length > 0 ? (longScores.reduce((a, b) => a + b, 0) / longScores.length).toFixed(1) : "0";
    const longFull = longScores.filter(s => s >= 15).length;
    
    // 球类统计
    const ballScores = filteredStudents.map(s => parseFloat(s.ballContrib || "0")).filter(s => s > 0);
    const avgBall = ballScores.length > 0 ? (ballScores.reduce((a, b) => a + b, 0) / ballScores.length).toFixed(1) : "0";
    const ballFull = ballScores.filter(s => s >= 9).length;
    
    // 选考统计
    const selectScores = filteredStudents.map(s => parseFloat(s.selectContrib || "0")).filter(s => s > 0);
    const avgSelect = selectScores.length > 0 ? (selectScores.reduce((a, b) => a + b, 0) / selectScores.length).toFixed(1) : "0";
    const selectFull = selectScores.filter(s => s >= 16).length;
    
    return {
      count,
      avgTotal,
      excellentCount,
      excellentRate: ((excellentCount / count) * 100).toFixed(1),
      passCount,
      passRate: ((passCount / count) * 100).toFixed(1),
      lowCount,
      lowRate: ((lowCount / count) * 100).toFixed(1),
      fullCount,
      fullRate: ((fullCount / count) * 100).toFixed(1),
      avgLong,
      longFull,
      avgBall,
      ballFull,
      avgSelect,
      selectFull,
      maxTotal: Math.max(...totals),
      minTotal: Math.min(...totals),
    };
  })();

  useEffect(() => {
    const saved = localStorage.getItem("tijiaobao_scores");
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setStudents(data);
        setFilteredStudents(data);
      } catch (e) {
        console.error("加载数据失败", e);
      }
    }
  }, []);

  useEffect(() => {
    let filtered = students;
    // 按学校筛选
    if (selectedSchool) {
      filtered = filtered.filter((s) => s.school?.toLowerCase() === selectedSchool.toLowerCase());
    }
    if (queryType === "grade" && selectedGrade) {
      filtered = filtered.filter((s) => s.grade?.toLowerCase() === selectedGrade.toLowerCase());
    } else if (queryType === "class" && selectedClass) {
      filtered = filtered.filter((s) => s.class?.toLowerCase() === selectedClass.toLowerCase());
    } else if (queryType === "name" && searchName) {
      const q = searchName.toLowerCase();
      filtered = filtered.filter((s) => s.name?.toLowerCase().includes(q));
    }
    setFilteredStudents(filtered);
  }, [students, selectedSchool, queryType, selectedGrade, selectedClass, searchName]);

  const schools = getUniqueSchools(students);
  const grades = getUniqueGrades(students);
  const classes = getUniqueClasses(students);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4 px-2">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-emerald-600" />
          成绩查询与建议
        </h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* 查询条件 */}
      <div className="flex gap-2 mb-4">
        <select
          value={queryType}
          onChange={(e) => {
            setQueryType(e.target.value as any);
            setSelectedGrade("");
            setSelectedClass("");
            setSearchName("");
          }}
          className="px-3 py-2 border rounded-lg bg-white text-sm"
        >
          <option value="name">按姓名</option>
          <option value="grade">按年段</option>
          <option value="class">按班级</option>
          <option value="all">全部</option>
        </select>
        {/* 学校选择器 - 始终显示 */}
        <select
          value={selectedSchool}
          onChange={(e) => setSelectedSchool(e.target.value)}
          className="flex-1 px-3 py-2 border rounded-lg bg-white text-sm"
        >
          <option value="">-- 选择学校 --</option>
          {schools.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        {queryType === "name" && (
          <Input
            placeholder="输入学生姓名..."
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            className="flex-1"
          />
        )}
        {queryType === "grade" && (
          <select
            value={selectedGrade}
            onChange={(e) => setSelectedGrade(e.target.value)}
            className="flex-1 px-3 py-2 border rounded-lg bg-white text-sm"
          >
            <option value="">-- 选择年段 --</option>
            {grades.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        )}
        {queryType === "class" && (
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="flex-1 px-3 py-2 border rounded-lg bg-white text-sm"
          >
            <option value="">-- 选择班级 --</option>
            {classes.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        )}
      </div>

      {/* 查询结果 */}
      {students.length === 0 ? (
        <div className="flex-1 text-center py-12 text-slate-400">
          <Search className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg">暂无学生数据</p>
          <p className="text-sm mt-1">请先在「导入成绩」中上传数据</p>
        </div>
      ) : (
        <>
          {/* 统计汇总卡片 */}
          {stats && filteredStudents.length > 0 && (
            <div className="mb-4 p-4 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl text-white">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold">{stats.count}</div>
                  <div className="text-xs opacity-80">总人数</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold">{stats.avgTotal}</div>
                  <div className="text-xs opacity-80">平均分(40分)</div>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2 mt-3 pt-3 border-t border-white/20">
                <div className="text-center">
                  <div className="text-lg font-bold">{stats.excellentRate}%</div>
                  <div className="text-xs opacity-80">优秀率</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold">{stats.passRate}%</div>
                  <div className="text-xs opacity-80">及格率</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold">{stats.lowRate}%</div>
                  <div className="text-xs opacity-80">低分率</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold">{stats.fullCount}</div>
                  <div className="text-xs opacity-80">满分人数</div>
                </div>
              </div>
            </div>
          )}

          <div className="text-sm text-slate-500 mb-2">找到 {filteredStudents.length} 条记录</div>
          <div className="flex-1 rounded-lg border bg-white overflow-hidden">
            <div className="overflow-auto h-full">
              <table className="w-full text-xs">
                <thead className="bg-slate-100 sticky top-0">
                  <tr>
                    <th className="px-2 py-2 text-left font-semibold whitespace-nowrap">姓名</th>
                    <th className="px-2 py-2 text-left font-semibold whitespace-nowrap">班级</th>
                    <th className="px-2 py-2 text-center font-semibold whitespace-nowrap">性别</th>
                    <th className="px-2 py-2 text-center font-semibold bg-orange-50 whitespace-nowrap">长跑/游泳</th>
                    <th className="px-2 py-2 text-center font-semibold bg-orange-50 whitespace-nowrap">长跑得分</th>
                    <th className="px-2 py-2 text-center font-semibold bg-blue-50 whitespace-nowrap">球类</th>
                    <th className="px-2 py-2 text-center font-semibold bg-blue-50 whitespace-nowrap">球类得分</th>
                    <th className="px-2 py-2 text-center font-semibold bg-green-50 whitespace-nowrap">选考1</th>
                    <th className="px-2 py-2 text-center font-semibold bg-green-50 whitespace-nowrap">选考1得分</th>
                    <th className="px-2 py-2 text-center font-semibold bg-green-50 whitespace-nowrap">选考2</th>
                    <th className="px-2 py-2 text-center font-semibold bg-green-50 whitespace-nowrap">选考2得分</th>
                    <th className="px-2 py-2 text-center font-semibold bg-primary text-white whitespace-nowrap">总分(40)</th>
                    <th className="px-2 py-2 text-center font-semibold whitespace-nowrap">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={13} className="text-center py-8 text-slate-400">没有找到匹配的学生</td>
                    </tr>
                  ) : (
                    filteredStudents.map((s, i) => {
                      const longProject = s.swim ? "游泳" : (s.longrun ? (s.gender === "男" ? "1000米" : "800米") : "-");
                      const ballProject = s.football ? "足球" : (s.basketball ? "篮球" : (s.volleyball ? "排球" : "-"));
                      const select1 = s.selectedProjects?.[0];
                      const select2 = s.selectedProjects?.[1];

                      // 获取选考项目的原始成绩
                      const getSelectRaw = (proj: any) => {
                        if (!proj) return "-";
                        if (proj.name?.includes("50米")) return s.run50;
                        if (proj.name?.includes("仰卧")) return s.situp;
                        if (proj.name?.includes("实心球")) return s.ball;
                        if (proj.name?.includes("跳绳")) return s.rope;
                        if (proj.name?.includes("引体")) return s.pullup;
                        if (proj.name?.includes("立定跳远")) return s.jump;
                        return "-";
                      };

                      return (
                        <tr key={i} className="border-t hover:bg-slate-50">
                          <td className="px-2 py-2 font-medium whitespace-nowrap">{s.name}</td>
                          <td className="px-2 py-2 text-slate-600 whitespace-nowrap">{s.class || "-"}</td>
                          <td className="px-2 py-2 text-center whitespace-nowrap">{s.gender}</td>
                          <td className="px-2 py-2 text-center whitespace-nowrap">{s.longrun || s.swim || "-"}</td>
                          <td className="px-2 py-2 text-center font-semibold bg-orange-50 whitespace-nowrap">{s.longContrib || "-"}</td>
                          <td className="px-2 py-2 text-center whitespace-nowrap">{s.football || s.basketball || s.volleyball || "-"}</td>
                          <td className="px-2 py-2 text-center font-semibold bg-blue-50 whitespace-nowrap">{s.ballContrib || "-"}</td>
                          <td className="px-2 py-2 text-center whitespace-nowrap">{select1 ? `${select1.name}: ${getSelectRaw(select1)}` : "-"}</td>
                          <td className="px-2 py-2 text-center font-semibold bg-green-50 whitespace-nowrap">{select1?.contrib || "-"}</td>
                          <td className="px-2 py-2 text-center whitespace-nowrap">{select2 ? `${select2.name}: ${getSelectRaw(select2)}` : "-"}</td>
                          <td className="px-2 py-2 text-center font-semibold bg-green-50 whitespace-nowrap">{select2?.contrib || "-"}</td>
                          <td className="px-2 py-2 text-center font-bold text-primary whitespace-nowrap">{s.total40 || "-"}</td>
                          <td className="px-2 py-2 text-center whitespace-nowrap">
                            <div className="flex gap-1 justify-center">
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* 学生详情弹窗 */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedStudent(null)}>
          <div className="bg-white rounded-xl p-6 max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">{selectedStudent.name}</h3>
              <Button variant="ghost" size="sm" onClick={() => setSelectedStudent(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b">
                <span className="text-slate-500">班级</span>
                <span className="font-medium">{selectedStudent.class || "-"}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-slate-500">性别</span>
                <span className="font-medium">{selectedStudent.gender}</span>
              </div>

              {/* 长跑/游泳 */}
              <div className="p-3 bg-orange-50 rounded-lg">
                <div className="font-semibold text-orange-700 mb-2">🏃 长跑/游泳</div>
                <div className="flex justify-between">
                  <span className="text-slate-500">原始成绩</span>
                  <span>{selectedStudent.longrun || selectedStudent.swim || "-"}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>贡献分</span>
                  <span className="text-orange-600">{selectedStudent.longContrib || "0"}/15</span>
                </div>
              </div>

              {/* 球类 */}
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="font-semibold text-blue-700 mb-2">⚽ 球类</div>
                <div className="flex justify-between">
                  <span className="text-slate-500">原始成绩</span>
                  <span>{selectedStudent.football || selectedStudent.basketball || selectedStudent.volleyball || "-"}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>贡献分</span>
                  <span className="text-blue-600">{selectedStudent.ballContrib || "0"}/9</span>
                </div>
              </div>

              {/* 选考项目 */}
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="font-semibold text-green-700 mb-2">🎯 选考项目</div>
                {selectedStudent.selectedProjects?.map((p, i) => (
                  <div key={i} className="flex justify-between">
                    <span className="text-slate-500">{p.name}</span>
                    <span className="font-semibold text-green-600">{p.contrib}/8</span>
                  </div>
                ))}
                <div className="flex justify-between font-semibold mt-2 pt-2 border-t border-green-200">
                  <span>选考总分</span>
                  <span className="text-green-600">{selectedStudent.selectContrib || "0"}/16</span>
                </div>
              </div>

              {/* 总分 */}
              <div className="p-4 bg-primary/10 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">体质测试总分</span>
                  <span className="text-3xl font-bold text-primary">{selectedStudent.total40 || "0"}/40</span>
                </div>
              </div>


            </div>
          </div>
        </div>
      )}


    </div>
  );
}

// ============ 分享报告面板 ============
function SharePanel({ onClose }: { onClose: () => void }) {
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [reportData, setReportData] = useState<any>(null);

  useEffect(() => {
    const saved = localStorage.getItem("tijiaobao_scores");
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setStudents(data);
        calculateReport(data);
      } catch (e) {
        console.error("加载数据失败", e);
      }
    }
  }, []);

  function calculateReport(data: StudentRecord[]) {
    if (data.length === 0) return;

    const totals = data.map(s => parseFloat(s.total40 || "0"));
    const longScores = data.map(s => parseFloat(s.longContrib || "0")).filter(s => s > 0);
    const ballScores = data.map(s => parseFloat(s.ballContrib || "0")).filter(s => s > 0);
    const selectScores = data.map(s => parseFloat(s.selectContrib || "0")).filter(s => s > 0);

    // 计算统计
    const avgTotal = (totals.reduce((a, b) => a + b, 0) / totals.length).toFixed(2);
    const avgLong = longScores.length > 0 ? (longScores.reduce((a, b) => a + b, 0) / longScores.length).toFixed(2) : "0";
    const avgBall = ballScores.length > 0 ? (ballScores.reduce((a, b) => a + b, 0) / ballScores.length).toFixed(2) : "0";
    const avgSelect = selectScores.length > 0 ? (selectScores.reduce((a, b) => a + b, 0) / selectScores.length).toFixed(2) : "0";

    // 等级统计
    const excellentCount = totals.filter(t => t >= 36).length; // 36分以上（90%）优秀
    const goodCount = totals.filter(t => t >= 30 && t < 36).length; // 30-36分良好
    const passCount = totals.filter(t => t >= 20 && t < 30).length; // 20-30分及格
    const failCount = totals.filter(t => t < 20).length; // 20分以下不及格

    // 满分人数
    const fullScoreCount = totals.filter(t => t >= 40).length;

    // 各项满分人数
    const longFullCount = longScores.filter(s => s >= 15).length;
    const ballFullCount = ballScores.filter(s => s >= 9).length;
    const selectFullCount = selectScores.filter(s => s >= 16).length;

    setReportData({
      total: data.length,
      avgTotal,
      avgLong,
      avgBall,
      avgSelect,
      excellentCount,
      excellentRate: ((excellentCount / data.length) * 100).toFixed(1),
      goodCount,
      goodRate: ((goodCount / data.length) * 100).toFixed(1),
      passCount,
      passRate: ((passCount / data.length) * 100).toFixed(1),
      failCount,
      failRate: ((failCount / data.length) * 100).toFixed(1),
      fullScoreCount,
      fullScoreRate: ((fullScoreCount / data.length) * 100).toFixed(1),
      longFullCount,
      ballFullCount,
      selectFullCount,
      maxTotal: Math.max(...totals),
      minTotal: Math.min(...totals),
    });
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4 px-2">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <FileText className="w-5 h-5 text-purple-600" />
          成绩统计分析报告
        </h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {students.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-slate-400">
          <div className="text-center">
            <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">暂无学生数据</p>
            <p className="text-sm mt-1">请先在「导入成绩」中上传数据</p>
          </div>
        </div>
      ) : reportData ? (
        <div className="flex-1 overflow-y-auto space-y-4">
          {/* 总体概览 */}
          <div className="p-4 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl text-white">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-4xl font-bold">{reportData.total}</div>
                <div className="text-sm opacity-80">学生总数</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold">{reportData.avgTotal}</div>
                <div className="text-sm opacity-80">总分平均分</div>
              </div>
            </div>
          </div>

          {/* 各项目平均分 */}
          <div className="p-4 bg-slate-50 rounded-xl">
            <h4 className="font-semibold text-slate-700 mb-3">📊 各项目平均分</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{reportData.avgLong}</div>
                <div className="text-xs text-slate-500">长跑/游泳</div>
                <div className="text-xs text-orange-500">满分15分</div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{reportData.avgBall}</div>
                <div className="text-xs text-slate-500">球类</div>
                <div className="text-xs text-blue-500">满分9分</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{reportData.avgSelect}</div>
                <div className="text-xs text-slate-500">选考项目</div>
                <div className="text-xs text-green-500">满分16分</div>
              </div>
            </div>
          </div>

          {/* 等级分布 */}
          <div className="p-4 bg-slate-50 rounded-xl">
            <h4 className="font-semibold text-slate-700 mb-3">🏆 等级分布（满分40分）</h4>
            <div className="grid grid-cols-4 gap-2">
              <div className="text-center p-2 bg-green-100 rounded-lg">
                <div className="text-xl font-bold text-green-600">{reportData.excellentCount}</div>
                <div className="text-xs text-green-600">优秀(≥36)</div>
                <div className="text-xs text-green-500">{reportData.excellentRate}%</div>
              </div>
              <div className="text-center p-2 bg-blue-100 rounded-lg">
                <div className="text-xl font-bold text-blue-600">{reportData.goodCount}</div>
                <div className="text-xs text-blue-600">良好(30-36)</div>
                <div className="text-xs text-blue-500">{reportData.goodRate}%</div>
              </div>
              <div className="text-center p-2 bg-amber-100 rounded-lg">
                <div className="text-xl font-bold text-amber-600">{reportData.passCount}</div>
                <div className="text-xs text-amber-600">及格(20-30)</div>
                <div className="text-xs text-amber-500">{reportData.passRate}%</div>
              </div>
              <div className="text-center p-2 bg-red-100 rounded-lg">
                <div className="text-xl font-bold text-red-600">{reportData.failCount}</div>
                <div className="text-xs text-red-600">待提高(&lt;20)</div>
                <div className="text-xs text-red-500">{reportData.failRate}%</div>
              </div>
            </div>
          </div>

          {/* 满分统计 */}
          <div className="p-4 bg-slate-50 rounded-xl">
            <h4 className="font-semibold text-slate-700 mb-3">⭐ 满分人数统计</h4>
            <div className="grid grid-cols-4 gap-3">
              <div className="text-center p-3 bg-yellow-50 rounded-lg border-2 border-yellow-200">
                <div className="text-2xl font-bold text-yellow-600">{reportData.fullScoreCount}</div>
                <div className="text-xs text-slate-500">总分满分(40分)</div>
                <div className="text-xs text-yellow-500">{reportData.fullScoreRate}%</div>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{reportData.longFullCount}</div>
                <div className="text-xs text-slate-500">长跑/游泳满分</div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{reportData.ballFullCount}</div>
                <div className="text-xs text-slate-500">球类满分</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{reportData.selectFullCount}</div>
                <div className="text-xs text-slate-500">选考满分</div>
              </div>
            </div>
          </div>

          {/* 最高最低分 */}
          <div className="p-4 bg-slate-50 rounded-xl">
            <h4 className="font-semibold text-slate-700 mb-3">📈 成绩区间</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                <Trophy className="w-8 h-8 text-green-500" />
                <div>
                  <div className="text-sm text-slate-500">最高分</div>
                  <div className="text-xl font-bold text-green-600">{reportData.maxTotal} 分</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg">
                <Target className="w-8 h-8 text-amber-500" />
                <div>
                  <div className="text-sm text-slate-500">最低分</div>
                  <div className="text-xl font-bold text-amber-600">{reportData.minTotal} 分</div>
                </div>
              </div>
            </div>
          </div>

          {/* 导出按钮 */}
          <Button
            className="w-full bg-gradient-to-r from-purple-500 to-blue-500 py-6 text-lg"
            onClick={() => {
              const report = `
【体教宝成绩统计分析报告】

一、总体概况
- 学生总数：${reportData.total}人
- 总分平均分：${reportData.avgTotal}分

二、各项目平均分
- 长跑/游泳：${reportData.avgLong}分（满分15分）
- 球类：${reportData.avgBall}分（满分9分）
- 选考项目：${reportData.avgSelect}分（满分16分）

三、等级分布
- 优秀（≥36分）：${reportData.excellentCount}人（${reportData.excellentRate}%）
- 良好（30-36分）：${reportData.goodCount}人（${reportData.goodRate}%）
- 及格（20-30分）：${reportData.passCount}人（${reportData.passRate}%）
- 待提高（<20分）：${reportData.failCount}人（${reportData.failRate}%）

四、满分人数统计
- 总分满分（40分）：${reportData.fullScoreCount}人
- 长跑/游泳满分：${reportData.longFullCount}人
- 球类满分：${reportData.ballFullCount}人
- 选考满分：${reportData.selectFullCount}人

五、成绩区间
- 最高分：${reportData.maxTotal}分
- 最低分：${reportData.minTotal}分
`;
              navigator.clipboard.writeText(report);
              toast.success("报告已复制到剪贴板");
            }}
          >
            <Copy className="w-5 h-5 mr-2" />
            复制统计报告
          </Button>
        </div>
      ) : null}
    </div>
  );
}

// ============ 成绩分析面板 ============
function AnalysisPanel({ onClose }: { onClose: () => void }) {
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [reportData, setReportData] = useState<any>(null);

  useEffect(() => {
    const saved = localStorage.getItem("tijiaobao_scores");
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setStudents(data);
        calculateReport(data);
      } catch (e) {
        console.error("加载数据失败", e);
      }
    }
  }, []);

  function calculateReport(data: StudentRecord[]) {
    if (data.length === 0) return;

    const totals = data.map(s => parseFloat(s.total40 || "0"));
    const longScores = data.map(s => parseFloat(s.longContrib || "0")).filter(s => s > 0);
    const ballScores = data.map(s => parseFloat(s.ballContrib || "0")).filter(s => s > 0);
    const selectScores = data.map(s => parseFloat(s.selectContrib || "0")).filter(s => s > 0);

    // 计算统计
    const avgTotal = (totals.reduce((a, b) => a + b, 0) / totals.length).toFixed(2);
    const avgLong = longScores.length > 0 ? (longScores.reduce((a, b) => a + b, 0) / longScores.length).toFixed(2) : "0";
    const avgBall = ballScores.length > 0 ? (ballScores.reduce((a, b) => a + b, 0) / ballScores.length).toFixed(2) : "0";
    const avgSelect = selectScores.length > 0 ? (selectScores.reduce((a, b) => a + b, 0) / selectScores.length).toFixed(2) : "0";

    // 等级统计
    const excellentCount = totals.filter(t => t >= 36).length;
    const goodCount = totals.filter(t => t >= 30 && t < 36).length;
    const passCount = totals.filter(t => t >= 20 && t < 30).length;
    const failCount = totals.filter(t => t < 20).length;

    // 满分人数
    const fullScoreCount = totals.filter(t => t >= 40).length;
    const longFullCount = longScores.filter(s => s >= 15).length;
    const ballFullCount = ballScores.filter(s => s >= 9).length;
    const selectFullCount = selectScores.filter(s => s >= 16).length;

    setReportData({
      total: data.length,
      avgTotal,
      avgLong,
      avgBall,
      avgSelect,
      excellentCount,
      excellentRate: ((excellentCount / data.length) * 100).toFixed(1),
      goodCount,
      goodRate: ((goodCount / data.length) * 100).toFixed(1),
      passCount,
      passRate: ((passCount / data.length) * 100).toFixed(1),
      failCount,
      failRate: ((failCount / data.length) * 100).toFixed(1),
      fullScoreCount,
      fullScoreRate: ((fullScoreCount / data.length) * 100).toFixed(1),
      longFullCount,
      ballFullCount,
      selectFullCount,
      maxTotal: Math.max(...totals),
      minTotal: Math.min(...totals),
    });
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4 px-2">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-amber-600" />
          成绩分析
        </h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {students.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-slate-400">
          <div className="text-center">
            <TrendingUp className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">暂无学生数据</p>
            <p className="text-sm mt-1">请先在「导入成绩」中上传数据</p>
          </div>
        </div>
      ) : reportData ? (
        <div className="flex-1 overflow-y-auto space-y-4">
          {/* 总体概览 */}
          <div className="p-4 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl text-white">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-4xl font-bold">{reportData.total}</div>
                <div className="text-sm opacity-80">学生总数</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold">{reportData.avgTotal}</div>
                <div className="text-sm opacity-80">总分平均分</div>
              </div>
            </div>
          </div>

          {/* 各项目平均分 */}
          <div className="p-4 bg-slate-50 rounded-xl">
            <h4 className="font-semibold text-slate-700 mb-3">各项目平均分</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{reportData.avgLong}</div>
                <div className="text-xs text-slate-500">长跑/游泳</div>
                <div className="text-xs text-orange-500">满分15分</div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{reportData.avgBall}</div>
                <div className="text-xs text-slate-500">球类</div>
                <div className="text-xs text-blue-500">满分9分</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{reportData.avgSelect}</div>
                <div className="text-xs text-slate-500">选考项目</div>
                <div className="text-xs text-green-500">满分16分</div>
              </div>
            </div>
          </div>

          {/* 等级分布 */}
          <div className="p-4 bg-slate-50 rounded-xl">
            <h4 className="font-semibold text-slate-700 mb-3">等级分布（满分40分）</h4>
            <div className="grid grid-cols-4 gap-2">
              <div className="text-center p-2 bg-green-100 rounded-lg">
                <div className="text-xl font-bold text-green-600">{reportData.excellentCount}</div>
                <div className="text-xs text-green-600">优秀(≥36)</div>
                <div className="text-xs text-green-500">{reportData.excellentRate}%</div>
              </div>
              <div className="text-center p-2 bg-blue-100 rounded-lg">
                <div className="text-xl font-bold text-blue-600">{reportData.goodCount}</div>
                <div className="text-xs text-blue-600">良好(30-36)</div>
                <div className="text-xs text-blue-500">{reportData.goodRate}%</div>
              </div>
              <div className="text-center p-2 bg-amber-100 rounded-lg">
                <div className="text-xl font-bold text-amber-600">{reportData.passCount}</div>
                <div className="text-xs text-amber-600">及格(20-30)</div>
                <div className="text-xs text-amber-500">{reportData.passRate}%</div>
              </div>
              <div className="text-center p-2 bg-red-100 rounded-lg">
                <div className="text-xl font-bold text-red-600">{reportData.failCount}</div>
                <div className="text-xs text-red-600">待提高(&lt;20)</div>
                <div className="text-xs text-red-500">{reportData.failRate}%</div>
              </div>
            </div>
          </div>

          {/* 满分统计 */}
          <div className="p-4 bg-slate-50 rounded-xl">
            <h4 className="font-semibold text-slate-700 mb-3">满分人数统计</h4>
            <div className="grid grid-cols-4 gap-3">
              <div className="text-center p-3 bg-yellow-50 rounded-lg border-2 border-yellow-200">
                <div className="text-2xl font-bold text-yellow-600">{reportData.fullScoreCount}</div>
                <div className="text-xs text-slate-500">总分满分(40分)</div>
                <div className="text-xs text-yellow-500">{reportData.fullScoreRate}%</div>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{reportData.longFullCount}</div>
                <div className="text-xs text-slate-500">长跑/游泳满分</div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{reportData.ballFullCount}</div>
                <div className="text-xs text-slate-500">球类满分</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{reportData.selectFullCount}</div>
                <div className="text-xs text-slate-500">选考满分</div>
              </div>
            </div>
          </div>

          {/* 最高最低分 */}
          <div className="p-4 bg-slate-50 rounded-xl">
            <h4 className="font-semibold text-slate-700 mb-3">成绩区间</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                <Trophy className="w-8 h-8 text-green-500" />
                <div>
                  <div className="text-sm text-slate-500">最高分</div>
                  <div className="text-xl font-bold text-green-600">{reportData.maxTotal} 分</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg">
                <Target className="w-8 h-8 text-amber-500" />
                <div>
                  <div className="text-sm text-slate-500">最低分</div>
                  <div className="text-xl font-bold text-amber-600">{reportData.minTotal} 分</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

// ============ 生成教案面板 ============
function PlanPanel({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<"form" | "result">("form");
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState("");
  const [formData, setFormData] = useState({
    planType: "大单元计划",
    grade: "初一",
    semester: "第一学期",
    unitCount: "3",
    lessonCount: "1",
    subject: "体育",
    mainContent: "",
    focusPoints: "",
    difficultPoints: "",
    target: "",
    extraNotes: "",
  });

  const handleGenerate = async () => {
    if (!formData.mainContent) {
      toast.error("请输入主要教学内容");
      return;
    }
    setLoading(true);

    try {
      const response = await fetch("/api/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `生成${formData.planType}教案：\n年级：${formData.grade}\n学期：${formData.semester}\n教学内容：${formData.mainContent}\n课时数：${formData.lessonCount}课时\n教学重点：${formData.focusPoints || '动作要领'}\n教学难点：${formData.difficultPoints || '技能掌握'}\n教学目标：${formData.target || '掌握基本技能，提高身体素质'}`,
        }),
      });

      const data = await response.json();
      if (data.success && data.plan) {
        setContent(data.plan);
      } else {
        // 模拟生成
        setContent(`【${formData.grade}${formData.subject}${formData.planType}教学计划】

一、${formData.planType}概述

1. ${formData.planType}名称
${formData.mainContent}

2. ${formData.planType}目标
${formData.target || '• 掌握基本运动技能\n• 提高身体素质\n• 培养体育锻炼习惯\n• 发展合作精神'}

3. 课时安排
• 总课时：${formData.lessonCount}课时
• 建议周期：${formData.semester}

二、教学重难点

📍 教学重点
${formData.focusPoints || '• 技术动作的正确性\n• 动作连贯协调\n• 运动安全意识'}

📍 教学难点
${formData.difficultPoints || '• 技能的熟练掌握\n• 动作的规范性\n• 体能的有效提升'}

三、课时分配

| 课时 | 内容 | 重点 |
|------|------|------|
| 1-2 | 基础动作学习 | 建立正确动作表象 |
| 3-4 | 分解动作练习 | 动作要领掌握 |
| 5-6 | 完整动作练习 | 动作连贯协调 |
| 7-8 | 巩固提高训练 | 技能熟练掌握 |
| 9-10 | 综合应用练习 | 实战能力培养 |
| 11-12 | 考核评价 | 技能检测与反馈 |

四、课时教案示例

【第1课时教案】

🏫 教学内容：${formData.mainContent} - 基础动作

🎯 教学目标：
1. 了解本${formData.planType}内容，建立正确动作表象
2. 掌握基础动作要领
3. 培养观察能力和模仿能力

📝 教学过程：

（一）准备部分（8分钟）
1. 课堂常规（2分钟）
   - 集合整队，报告人数
   - 师生问好
   - 宣布本课内容

2. 准备活动（6分钟）
   - 慢跑热身：绕场2圈
   - 徒手操：
     * 头部运动
     * 肩部运动
     * 腰部运动
     * 弓步压腿

（二）基本部分（28分钟）

1. 新课导入（3分钟）
   • 示范正确动作2-3次
   • 讲解动作名称和要领
   • 提问引导思考

2. 分组学习（10分钟）
   • 4-6人一组
   • 组长带领练习
   • 教师巡视指导
   • 及时纠正错误

3. 展示评价（8分钟）
   • 优秀学生示范
   • 互相评价
   • 教师总结点评

4. 巩固练习（7分钟）
   • 分组循环练习
   • 增加练习难度
   • 记录个人进步

（三）结束部分（4分钟）

1. 放松整理（3分钟）
   • 放松操
   • 深呼吸调整

2. 课堂小结（1分钟）
   • 回顾本课重点
   • 布置课后作业
   • 收拾器材

五、教学建议

1. 循序渐进，由简到繁
2. 注重示范，动作规范
3. 分层教学，关注差异
4. 安全第一，预防损伤
5. 及时评价，正向激励

六、考核评价

| 考核项目 | 权重 | 评价标准 |
|----------|------|----------|
| 技能掌握 | 40% | 动作规范、连贯 |
| 体能表现 | 30% | 完成质量 |
| 参与态度 | 20% | 积极性、合作 |
| 进步幅度 | 10% | 前后对比 |

七、资源准备

• 器材：篮球${formData.mainContent.includes('篮球') ? '✓' : ''}、足球${formData.mainContent.includes('足球') ? '✓' : ''}、排球${formData.mainContent.includes('排球') ? '✓' : ''}、跳绳${formData.mainContent.includes('跳绳') ? '✓' : ''}
• 场地：田径场/体育馆
• 教具：挂图、视频、秒表`);
      }
      setStep("result");
    } catch (err) {
      toast.error("生成失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4 px-2">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-rose-600" />
          AI教案生成
        </h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {step === "form" ? (
        <div className="flex-1 overflow-y-auto">
          {/* 教案类型 - 两个按钮 */}
          <div className="mb-4">
            <label className="text-sm font-medium text-slate-700 mb-2 block">教案类型</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({...formData, planType: "大单元计划"})}
                className={`p-4 rounded-xl border-2 transition-all ${formData.planType === "大单元计划" ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:border-blue-300"}`}
              >
                <BookOpen className={`w-6 h-6 mx-auto mb-2 ${formData.planType === "大单元计划" ? "text-blue-500" : "text-slate-400"}`} />
                <p className={`font-semibold text-sm ${formData.planType === "大单元计划" ? "text-blue-600" : "text-slate-700"}`}>大单元计划</p>
              </button>
              <button
                type="button"
                onClick={() => setFormData({...formData, planType: "课时教案"})}
                className={`p-4 rounded-xl border-2 transition-all ${formData.planType === "课时教案" ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:border-blue-300"}`}
              >
                <FileText className={`w-6 h-6 mx-auto mb-2 ${formData.planType === "课时教案" ? "text-blue-500" : "text-slate-400"}`} />
                <p className={`font-semibold text-sm ${formData.planType === "课时教案" ? "text-blue-600" : "text-slate-700"}`}>课时教案</p>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">学科</label>
              <select
                className="w-full px-3 py-2 border rounded-lg bg-white"
                value={formData.subject}
                onChange={(e) => setFormData({...formData, subject: e.target.value})}
              >
                <option value="体育">体育</option>
                <option value="健康教育">健康教育</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">年级</label>
              <select
                className="w-full px-3 py-2 border rounded-lg bg-white"
                value={formData.grade}
                onChange={(e) => setFormData({...formData, grade: e.target.value})}
              >
                <option value="初一">初一</option>
                <option value="初二">初二</option>
                <option value="初三">初三</option>
                <option value="高一">高一</option>
                <option value="高二">高二</option>
                <option value="高三">高三</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">学期</label>
              <select
                className="w-full px-3 py-2 border rounded-lg bg-white"
                value={formData.semester}
                onChange={(e) => setFormData({...formData, semester: e.target.value})}
              >
                <option value="第一学期">第一学期</option>
                <option value="第二学期">第二学期</option>
              </select>
            </div>
            {formData.planType === "大单元计划" && (
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">大单元课时</label>
                <Input type="number" value={formData.unitCount} onChange={(e) => setFormData({...formData, unitCount: e.target.value})} />
              </div>
            )}
            {formData.planType === "课时教案" && (
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">第几课时</label>
                <Input type="number" value={formData.lessonCount} onChange={(e) => setFormData({...formData, lessonCount: e.target.value})} />
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">主要教学内容 *</label>
              <Input
                placeholder="例如：篮球胸前传接球、50米快速跑、武术基础动作"
                value={formData.mainContent}
                onChange={(e) => setFormData({...formData, mainContent: e.target.value})}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">教学重点</label>
              <Textarea
                placeholder="例如：动作要领的掌握、动作连贯协调"
                value={formData.focusPoints}
                onChange={(e) => setFormData({...formData, focusPoints: e.target.value})}
                className="min-h-[60px]"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">教学难点</label>
              <Textarea
                placeholder="例如：技能的熟练掌握、动作的规范性"
                value={formData.difficultPoints}
                onChange={(e) => setFormData({...formData, difficultPoints: e.target.value})}
                className="min-h-[60px]"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">教学目标</label>
              <Textarea
                placeholder="例如：掌握基本技能，提高身体素质"
                value={formData.target}
                onChange={(e) => setFormData({...formData, target: e.target.value})}
                className="min-h-[60px]"
              />
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium text-slate-700 mb-1 block">补充说明</label>
              <Textarea
                placeholder="例如：班级特点、教学设备、安全注意事项等"
                value={formData.extraNotes}
                onChange={(e) => setFormData({...formData, extraNotes: e.target.value})}
                className="min-h-[80px]"
              />
            </div>
          </div>

          <Button
            className="w-full mt-6 bg-gradient-to-r from-blue-500 to-purple-600 py-6 text-lg"
            onClick={handleGenerate}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                AI生成中...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                生成教案
              </>
            )}
          </Button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col">
          <div className="flex-1 p-4 bg-white rounded-lg overflow-y-auto whitespace-pre-line text-sm">
            {content}
          </div>
          <div className="flex gap-2 mt-4">
            <Button variant="outline" className="flex-1" onClick={() => {
              navigator.clipboard.writeText(content);
              toast.success("已复制到剪贴板");
            }}>
              <Copy className="w-4 h-4 mr-2" />
              复制
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => setStep("form")}>
              <RotateCcw className="w-4 h-4 mr-2" />
              重新生成
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============ 文档生成面板 ============
const DOCUMENT_TYPES = [
  { value: "semester-plan", label: "学期教学计划", icon: Calendar, color: "text-blue-500" },
  { value: "team-plan", label: "训练队计划", icon: Trophy, color: "text-amber-500" },
  { value: "semester-summary", label: "学期工作总结", icon: FileText, color: "text-green-500" },
  { value: "competition-summary", label: "比赛活动总结", icon: Target, color: "text-purple-500" },
  { value: "personal-plan", label: "个人训练计划", icon: Users, color: "text-rose-500" },
];

function DocumentPanel({ onClose }: { onClose: () => void }) {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"type" | "form" | "result">("type");

  const currentDocType = DOCUMENT_TYPES.find((t) => t.value === selectedType);

  const FIELDS: Record<string, Array<{key: string; label: string; placeholder: string; required?: boolean}>> = {
    "semester-plan": [
      { key: "schoolGrade", label: "学校/年级", placeholder: "例如：XX小学三年级", required: true },
      { key: "semester", label: "学期", placeholder: "例如：2025-2026学年第二学期", required: true },
      { key: "weekCount", label: "教学周数", placeholder: "例如：18周" },
      { key: "sessionsPerWeek", label: "每周课时", placeholder: "例如：3节" },
      { key: "keyContent", label: "重点教学内容", placeholder: "例如：田径、篮球、跳绳" },
    ],
    "team-plan": [
      { key: "teamType", label: "队伍类型", placeholder: "例如：校篮球队", required: true },
      { key: "memberCount", label: "队员人数", placeholder: "例如：15人" },
      { key: "level", label: "队伍水平", placeholder: "例如：初级/中级/高级" },
      { key: "sessionsPerWeek", label: "每周训练次数", placeholder: "例如：3次" },
      { key: "goal", label: "训练目标", placeholder: "例如：区赛前三名" },
    ],
    "semester-summary": [
      { key: "schoolGrade", label: "学校/年级", placeholder: "例如：XX小学三年级", required: true },
      { key: "semester", label: "学期", placeholder: "例如：2025-2026学年第二学期", required: true },
      { key: "mainContent", label: "主要教学内容", placeholder: "例如：田径、篮球、跳绳" },
      { key: "highlights", label: "教学亮点", placeholder: "例如：校运动会获团体第二名" },
      { key: "problems", label: "存在问题", placeholder: "例如：场地不足" },
    ],
    "competition-summary": [
      { key: "eventName", label: "活动/比赛名称", placeholder: "例如：校运动会", required: true },
      { key: "eventDate", label: "活动日期", placeholder: "例如：2026年4月" },
      { key: "participantCount", label: "参与人数", placeholder: "例如：120人" },
      { key: "resultOverview", label: "成绩概览", placeholder: "例如：获团体总分第二名" },
    ],
    "personal-plan": [
      { key: "name", label: "学生姓名", placeholder: "例如：张三", required: true },
      { key: "gender", label: "性别", placeholder: "例如：男/女", required: true },
      { key: "grade", label: "年级", placeholder: "例如：初三" },
      { key: "targetEvent", label: "目标项目", placeholder: "例如：中考体育1000米" },
      { key: "currentLevel", label: "当前水平", placeholder: "例如：中等偏上" },
    ],
  };

  const handleGenerate = async () => {
    if (!currentDocType) return;

    const fields = FIELDS[selectedType!];
    for (const field of fields) {
      if (field.required && !formData[field.key]?.trim()) {
        toast.error(`请填写"${field.label}"`);
        return;
      }
    }

    setLoading(true);
    try {
      const response = await fetch("/api/generate-document", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: selectedType, formData }),
      });

      const data = await response.json();
      if (data.success && data.content) {
        setContent(data.content);
      } else {
        // 模拟生成
        setContent(`【${currentDocType.label}】

基本信息：
${Object.entries(formData).map(([k, v]) => `• ${k}: ${v}`).join('\n')}

文档内容生成中...
（实际会调用AI生成完整文档）`);
      }
      setStep("result");
      toast.success("文档生成成功");
    } catch (err) {
      toast.error("生成失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4 px-2">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <FileText className="w-5 h-5 text-cyan-600" />
          训练总结报告
        </h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {step === "type" && (
        <div className="grid grid-cols-2 gap-3">
          {DOCUMENT_TYPES.map((type) => (
            <button
              key={type.value}
              onClick={() => {
                setSelectedType(type.value);
                setFormData({});
                setStep("form");
              }}
              className="p-4 rounded-xl border-2 border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 transition-all text-left"
            >
              <type.icon className={`w-8 h-8 ${type.color} mb-3`} />
              <p className="font-semibold">{type.label}</p>
            </button>
          ))}
        </div>
      )}

      {step === "form" && currentDocType && (
        <>
          <div className="flex items-center gap-2 mb-4">
            <Button variant="ghost" size="sm" onClick={() => setStep("type")}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <span className="font-medium">{currentDocType.label}</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-3">
              {FIELDS[selectedType!].map((field) => (
                <div key={field.key}>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  <Input
                    placeholder={field.placeholder}
                    value={formData[field.key] || ""}
                    onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                  />
                </div>
              ))}
            </div>
            <Button
              className="w-full mt-6 bg-gradient-to-r from-blue-500 to-purple-600 py-4"
              onClick={handleGenerate}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  AI生成中...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  生成{currentDocType.label}
                </>
              )}
            </Button>
          </div>
        </>
      )}

      {step === "result" && (
        <div className="flex-1 flex flex-col">
          <div className="flex-1 p-4 bg-white rounded-lg overflow-y-auto whitespace-pre-line text-sm">
            {content}
          </div>
          <div className="flex gap-2 mt-4">
            <Button variant="outline" className="flex-1" onClick={() => {
              navigator.clipboard.writeText(content);
              toast.success("已复制到剪贴板");
            }}>
              <Copy className="w-4 h-4 mr-2" />
              复制
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => setStep("type")}>
              <RotateCcw className="w-4 h-4 mr-2" />
              重新生成
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============ 主组件 ============
export default function Workspace() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeFeature, setActiveFeature] = useState<ActiveFeature>("chat");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "您好！我是体教宝AI助手 👋\n\n我可以帮您：\n• 导入和管理学生成绩\n• 查询和分析成绩数据\n• 生成AI训练建议\n• 创建教案和总结报告\n\n请从左侧选择功能开始！",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedStudentForAnalysis, setSelectedStudentForAnalysis] = useState<StudentRecord | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleMenuClick = (feature: ActiveFeature) => {
    setActiveFeature(feature);
  };

  const handleClosePanel = () => {
    setActiveFeature("chat");
  };

  const handleAnalysisFromStudent = (student: StudentRecord) => {
    setSelectedStudentForAnalysis(student);
    setActiveFeature("analysis");
  };

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const userInput = inputValue;
    setInputValue("");
    setIsLoading(true);

    setTimeout(() => {
      let response = "";
      if (userInput.includes("成绩") || userInput.includes("导入")) {
        response = "关于成绩管理，我来帮您：\n\n点击左侧「导入成绩」上传Excel文件，系统会自动解析并换算体质健康标准。\n\n导入后您可以：\n• 查看学生各项成绩详情\n• 按姓名/班级/年段查询\n• 导出成绩报告";
      } else if (userInput.includes("教案")) {
        response = "我可以帮您生成AI教案！\n\n支持生成：\n• 大单元教案\n• 课时教案\n\n输入教学内容、年级、课时数等信息，即可生成完整的教案。";
      } else if (userInput.includes("建议") || userInput.includes("训练")) {
        response = "点击左侧「AI训练建议」，可以：\n\n• 从查询到的学生成绩生成个性化建议\n• 分析长跑、球类、选考各项表现\n• 获得针对性的训练方案\n\n先在「成绩查询」中找到学生，再生成建议。";
      } else if (userInput.includes("总结") || userInput.includes("报告")) {
        response = "我可以帮您生成各类总结报告：\n\n• 学期教学计划\n• 训练队计划\n• 学期工作总结\n• 比赛活动总结\n• 个人训练计划\n\n点击左侧「生成总结报告」选择类型开始！";
      } else {
        response = "感谢您的提问！我是体教宝AI助手，可以帮您：\n\n📊 导入学生成绩 - 上传Excel自动解析\n📈 成绩查询分析 - 多条件筛选\n💪 AI训练建议 - 基于成绩生成方案\n📝 生成教案 - 智能备课\n📋 各类总结报告 - 一键生成\n\n请从左侧选择功能，或直接描述您的需求！";
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-screen bg-slate-50 flex">
      {/* 左侧功能栏 */}
      <aside
        className={`bg-white border-r border-slate-200 flex flex-col transition-all duration-300 ${
          sidebarCollapsed ? "w-16" : "w-64"
        }`}
      >
        {/* Logo */}
        <div className="p-4 border-b border-slate-200 flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          {!sidebarCollapsed && (
            <div>
              <h1 className="font-bold text-lg text-slate-900">体教宝</h1>
              <p className="text-xs text-slate-500">体育人AI助手</p>
            </div>
          )}
        </div>

        {/* 收起/展开按钮 */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="p-3 border-b border-slate-200 hover:bg-slate-100 transition-colors flex justify-center"
        >
          <PanelLeft className={`w-5 h-5 text-slate-500 transition-transform ${sidebarCollapsed ? "rotate-180" : ""}`} />
        </button>

        {/* 功能菜单 */}
        <nav className="flex-1 overflow-y-auto p-2">
          {menuItems.map((group) => (
            <div key={group.group} className="mb-4">
              {!sidebarCollapsed && (
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-3">
                  {group.group}
                </h3>
              )}
              <div className="space-y-1">
                {group.items.map((item) => (
                  <button
                    key={item.feature}
                    onClick={() => handleMenuClick(item.feature)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-colors ${
                      sidebarCollapsed ? "justify-center" : ""
                    } ${activeFeature === item.feature ? "bg-blue-50" : "hover:bg-slate-100"}`}
                    style={{ color: activeFeature === item.feature ? item.color : undefined }}
                    title={sidebarCollapsed ? item.label : ""}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    {!sidebarCollapsed && <span className="text-slate-700">{item.label}</span>}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* 退出登录 */}
        <div className="p-2 border-t border-slate-200">
          <button
            onClick={() => {
              localStorage.clear();
              window.location.href = "/login";
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ${
              sidebarCollapsed ? "justify-center" : ""
            }`}
            title={sidebarCollapsed ? "退出登录" : ""}
          >
            <ArrowLeft className="w-5 h-5 flex-shrink-0" />
            {!sidebarCollapsed && <span>退出登录</span>}
          </button>
        </div>
      </aside>

      {/* 右侧内容区域 */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* 聊天标题 */}
        <header className="bg-white border-b border-slate-200 px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-lg text-slate-900">AI 助手</h2>
              <p className="text-xs text-slate-500">体育人AI办公助手</p>
            </div>
          </div>
        </header>

        {/* 内容区 */}
        <div className="flex-1 overflow-hidden p-4">
          {activeFeature === "chat" ? (
            /* 聊天模式 */
            <div className="h-full flex flex-col">
              <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-4 ${message.role === "user" ? "flex-row-reverse" : ""}`}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        message.role === "assistant"
                          ? "bg-gradient-to-br from-blue-500 to-purple-600"
                          : "bg-slate-200"
                      }`}
                    >
                      {message.role === "assistant" ? (
                        <Bot className="w-5 h-5 text-white" />
                      ) : (
                        <span className="text-sm font-medium text-slate-600">我</span>
                      )}
                    </div>
                    <div
                      className={`px-5 py-4 rounded-2xl max-w-[85%] ${
                        message.role === "assistant"
                          ? "bg-white border border-slate-200 text-slate-800"
                          : "bg-gradient-to-r from-blue-500 to-purple-600 text-white"
                      }`}
                    >
                      <p className="leading-relaxed whitespace-pre-wrap">{message.content}</p>
                      <p
                        className={`text-xs mt-3 ${
                          message.role === "assistant" ? "text-slate-400" : "text-white/70"
                        }`}
                      >
                        {message.timestamp.toLocaleTimeString("zh-CN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div className="bg-white border border-slate-200 px-5 py-4 rounded-2xl">
                      <div className="flex items-center gap-2 text-slate-500">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm">正在思考...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* 聊天输入框 - 放大版 */}
              <div className="mt-4 bg-white rounded-2xl border border-slate-200 p-3 shadow-sm">
                <div className="flex gap-3">
                  <Textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="输入您的问题或需求... (Enter发送，Shift+Enter换行)"
                    className="flex-1 min-h-[80px] max-h-[160px] resize-none border-0 focus:ring-0 p-0 text-base"
                    disabled={isLoading}
                  />
                  <Button
                    onClick={handleSend}
                    disabled={!inputValue.trim() || isLoading}
                    className="h-auto px-4 bg-gradient-to-r from-blue-500 to-purple-600"
                  >
                    <Send className="w-5 h-5" />
                  </Button>
                </div>
                <div className="flex gap-2 mt-2 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Lightbulb className="w-3 h-3" />
                    快捷提示：成绩/导入/教案/建议/总结
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* 功能面板模式 - 占满整个窗口 */
            <div className="h-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {activeFeature === "import" && <ImportPanel onClose={handleClosePanel} />}
              {activeFeature === "query" && (
                <QueryPanel onClose={handleClosePanel} onAnalysis={handleAnalysisFromStudent} />
              )}
              {activeFeature === "share" && <SharePanel onClose={handleClosePanel} />}
              {activeFeature === "analysis" && (
                <AnalysisPanel onClose={handleClosePanel} />
              )}
              {activeFeature === "plan" && <PlanPanel onClose={handleClosePanel} />}
              {activeFeature === "document" && <DocumentPanel onClose={handleClosePanel} />}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
