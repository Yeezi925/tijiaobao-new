import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

type UserType = "teacher" | "student" | "parent";
type LoginStep = "selectRole" | "inputInfo";

export default function Login() {
  const [step, setStep] = useState<LoginStep>("selectRole");
  const [userType, setUserType] = useState<UserType | null>(null);
  const [name, setName] = useState("");
  const [school, setSchool] = useState("");
  const [grade, setGrade] = useState("");
  const [className, setClassName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSelectRole = (role: UserType) => {
    setUserType(role);
    setStep("inputInfo");
  };

  const handleLogin = async () => {
    if (!name.trim()) {
      toast.error("请输入姓名");
      return;
    }

    if (!userType) {
      toast.error("请选择身份");
      return;
    }

    setIsLoading(true);
    try {
      // 保存用户信息到 localStorage
      const userInfo = {
        name,
        userType,
        school: school || "",
        grade: grade || "",
        className: className || "",
        loginTime: new Date().toISOString(),
      };
      localStorage.setItem("userInfo", JSON.stringify(userInfo));

      toast.success("登入成功！");
      
      // 稍伤一下再跳转，确保 localStorage 已保存
      setTimeout(() => {
        // 根据身份跳转到不同的页面
        if (userType === "teacher") {
          window.location.href = "/teacher";
        } else {
          window.location.href = "/student";
        }
      }, 500);
    } catch (error) {
      toast.error(`登入失败: ${error instanceof Error ? error.message : "未知错误"}`);
      setIsLoading(false);
    }
  };

  // 第一步：选择身份
  if (step === "selectRole") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl p-12">
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent mb-2">
                体教宝
              </h1>
              <p className="text-lg text-muted-foreground">现代化体育成绩管理系统</p>
              <p className="text-sm text-muted-foreground mt-2">请选择您的身份</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 教师选项 */}
              <button
                onClick={() => handleSelectRole("teacher")}
                className="p-8 border-2 border-border rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-center group"
              >
                <div className="text-5xl mb-4">👨‍🏫</div>
                <p className="font-bold text-xl mb-2 group-hover:text-blue-600">教师</p>
                <p className="text-sm text-muted-foreground">
                  管理学生成绩、生成AI建议和教案
                </p>
              </button>

              {/* 学生选项 */}
              <button
                onClick={() => handleSelectRole("student")}
                className="p-8 border-2 border-border rounded-lg hover:border-green-500 hover:bg-green-50 transition-all text-center group"
              >
                <div className="text-5xl mb-4">👨‍🎓</div>
                <p className="font-bold text-xl mb-2 group-hover:text-green-600">学生</p>
                <p className="text-sm text-muted-foreground">
                  查看个人成绩和AI训练建议
                </p>
              </button>

              {/* 家长选项 */}
              <button
                onClick={() => handleSelectRole("parent")}
                className="p-8 border-2 border-border rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all text-center group"
              >
                <div className="text-5xl mb-4">👨‍👩‍👧</div>
                <p className="font-bold text-xl mb-2 group-hover:text-purple-600">家长</p>
                <p className="text-sm text-muted-foreground">
                  查看孩子的成绩和分析
                </p>
              </button>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              首次登入无需验证，所有用户可直接登入
            </p>
          </div>
        </Card>
      </div>
    );
  }

  // 第二步：输入信息
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">
              {userType === "teacher" && "教师登入"}
              {userType === "student" && "学生登入"}
              {userType === "parent" && "家长登入"}
            </h2>
            <p className="text-sm text-muted-foreground">请填写您的信息</p>
          </div>

          <div className="space-y-4">
            {/* 姓名输入 */}
            <div>
              <label className="text-sm font-medium text-muted-foreground">姓名 *</label>
              <Input
                type="text"
                placeholder="请输入您的姓名"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-2"
                disabled={isLoading}
              />
            </div>

            {/* 学校输入 */}
            <div>
              <label className="text-sm font-medium text-muted-foreground">学校</label>
              <Input
                type="text"
                placeholder="请输入学校名称"
                value={school}
                onChange={(e) => setSchool(e.target.value)}
                className="mt-2"
                disabled={isLoading}
              />
            </div>

            {/* 年段选择 */}
            <div>
              <label className="text-sm font-medium text-muted-foreground">年段</label>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full mt-2 px-3 py-2 border border-border rounded-lg bg-white disabled:opacity-50"
                disabled={isLoading}
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

            {/* 班级输入 */}
            <div>
              <label className="text-sm font-medium text-muted-foreground">班级</label>
              <Input
                type="text"
                placeholder="请输入班级，如：1班、2班"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                className="mt-2"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-3">
            <Button
              onClick={handleLogin}
              disabled={isLoading || !name.trim()}
              className="w-full"
              size="lg"
            >
              {isLoading ? "登入中..." : "进入系统"}
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                setStep("selectRole");
                setUserType(null);
                setName("");
                setSchool("");
                setGrade("");
                setClassName("");
              }}
              disabled={isLoading}
              className="w-full"
            >
              返回选择身份
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
