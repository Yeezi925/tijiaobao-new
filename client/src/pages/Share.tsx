/**
 * 体教宝 - 分享成绩页面
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StudentRecord } from "@/lib/scoring";
import { getUniqueGrades, getUniqueClasses } from "@/lib/analysis";
import { toast } from "sonner";
import { Share2, Copy, Check, ExternalLink } from "lucide-react";
import { trpc } from "@/lib/trpc";

const STORAGE_KEY = "tijiaobao_scores";

export default function Share() {
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [shareCode, setShareCode] = useState("");
  const [showShareResult, setShowShareResult] = useState(false);
  const [expireOption, setExpireOption] = useState<"7" | "30" | "90" | "never">("7");
  const [shareFilterType, setShareFilterType] = useState<"all" | "grade" | "class">("all");
  const [shareFilterValue, setShareFilterValue] = useState("");

  const grades = getUniqueGrades(students);
  const classes = getUniqueClasses(students);

  // tRPC 创建分享链接
  const createShareLinkMutation = trpc.teacher.createShareLink.useMutation({
    onSuccess: (data) => {
      if (data.shareCode) {
        setShareCode(data.shareCode);
        setShowShareResult(true);
        toast.success(`分享码已生成: ${data.shareCode}`);
      }
    },
    onError: (error) => {
      toast.error(`生成分享码失败: ${error.message}`);
    },
  });

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

  // 生成分享链接
  const handleGenerateShareLink = async () => {
    if (students.length === 0) {
      toast.error("没有数据可分享");
      return;
    }

    setIsLoading(true);
    try {
      let expiresAt: Date | undefined;
      if (expireOption !== "never") {
        const days = parseInt(expireOption);
        expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + days);
      }

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

  const shareUrl = `${window.location.origin}/parent?code=${shareCode}`;

  const copyToClipboard = (text: string, type: "code" | "url") => {
    navigator.clipboard.writeText(text);
    toast.success(type === "code" ? "分享码已复制" : "链接已复制");
  };

  return (
    <div className="p-6 space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">分享成绩</h1>
        <p className="text-muted-foreground mt-1">
          生成分享链接，让家长可以查看学生成绩
        </p>
      </div>

      {/* 分享设置 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            分享设置
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {students.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              请先在「导入/查询」页面导入学生成绩数据
            </div>
          ) : (
            <>
              {/* 分享范围 */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">分享范围</label>
                  <select
                    value={shareFilterType}
                    onChange={(e) => {
                      setShareFilterType(e.target.value as any);
                      setShareFilterValue("");
                    }}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                  >
                    <option value="all">全部学生 ({students.length}人)</option>
                    <option value="grade">按年段</option>
                    <option value="class">按班级</option>
                  </select>
                </div>

                {shareFilterType === "grade" && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1 block">选择年段</label>
                    <select
                      value={shareFilterValue}
                      onChange={(e) => setShareFilterValue(e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                    >
                      <option value="">选择年段</option>
                      {grades.map(grade => (
                        <option key={grade} value={grade}>{grade}</option>
                      ))}
                    </select>
                  </div>
                )}

                {shareFilterType === "class" && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1 block">选择班级</label>
                    <select
                      value={shareFilterValue}
                      onChange={(e) => setShareFilterValue(e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                    >
                      <option value="">选择班级</option>
                      {classes.map(cls => (
                        <option key={cls} value={cls}>{cls}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">过期时间</label>
                  <select
                    value={expireOption}
                    onChange={(e) => setExpireOption(e.target.value as any)}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                  >
                    <option value="7">7天</option>
                    <option value="30">30天</option>
                    <option value="90">90天</option>
                    <option value="never">永久</option>
                  </select>
                </div>
              </div>

              {/* 生成分享码按钮 */}
              <div className="pt-4">
                <Button
                  onClick={handleGenerateShareLink}
                  className="w-full sm:w-auto gap-2"
                  disabled={
                    createShareLinkMutation.isPending ||
                    isLoading ||
                    (shareFilterType !== "all" && !shareFilterValue)
                  }
                >
                  <Share2 className="w-4 h-4" />
                  {createShareLinkMutation.isPending ? "生成中..." : "生成分享链接"}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* 分享结果 */}
      {showShareResult && shareCode && (
        <Card className="border-green-200 bg-green-50/50">
          <CardHeader>
            <CardTitle className="text-green-600 flex items-center gap-2">
              <Check className="h-5 w-5" />
              分享码已生成
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 分享码 */}
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">分享码</label>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={shareCode}
                  className="text-xl font-mono font-bold bg-white"
                />
                <Button
                  onClick={() => copyToClipboard(shareCode, "code")}
                  variant="outline"
                  className="gap-2"
                >
                  <Copy className="w-4 h-4" /> 复制
                </Button>
              </div>
            </div>

            {/* 分享链接 */}
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">分享链接</label>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={shareUrl}
                  className="text-sm bg-white"
                />
                <Button
                  onClick={() => copyToClipboard(shareUrl, "url")}
                  variant="outline"
                  className="gap-2"
                >
                  <Copy className="w-4 h-4" /> 复制
                </Button>
              </div>
            </div>

            {/* 过期时间 */}
            <div className="p-3 bg-white rounded-lg border border-green-200">
              <p className="text-sm text-muted-foreground">有效期</p>
              <p className="font-medium">
                {expireOption === "never" ? "永久有效" : `${expireOption}天后失效`}
              </p>
            </div>

            {/* 使用说明 */}
            <div className="p-4 bg-white rounded-lg border">
              <h4 className="font-semibold mb-2">使用方法</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>复制分享码或链接发送给家长</li>
                <li>家长访问链接或输入分享码</li>
                <li>家长端将显示学生的体育成绩</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 提示 */}
      {students.length > 0 && !showShareResult && (
        <Card className="border-dashed">
          <CardContent className="flex items-center gap-4 py-8">
            <div className="p-3 bg-muted rounded-lg">
              <ExternalLink className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold">生成分享链接</h3>
              <p className="text-sm text-muted-foreground">
                家长可以通过分享码或链接查看学生成绩，无需登录账号
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
