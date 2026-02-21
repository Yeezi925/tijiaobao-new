/**
 * AI 训练建议页面
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sparkles, Loader2 } from "lucide-react";
import { StudentRecord } from "@/lib/scoring";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Streamdown } from "streamdown";

export default function AIAdvice({ students }: { students: StudentRecord[] }) {
  const [selectedStudent, setSelectedStudent] = useState<StudentRecord | null>(null);
  const [advice, setAdvice] = useState<string>("");

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

  return (
    <div className="space-y-6">
      {students.length === 0 ? (
        <Card className="p-8 bg-white text-center">
          <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <h2 className="text-xl font-semibold mb-2">AI 训练建议</h2>
          <p className="text-muted-foreground">请先导入学生数据</p>
        </Card>
      ) : (
        <>
          {/* 学生选择 */}
          <Card className="p-6 bg-white">
            <h2 className="text-2xl font-semibold mb-4">选择学生</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {students.map((student, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setSelectedStudent(student);
                    setAdvice("");
                  }}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    selectedStudent?.name === student.name
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <p className="font-semibold">{student.name}</p>
                  <p className="text-sm text-muted-foreground">{student.class}</p>
                  <p className="text-lg font-bold text-primary mt-2">{student.total40}/40分</p>
                </button>
              ))}
            </div>
          </Card>

          {/* 学生详情和生成按钮 */}
          {selectedStudent && (
            <Card className="p-6 bg-white">
              <h2 className="text-2xl font-semibold mb-4">学生详情</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 p-4 bg-secondary/30 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">姓名</p>
                  <p className="text-lg font-semibold">{selectedStudent.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">班级</p>
                  <p className="text-lg font-semibold">{selectedStudent.class}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">性别</p>
                  <p className="text-lg font-semibold">{selectedStudent.gender}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">总分</p>
                  <p className="text-lg font-bold text-primary">{selectedStudent.total40}/40</p>
                </div>
              </div>

              {/* 成绩详情 */}
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
                  <p className="text-xs text-muted-foreground mb-1">选考项目</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {selectedStudent.selectedProjects?.reduce((sum, p) => {
                      const contrib = typeof p.contrib === "string" ? parseFloat(p.contrib) : p.contrib;
                      return sum + (contrib || 0);
                    }, 0) || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">/ 16分</p>
                </div>
              </div>

              {/* 生成按钮 */}
              <Button
                onClick={handleGenerateAdvice}
                disabled={generateAdviceMutation.isPending}
                className="w-full gap-2"
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
            </Card>
          )}

          {/* AI 建议展示 */}
          {advice && (
            <Card className="p-6 bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-purple-600" />
                AI 训练建议
              </h2>
              <div className="prose prose-sm max-w-none bg-white rounded-lg p-4 border border-border">
                <Streamdown>{advice}</Streamdown>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
