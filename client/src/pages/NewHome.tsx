/**
 * 体教宝 - 首页（简洁版）
 * 介绍页 + 登录入口
 */
import { Button } from "@/components/ui/button";
import { ArrowRight, BarChart3, BookOpen, BrainCircuit, Sparkles, Users } from "lucide-react";

export default function NewHome() {
  const features = [
    {
      icon: BarChart3,
      title: "AI成绩管理",
      desc: "导入、换算、查询、分析、分享，一键生成AI训练建议",
    },
    {
      icon: BookOpen,
      title: "AI教案",
      desc: "智能生成体育教案，多种教学模式可选",
    },
    {
      icon: Sparkles,
      title: "AI训练总结",
      desc: "自动生成训练报告，精准分析学生表现",
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* 顶部导航 */}
      <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-slate-100 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900">体教宝</span>
          </div>
          <Button onClick={() => window.location.href = "/login"}>
            登录
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Hero 区域 */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-sm font-medium mb-6">
            <BrainCircuit className="w-4 h-4" />
            体育人AI办公助手
          </div>
          <h1 className="text-5xl font-bold text-slate-900 mb-6 leading-tight">
            智能体育成绩管理
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              让教学更高效
            </span>
          </h1>
          <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            为体育教师打造的AI助手平台，支持成绩智能分析、教案自动生成、训练报告一键导出
          </p>
          <Button
            size="lg"
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            onClick={() => window.location.href = "/login"}
          >
            立即开始
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* 功能介绍 */}
      <section className="py-20 px-6 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-4">核心功能</h2>
          <p className="text-slate-500 text-center mb-12">三大AI能力，助力体育教学</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="bg-white rounded-2xl p-8 text-center hover:shadow-lg transition-shadow"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-500 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 底部 */}
      <footer className="py-8 px-6 border-t border-slate-100">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-slate-400 text-sm">© 2024 体教宝 - 体育人AI办公助手</p>
        </div>
      </footer>
    </div>
  );
}
