import { Link, useLocation, useNavigate } from 'react-router';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, Upload, BarChart3, Share2, Brain, MessageSquare, Settings, FileText, BookOpen, User, LogOut, Menu, X } from 'lucide-react';

// 导航项配置
const navItems = [
  {
    label: '数据管理',
    icon: Upload,
    children: [
      { label: '导入/查询', path: '/dashboard/import' },
      { label: '数据统计', path: '/dashboard/stats' },
      { label: '分享成绩', path: '/dashboard/share' },
    ],
  },
  {
    label: 'AI 助手',
    icon: Brain,
    children: [
      { label: '训练建议', path: '/dashboard/ai-advice' },
      { label: '教案生成', path: '/dashboard/lesson-plan' },
      { label: '文档生成', path: '/dashboard/document' },
    ],
  },
  {
    label: '沟通',
    icon: MessageSquare,
    children: [
      { label: '微信设置', path: '/dashboard/wechat' },
    ],
  },
];

export default function TopNavLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // 检查当前路径是否激活
  const isActive = (path: string) => location.pathname === path;
  const isParentActive = (item: typeof navItems[0]) =>
    item.children?.some(child => location.pathname === child.path);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 顶部导航栏 - 白色背景，顶部固定 */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo 和主导航 */}
            <div className="flex items-center gap-8">
              {/* Logo */}
              <Link to="/dashboard" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">体</span>
                </div>
                <span className="text-xl font-bold text-slate-800">体教宝</span>
              </Link>

              {/* 桌面端导航 */}
              <nav className="hidden md:flex items-center gap-1">
                {navItems.map((item) => (
                  <DropdownMenu key={item.label}>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className={`flex items-center gap-1.5 px-3 ${
                          isParentActive(item) ? 'bg-slate-100 text-blue-600' : 'text-slate-600'
                        }`}
                      >
                        <item.icon className="w-4 h-4" />
                        {item.label}
                        <ChevronDown className="w-3.5 h-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-48">
                      {item.children?.map((child) => (
                        <DropdownMenuItem
                          key={child.path}
                          onClick={() => navigate(child.path)}
                          className={isActive(child.path) ? 'bg-blue-50 text-blue-600' : ''}
                        >
                          {child.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ))}
              </nav>
            </div>

            {/* 右侧用户信息 */}
            <div className="flex items-center gap-3">
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2 pl-2 pr-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                      </div>
                      <span className="hidden sm:inline text-slate-700">{user.name || user.phone}</span>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col">
                        <span>{user.name || '教师'}</span>
                        <span className="text-xs text-muted-foreground font-normal">
                          {user.role === 'admin' ? '管理员' : user.role === 'parent' ? '家长' : '教师'}
                        </span>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/dashboard')} className="md:hidden">
                      <Upload className="mr-2 h-4 w-4" />
                      仪表盘
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                      <LogOut className="mr-2 h-4 w-4" />
                      退出登录
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button onClick={() => navigate('/login')} size="sm">
                  登录
                </Button>
              )}

              {/* 移动端菜单按钮 */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* 移动端菜单 */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white py-4 px-4">
            <div className="space-y-1">
              {navItems.map((item) => (
                <div key={item.label}>
                  <div className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-500">
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </div>
                  <div className="ml-6 space-y-1">
                    {item.children?.map((child) => (
                      <button
                        key={child.path}
                        onClick={() => {
                          navigate(child.path);
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                          isActive(child.path)
                            ? 'bg-blue-50 text-blue-600'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {child.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* 主内容区 */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}
