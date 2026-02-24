import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

type LoginStep = "initial" | "userType" | "profile";
type UserType = "teacher" | "student" | "parent";

export default function Login() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<LoginStep>("initial");
  const [userType, setUserType] = useState<UserType | null>(null);
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [school, setSchool] = useState("");
  const [grade, setGrade] = useState("");
  const [className, setClassName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const loginMutation = trpc.auth.login.useMutation();

  const handleInitialLogin = async () => {
    if (!name.trim()) {
      toast.error("请输入姓名");
      return;
    }

    setStep("userType");
  };

  const handleUserTypeSelect = (type: UserType) => {
    setUserType(type);
    setStep("profile");
  };

  const handleCompleteProfile = async () => {
    if (!userType) {
      toast.error("请选择用户类型");
      return;
    }

    if (!name.trim()) {
      toast.error("请输入姓名");
      return;
    }

    setIsLoading(true);
    try {
      await loginMutation.mutateAsync({
        name,
        phoneNumber: phoneNumber || undefined,
        userType,
        school: school || undefined,
        grade: grade || undefined,
        className: className || undefined,
      });

      toast.success("登入成功");
      setLocation("/");
    } catch (error) {
      toast.error(`登入失败: ${error instanceof Error ? error.message : "未知错误"}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (step === "initial") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8">
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent mb-2">
                体教宝
              </h1>
              <p className="text-sm text-muted-foreground">现代化体育成绩管理系统</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">姓名</label>
                <Input
                  type="text"
                  placeholder="请输入您的姓名"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-2"
                />
              </div>

              <Button
                onClick={handleInitialLogin}
                disabled={!name.trim()}
                className="w-full"
                size="lg"
              >
                继续
              </Button>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              首次登入无需验证，所有用户可直接登入
            </p>
          </div>
        </Card>
      </div>
    );
  }

  if (step === "userType") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8">
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">选择身份</h2>
              <p className="text-sm text-muted-foreground">请选择您的身份类型</p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => handleUserTypeSelect("teacher")}
                className="w-full p-4 border-2 border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-all text-left"
              >
                <p className="font-semibold text-lg">👨‍🏫 教师</p>
                <p className="text-sm text-muted-foreground">管理学生成绩、生成 AI 建议和教案</p>
              </button>

              <button
                onClick={() => handleUserTypeSelect("student")}
                className="w-full p-4 border-2 border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-all text-left"
              >
                <p className="font-semibold text-lg">👨‍🎓 学生</p>
                <p className="text-sm text-muted-foreground">查看个人成绩和 AI 训练建议</p>
              </button>

              <button
                onClick={() => handleUserTypeSelect("parent")}
                className="w-full p-4 border-2 border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-all text-left"
              >
                <p className="font-semibold text-lg">👨‍👩‍👧 家长</p>
                <p className="text-sm text-muted-foreground">查看孩子的成绩和分析</p>
              </button>
            </div>

            <Button
              variant="outline"
              onClick={() => setStep("initial")}
              className="w-full"
            >
              返回
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (step === "profile") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8">
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">完善信息</h2>
              <p className="text-sm text-muted-foreground">
                {userType === "teacher" && "教师信息"}
                {userType === "student" && "学生信息"}
                {userType === "parent" && "家长信息"}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">姓名</label>
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-2"
                  disabled
                />
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">手机号（可选）</label>
                <Input
                  type="tel"
                  placeholder="请输入手机号"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="mt-2"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">学校</label>
                <Input
                  type="text"
                  placeholder="请输入学校名称"
                  value={school}
                  onChange={(e) => setSchool(e.target.value)}
                  className="mt-2"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">年段</label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="w-full mt-2 px-3 py-2 border border-border rounded-lg bg-white"
                >
                  <option value="">-- 选择年段 --</option>
                  <option value="初一">初一</option>
                  <option value="初二">初二</option>
                  <option value="初三">初三</option>
                  <option value="高一">高一</option>
                  <option value="高二">高二</option>
                  <option value="高三">高三</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">班级</label>
                <Input
                  type="text"
                  placeholder="请输入班级，如：1班、2班"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  className="mt-2"
                />
              </div>
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleCompleteProfile}
                disabled={isLoading}
                className="w-full"
                size="lg"
              >
                {isLoading ? "登入中..." : "完成登入"}
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  setStep("userType");
                  setUserType(null);
                }}
                disabled={isLoading}
                className="w-full"
              >
                返回
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return null;
}
