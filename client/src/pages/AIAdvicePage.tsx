/**
 * 体教宝 - AI 训练建议页面
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StudentRecord } from "@/lib/scoring";
import AIAdvice from "./AIAdvice";
import { Sparkles } from "lucide-react";

const STORAGE_KEY = "tijiaobao_scores";

export default function AIAdvicePage() {
  const [students, setStudents] = useState<StudentRecord[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setStudents(data);
      } catch (error) {
        console.error("加载数据失败:", error);
      }
    }
  }, []);

  return (
    <div className="p-6 space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI 训练建议</h1>
        <p className="text-muted-foreground mt-1">
          基于学生成绩生成个性化训练建议
        </p>
      </div>

      {students.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">请先在「导入/查询」页面导入学生成绩数据</p>
          </CardContent>
        </Card>
      ) : (
        <AIAdvice students={students} />
      )}
    </div>
  );
}
