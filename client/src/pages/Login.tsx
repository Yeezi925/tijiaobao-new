import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

type UserRole = "teacher" | "parent";

export default function Login() {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  const handleSelectRole = (role: UserRole) => {
    setSelectedRole(role);
    localStorage.setItem("userRole", role);
    
    // 根据角色跳转到不同的页面
    if (role === "teacher") {
      window.location.href = "/workspace";
    } else {
      window.location.href = "/parent";
    }
  };

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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 教师选项 */}
            <button
              onClick={() => handleSelectRole("teacher")}
              className="p-8 border-2 border-border rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-center group"
            >
              <div className="text-6xl mb-4">👨‍🏫</div>
              <p className="font-bold text-2xl mb-2 group-hover:text-blue-600">教师</p>
              <p className="text-sm text-muted-foreground">
                管理学生成绩、生成AI建议和教案
              </p>
            </button>

            {/* 家长选项 */}
            <button
              onClick={() => handleSelectRole("parent")}
              className="p-8 border-2 border-border rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all text-center group"
            >
              <div className="text-6xl mb-4">👨‍👩‍👧</div>
              <p className="font-bold text-2xl mb-2 group-hover:text-purple-600">家长</p>
              <p className="text-sm text-muted-foreground">
                查看孩子的成绩和AI训练建议
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
