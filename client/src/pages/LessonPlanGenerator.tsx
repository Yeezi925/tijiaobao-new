/**
 * AI 教案生成器页面
 * 包含聊天界面、课程标准选择、模板上传等功能
 */

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Send, Upload, BookOpen, MessageSquare, Download, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Streamdown } from "streamdown";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface LessonPlan {
  title: string;
  teachingObjectives: string;
  keyPoints: string;
  teachingProcess: string;
  summary: string;
  reflection: string;
  homework: string;
}

export default function LessonPlanGenerator() {
  const [activeTab, setActiveTab] = useState("chat");
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [generatedPlan, setGeneratedPlan] = useState<LessonPlan | null>(null);

  // 表单状态
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("体育");
  const [grade, setGrade] = useState("高一");
  const [selectedStandard, setSelectedStandard] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 查询数据
  const { data: standards } = trpc.lessonPlan.getStandards.useQuery();
  const { data: templates } = trpc.lessonPlan.getTemplates.useQuery();
  const { data: sessions } = trpc.lessonPlan.getSessions.useQuery();

  // Mutations
  const createSessionMutation = trpc.lessonPlan.createSession.useMutation({
    onSuccess: (data: any) => {
      setSessionId(data.id);
      toast.success("会话创建成功");
    },
    onError: (error: any) => {
      toast.error(`错误: ${error.message}`);
    },
  });

  const sendMessageMutation = trpc.lessonPlan.sendMessage.useMutation({
    onSuccess: (data: any) => {
      const newMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, newMessage]);
      setIsLoading(false);
    },
    onError: (error: any) => {
      toast.error(`错误: ${error.message}`);
      setIsLoading(false);
    },
  });

  const generateLessonPlanMutation = trpc.lessonPlan.generateLessonPlan.useMutation({
    onSuccess: (data: any) => {
      setGeneratedPlan(data);
      toast.success("教案生成成功");
      setActiveTab("result");
      setIsLoading(false);
    },
    onError: (error: any) => {
      toast.error(`生成失败: ${error.message}`);
      setIsLoading(false);
    },
  });

  // 自动滚动到最新消息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 创建新会话
  const handleCreateSession = async () => {
    if (!title) {
      toast.error("请输入会话标题");
      return;
    }

    createSessionMutation.mutate({
      title,
      subject,
      grade,
      standardId: selectedStandard ? parseInt(selectedStandard) : undefined,
      templateId: selectedTemplate ? parseInt(selectedTemplate) : undefined,
    });
  };

  // 发送消息
  const handleSendMessage = async () => {
    if (!inputValue.trim() || !sessionId) {
      toast.error("请先创建会话");
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    sendMessageMutation.mutate({
      sessionId,
      message: inputValue,
    });
  };

  // 生成完整教案
  const handleGenerateLessonPlan = async () => {
    if (!sessionId) {
      toast.error("请先创建会话");
      return;
    }

    setIsLoading(true);
    generateLessonPlanMutation.mutate({
      sessionId,
    });
  };

  // 导出教案为 Word
  const handleExportWord = async () => {
    if (!generatedPlan) {
      toast.error("没有可导出的教案");
      return;
    }

    try {
      // 这里可以集成 docx 库来生成 Word 文档
      toast.success("导出功能开发中...");
    } catch (error) {
      toast.error("导出失败");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* 顶部导航 */}
      <header className="bg-white shadow-sm border-b border-border sticky top-0 z-50">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                AI 教案生成器
              </h1>
              <p className="text-sm text-muted-foreground">智能生成教学计划、总结和反思</p>
            </div>
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="container py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="setup" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">设置</span>
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">聊天</span>
            </TabsTrigger>
            <TabsTrigger value="result" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">结果</span>
            </TabsTrigger>
          </TabsList>

          {/* 设置标签页 */}
          <TabsContent value="setup" className="space-y-4">
            <Card className="p-6 bg-white">
              <h2 className="text-2xl font-semibold mb-6">创建教案生成会话</h2>

              <div className="space-y-4">
                {/* 基本信息 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">会话标题</label>
                    <Input
                      placeholder="例如：高一体育 - 篮球基础技能"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">学科</label>
                    <select
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-white"
                    >
                      <option value="体育">体育</option>
                      <option value="语文">语文</option>
                      <option value="数学">数学</option>
                      <option value="英语">英语</option>
                      <option value="其他">其他</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">年级</label>
                    <select
                      value={grade}
                      onChange={(e) => setGrade(e.target.value)}
                      className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-white"
                    >
                      <option value="初一">初一</option>
                      <option value="初二">初二</option>
                      <option value="初三">初三</option>
                      <option value="高一">高一</option>
                      <option value="高二">高二</option>
                      <option value="高三">高三</option>
                    </select>
                  </div>
                </div>

                {/* 课程标准选择 */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">课程标准（可选）</label>
                  <select
                    value={selectedStandard}
                    onChange={(e) => setSelectedStandard(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-white"
                  >
                    <option value="">-- 选择课程标准 --</option>
                    {standards?.map((std: any) => (
                      <option key={std.id} value={std.id.toString()}>
                        {std.name} ({std.grade})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 教案模板选择 */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">教案模板（可选）</label>
                  <select
                    value={selectedTemplate}
                    onChange={(e) => setSelectedTemplate(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-white"
                  >
                    <option value="">-- 选择教案模板 --</option>
                    {templates?.map((tpl: any) => (
                      <option key={tpl.id} value={tpl.id.toString()}>
                        {tpl.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 创建按钮 */}
                <Button
                  onClick={handleCreateSession}
                  disabled={createSessionMutation.isPending || !!sessionId}
                  className="w-full gap-2"
                >
                  {createSessionMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      创建中...
                    </>
                  ) : sessionId ? (
                    "会话已创建"
                  ) : (
                    "创建会话"
                  )}
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* 聊天标签页 */}
          <TabsContent value="chat" className="space-y-4">
            {!sessionId ? (
              <Card className="p-8 bg-white text-center">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <h2 className="text-xl font-semibold mb-2">请先创建会话</h2>
                <p className="text-muted-foreground mb-4">在"设置"标签页中创建新的教案生成会话</p>
                <Button onClick={() => setActiveTab("setup")}>前往设置</Button>
              </Card>
            ) : (
              <Card className="p-6 bg-white flex flex-col h-[600px]">
                {/* 聊天消息区 */}
                <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-4">
                  {messages.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-30" />
                      <p>开始与 AI 讨论教案设计</p>
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            msg.role === "user"
                              ? "bg-primary text-white rounded-br-none"
                              : "bg-secondary text-foreground rounded-bl-none"
                          }`}
                        >
                          <p className="text-sm">{msg.content}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {msg.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* 输入区 */}
                <div className="flex gap-2 pt-4 border-t border-border">
                  <Input
                    placeholder="输入您的教案需求或问题..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    disabled={isLoading}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={isLoading || !inputValue.trim()}
                    size="icon"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>

                {/* 生成按钮 */}
                <Button
                  onClick={handleGenerateLessonPlan}
                  disabled={isLoading}
                  className="w-full mt-4 gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      生成中...
                    </>
                  ) : (
                    "生成完整教案"
                  )}
                </Button>
              </Card>
            )}
          </TabsContent>

          {/* 结果标签页 */}
          <TabsContent value="result" className="space-y-4">
            {!generatedPlan ? (
              <Card className="p-8 bg-white text-center">
                <Download className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <h2 className="text-xl font-semibold mb-2">还没有生成教案</h2>
                <p className="text-muted-foreground mb-4">在聊天界面中点击"生成完整教案"按钮</p>
              </Card>
            ) : (
              <>
                {/* 教案内容 */}
                <Card className="p-6 bg-white">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-semibold">{generatedPlan.title}</h2>
                    <div className="flex gap-2">
                      <Button onClick={handleExportWord} variant="outline" className="gap-2">
                        <Download className="w-4 h-4" />
                        导出 Word
                      </Button>
                      <Button
                        onClick={() => setGeneratedPlan(null)}
                        variant="destructive"
                        className="gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        清空
                      </Button>
                    </div>
                  </div>

                  {/* 教学目标 */}
                  <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h3 className="text-lg font-semibold mb-2 text-blue-600">教学目标</h3>
                    <div className="prose prose-sm max-w-none">
                      <Streamdown>{generatedPlan.teachingObjectives}</Streamdown>
                    </div>
                  </div>

                  {/* 重点难点 */}
                  <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
                    <h3 className="text-lg font-semibold mb-2 text-green-600">重点难点</h3>
                    <div className="prose prose-sm max-w-none">
                      <Streamdown>{generatedPlan.keyPoints}</Streamdown>
                    </div>
                  </div>

                  {/* 教学过程 */}
                  <div className="mb-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <h3 className="text-lg font-semibold mb-2 text-purple-600">教学过程</h3>
                    <div className="prose prose-sm max-w-none">
                      <Streamdown>{generatedPlan.teachingProcess}</Streamdown>
                    </div>
                  </div>

                  {/* 课程总结 */}
                  <div className="mb-6 p-4 bg-orange-50 rounded-lg border border-orange-200">
                    <h3 className="text-lg font-semibold mb-2 text-orange-600">课程总结</h3>
                    <div className="prose prose-sm max-w-none">
                      <Streamdown>{generatedPlan.summary}</Streamdown>
                    </div>
                  </div>

                  {/* 教学反思 */}
                  <div className="mb-6 p-4 bg-pink-50 rounded-lg border border-pink-200">
                    <h3 className="text-lg font-semibold mb-2 text-pink-600">教学反思</h3>
                    <div className="prose prose-sm max-w-none">
                      <Streamdown>{generatedPlan.reflection}</Streamdown>
                    </div>
                  </div>

                  {/* 作业设计 */}
                  <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                    <h3 className="text-lg font-semibold mb-2 text-indigo-600">作业设计</h3>
                    <div className="prose prose-sm max-w-none">
                      <Streamdown>{generatedPlan.homework}</Streamdown>
                    </div>
                  </div>
                </Card>
              </>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
