/**
 * AI 文档生成器页面
 * 支持 5 种文档类型：学期计划、训练计划、学期总结、比赛总结、个人计划
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Loader2, FileText, RotateCcw, Download } from "lucide-react";
import { toast } from "sonner";
import { Streamdown } from "streamdown";

// 文档类型配置
const DOCUMENT_TYPES = [
  {
    value: "semester-plan",
    label: "学期教学计划",
    icon: "📅",
    description: "根据学校、年级、学期等信息生成完整的学期体育教学计划",
    fields: [
      { key: "schoolGrade", label: "学校/年级", placeholder: "例如：XX小学三年级", required: true },
      { key: "classCount", label: "班级数量", placeholder: "例如：4个班" },
      { key: "semester", label: "学期", placeholder: "例如：2025-2026学年第二学期", required: true },
      { key: "weekCount", label: "教学周数", placeholder: "例如：18周" },
      { key: "sessionsPerWeek", label: "每周课时", placeholder: "例如：3节" },
      { key: "keyContent", label: "重点教学内容", placeholder: "例如：田径、篮球、跳绳" },
      { key: "goal", label: "教学目标", placeholder: "例如：提升学生体质健康水平" },
      { key: "note", label: "备注", placeholder: "其他需要说明的信息（选填）", type: "textarea" },
    ],
  },
  {
    value: "team-plan",
    label: "训练队计划",
    icon: "🏆",
    description: "为校队或专项训练队制定训练计划",
    fields: [
      { key: "teamType", label: "队伍类型", placeholder: "例如：校篮球队", required: true },
      { key: "memberCount", label: "队员人数", placeholder: "例如：15人" },
      { key: "level", label: "队伍水平", placeholder: "例如：初级/中级/高级" },
      { key: "period", label: "训练周期", placeholder: "例如：本学期" },
      { key: "sessionsPerWeek", label: "每周训练次数", placeholder: "例如：3次" },
      { key: "goal", label: "训练目标", placeholder: "例如：区赛前三名" },
      { key: "matchDate", label: "目标比赛日期", placeholder: "例如：2026年6月" },
      { key: "note", label: "备注", placeholder: "其他需要说明的信息（选填）", type: "textarea" },
    ],
  },
  {
    value: "semester-summary",
    label: "学期工作总结",
    icon: "📝",
    description: "总结本学期体育教学工作情况",
    fields: [
      { key: "schoolGrade", label: "学校/年级", placeholder: "例如：XX小学三年级", required: true },
      { key: "classCount", label: "班级数量", placeholder: "例如：4个班" },
      { key: "semester", label: "学期", placeholder: "例如：2025-2026学年第二学期", required: true },
      { key: "mainContent", label: "主要教学内容", placeholder: "例如：田径、篮球、跳绳、体测项目训练" },
      { key: "studentPerformance", label: "学生表现概况", placeholder: "例如：大部分学生体测成绩达标" },
      { key: "highlights", label: "教学亮点", placeholder: "例如：校运动会获团体第二名" },
      { key: "problems", label: "存在问题", placeholder: "例如：场地不足，雨天室内课安排困难" },
      { key: "note", label: "备注", placeholder: "其他需要说明的信息（选填）", type: "textarea" },
    ],
  },
  {
    value: "competition-summary",
    label: "比赛活动总结",
    icon: "🏅",
    description: "总结某次比赛或体育活动的参与情况",
    fields: [
      { key: "eventName", label: "活动/比赛名称", placeholder: "例如：校运动会", required: true },
      { key: "eventDate", label: "活动日期", placeholder: "例如：2026年4月" },
      { key: "participantCount", label: "参与人数", placeholder: "例如：120人" },
      { key: "events", label: "比赛项目", placeholder: "例如：100米、跳远、接力赛" },
      { key: "resultOverview", label: "成绩概览", placeholder: "例如：获团体总分第二名" },
      { key: "highlights", label: "亮点/精彩表现", placeholder: "例如：跳绳比赛获年级第一" },
      { key: "weaknesses", label: "不足之处", placeholder: "例如：个别项目训练不够系统" },
      { key: "note", label: "备注", placeholder: "其他需要说明的信息（选填）", type: "textarea" },
    ],
  },
  {
    value: "personal-plan",
    label: "个人训练计划",
    icon: "🏃",
    description: "为学生制定个性化训练计划",
    fields: [
      { key: "name", label: "学生姓名", placeholder: "例如：张三", required: true },
      { key: "gender", label: "性别", placeholder: "例如：男/女", required: true },
      { key: "grade", label: "年级", placeholder: "例如：初三" },
      { key: "currentLevel", label: "当前水平", placeholder: "例如：中等偏上" },
      { key: "targetEvent", label: "目标项目", placeholder: "例如：中考体育1000米" },
      { key: "period", label: "训练周期", placeholder: "例如：本学期" },
      { key: "scores", label: "当前成绩", placeholder: "例如：1000米 4分15秒" },
      { key: "note", label: "备注", placeholder: "其他需要说明的信息（选填）", type: "textarea" },
    ],
  },
] as const;

type DocumentType = (typeof DOCUMENT_TYPES)[number]["value"];
type FormData = Record<string, string>;

export default function DocumentGenerator() {
  const [selectedType, setSelectedType] = useState<DocumentType | null>(null);
  const [formData, setFormData] = useState<FormData>({});
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerated, setIsGenerated] = useState(false);

  const currentType = DOCUMENT_TYPES.find((t) => t.value === selectedType);

  const handleTypeSelect = (typeValue: DocumentType) => {
    setSelectedType(typeValue);
    setFormData({});
    setContent("");
    setTitle("");
    setIsGenerated(false);
  };

  const handleFieldChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    // 如果已生成过，修改字段时清除结果
    if (isGenerated) {
      setContent("");
      setTitle("");
      setIsGenerated(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedType || !currentType) return;

    // 校验必填字段
    for (const field of currentType.fields) {
      if (field.required && !formData[field.key]?.trim()) {
        toast.error(`请填写"${field.label}"`);
        return;
      }
    }

    setIsLoading(true);
    setContent("");
    setTitle("");

    try {
      const response = await fetch("/api/generate-document", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: selectedType,
          formData,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        toast.error(data.error || "生成失败，请稍后重试");
        return;
      }

      setContent(data.content || "");
      setTitle(data.title || "");
      setIsGenerated(true);
      toast.success("文档生成成功");
    } catch (error: any) {
      toast.error(error.message || "网络错误，请稍后重试");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({});
    setContent("");
    setTitle("");
    setIsGenerated(false);
  };

  const handleCopy = () => {
    if (!content) return;
    navigator.clipboard.writeText(content).then(() => {
      toast.success("已复制到剪贴板");
    }).catch(() => {
      toast.error("复制失败");
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">文档生成</h1>
        <p className="text-muted-foreground mt-1">
          选择文档类型，填写基本信息，AI 自动生成专业文档
        </p>
      </div>

      {/* 文档类型选择 */}
      <Card className="p-6 bg-white">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {DOCUMENT_TYPES.map((type) => (
            <button
              key={type.value}
              onClick={() => handleTypeSelect(type.value)}
              className={`p-4 rounded-xl border-2 transition-all text-left hover:shadow-md ${
                selectedType === type.value
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border hover:border-primary/40"
              }`}
            >
              <span className="text-2xl block mb-2">{type.icon}</span>
              <p className="font-semibold text-sm">{type.label}</p>
            </button>
          ))}
        </div>
      </Card>

      {/* 表单区域 */}
      {selectedType && currentType && (
        <Card className="p-6 bg-white">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-2xl">{currentType.icon}</span>
            <div>
              <h3 className="text-lg font-semibold">{currentType.label}</h3>
              <p className="text-sm text-muted-foreground">{currentType.description}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {currentType.fields.map((field) => (
                <div key={field.key} className={field.type === "textarea" ? "sm:col-span-2" : ""}>
                  <label className="text-sm font-medium text-muted-foreground">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  {field.type === "textarea" ? (
                    <Textarea
                      placeholder={field.placeholder}
                      value={formData[field.key] || ""}
                      onChange={(e) => handleFieldChange(field.key, e.target.value)}
                      className="mt-1"
                      rows={3}
                    />
                  ) : (
                    <Input
                      placeholder={field.placeholder}
                      value={formData[field.key] || ""}
                      onChange={(e) => handleFieldChange(field.key, e.target.value)}
                      className="mt-1"
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleGenerate}
                disabled={isLoading}
                className="flex-1 gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    生成中，请稍候...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    生成{currentType.label}
                  </>
                )}
              </Button>
              {(isGenerated || Object.values(formData).some(Boolean)) && (
                <Button onClick={handleReset} variant="outline" className="gap-2">
                  <RotateCcw className="w-4 h-4" />
                  重置
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* 生成结果展示 */}
      {isGenerated && content && (
        <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200 overflow-hidden">
          {/* 结果头部 */}
          <div className="p-6 border-b border-purple-200/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">{title || currentType?.label}</h3>
                  <p className="text-sm text-muted-foreground">
                    AI 生成 · {new Date().toLocaleDateString("zh-CN")}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCopy} variant="outline" size="sm" className="gap-1.5">
                  <Copy className="w-3.5 h-3.5" />
                  复制
                </Button>
              </div>
            </div>
          </div>

          {/* Markdown 内容 */}
          <div className="p-6">
            <div className="prose prose-sm max-w-none bg-white rounded-lg p-6 border border-border shadow-sm">
              <Streamdown>{content}</Streamdown>
            </div>
          </div>
        </Card>
      )}

      {/* 空状态提示 */}
      {!selectedType && !isGenerated && (
        <Card className="p-12 bg-white text-center">
          <FileText className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <h3 className="text-lg font-semibold mb-2 text-muted-foreground">选择文档类型开始</h3>
          <p className="text-sm text-muted-foreground">点击上方卡片选择需要生成的文档类型</p>
        </Card>
      )}
    </div>
  );
}
