/**
 * 体教宝 - 微信设置页面
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { MessageCircle, QrCode } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function WechatSettings() {
  const [wechatId, setWechatId] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const getWechatQuery = trpc.teacher.getWechatId.useQuery();
  const updateWechatMutation = trpc.teacher.updateWechatId.useMutation();

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
    setIsSaving(true);
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
        onSettled: () => {
          setIsSaving(false);
        },
      }
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">微信设置</h1>
        <p className="text-muted-foreground mt-1">
          管理您的微信号，方便家长添加咨询
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 微信设置卡片 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              微信号管理
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">
                微信号
              </label>
              <Input
                placeholder="请输入你的微信号"
                value={wechatId}
                onChange={(e) => setWechatId(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-2">
                家长可通过此微信号添加你进行咨询沟通
              </p>
            </div>
            <Button
              onClick={handleSaveWechat}
              disabled={isSaving || updateWechatMutation.isPending}
              className="w-full"
            >
              {isSaving ? "保存中..." : "保存微信号"}
            </Button>
          </CardContent>
        </Card>

        {/* 使用说明卡片 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              使用说明
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                家长端支持扫描二维码添加教师微信：
              </p>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>在左侧输入你的微信号并保存</li>
                <li>家长端会生成你的微信二维码</li>
                <li>家长扫描二维码添加你的微信</li>
                <li>家长可在应用内提交咨询问题</li>
              </ol>
              <div className="p-4 bg-muted/30 rounded-lg">
                <p className="text-sm font-medium">提示</p>
                <p className="text-xs text-muted-foreground mt-1">
                  建议保存微信号后，家长可以直接复制微信号搜索添加，无需扫码
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 当前状态 */}
      {wechatId && (
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="p-3 bg-green-500/10 rounded-lg">
              <MessageCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold">微信号已设置</h3>
              <p className="text-sm text-muted-foreground">
                当前微信号: <span className="font-mono font-medium">{wechatId}</span>
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
