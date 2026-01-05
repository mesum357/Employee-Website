import { useState, useEffect } from "react";
import { useNavigate, useLocation, Navigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  Clock, 
  Calendar, 
  MessageSquare, 
  Users, 
  FileText, 
  Settings, 
  Bell,
  Search,
  ChevronLeft,
  LogOut,
  Megaphone,
  Loader2,
  CheckSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { taskAPI, noticeAPI } from "@/lib/api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Attendance", href: "/attendance", icon: Clock },
  { name: "Leave", href: "/leave", icon: Calendar },
  { name: "Notices", href: "/notices", icon: Megaphone },
  { name: "Chat", href: "/chat", icon: MessageSquare },
  { name: "Directory", href: "/directory", icon: Users },
  { name: "Settings", href: "/settings", icon: Settings },
];

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const [pendingTasksCount, setPendingTasksCount] = useState(0);
  const [unreadNoticesCount, setUnreadNoticesCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchPendingTasks();
      fetchUnreadNotices();
      // Refresh every 30 seconds
      const interval = setInterval(() => {
        fetchPendingTasks();
        fetchUnreadNotices();
      }, 30000);
      
      // Listen for refresh events from notices page
      const handleRefresh = () => {
        fetchUnreadNotices();
      };
      window.addEventListener('refreshUnreadNotices', handleRefresh);
      
      return () => {
        clearInterval(interval);
        window.removeEventListener('refreshUnreadNotices', handleRefresh);
      };
    }
  }, [isAuthenticated, user]);

  const fetchPendingTasks = async () => {
    try {
      const response = await taskAPI.getMy("pending");
      const pendingTasks = response.data.data.tasks?.filter(
        (t: any) => t.status === "pending" || t.status === "in-progress"
      ) || [];
      setPendingTasksCount(pendingTasks.length);
    } catch (error) {
      // Silently fail - tasks might not be available
    }
  };

  const fetchUnreadNotices = async () => {
    try {
      const response = await noticeAPI.getAll({ isActive: true });
      const notices = response.data.data.notices || [];
      const userId = user?.id;
      
      // Count notices that haven't been read by current user
      const unreadCount = notices.filter((notice: any) => {
        if (!notice.readBy || notice.readBy.length === 0) return true;
        return !notice.readBy.some((read: any) => {
          const readUserId = typeof read.user === 'object' ? read.user._id : read.user;
          return readUserId?.toString() === userId?.toString();
        });
      }).length;
      
      setUnreadNoticesCount(unreadCount);
    } catch (error) {
      // Silently fail - notices might not be available
    }
  };

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase() || 'U';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  const userInitials = getInitials(user?.employee?.firstName, user?.employee?.lastName);
  const userName = user?.employee ? `${user.employee.firstName} ${user.employee.lastName}` : user?.email || 'User';
  const userRole = user?.role || 'Employee';

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed left-0 top-0 h-full bg-sidebar transition-all duration-300 z-50 flex flex-col",
          collapsed ? "w-20" : "w-64"
        )}
      >
        {/* Logo */}
        <div className="h-18 flex items-center px-6 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sidebar-primary flex items-center justify-center flex-shrink-0">
              <span className="text-lg font-bold text-sidebar-primary-foreground">CD</span>
            </div>
            {!collapsed && (
              <span className="text-lg font-bold text-sidebar-foreground whitespace-nowrap">
                Cross DIGI
              </span>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navigation.map((item) => (
            <button
              key={item.name}
              onClick={() => navigate(item.href)}
              className={cn(
                "nav-link w-full",
                isActive(item.href) && "active"
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{item.name}</span>}
            </button>
          ))}
        </nav>

        {/* Collapse Button */}
        <div className="p-4 border-t border-sidebar-border">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="nav-link w-full justify-center"
          >
            <ChevronLeft className={cn(
              "w-5 h-5 transition-transform duration-300",
              collapsed && "rotate-180"
            )} />
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>

        {/* User Section */}
        <div className="p-4 border-t border-sidebar-border">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={cn(
                "flex items-center gap-3 w-full rounded-lg p-2 hover:bg-sidebar-accent transition-colors",
                collapsed && "justify-center"
              )}>
                <div className="w-10 h-10 rounded-full bg-sidebar-primary flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-medium text-sidebar-primary-foreground">{userInitials}</span>
                </div>
                {!collapsed && (
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-medium text-sidebar-foreground truncate">{userName}</p>
                    <p className="text-xs text-sidebar-foreground/60 truncate capitalize">{userRole}</p>
                  </div>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{userName}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/profile')} className="cursor-pointer">
                <Users className="w-4 h-4 mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/settings')} className="cursor-pointer">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main Content */}
      <div className={cn(
        "flex-1 transition-all duration-300",
        collapsed ? "ml-20" : "ml-64"
      )}>
        {/* Header */}
        <header className="h-18 bg-card border-b border-border sticky top-0 z-40 px-6 flex items-center justify-between">
          <div className="relative w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input 
              placeholder="Search anything..." 
              className="pl-12 bg-secondary/50 border-transparent focus-visible:border-primary/50"
            />
          </div>

          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              className="relative"
              onClick={() => {
                const event = new CustomEvent('openTasks');
                window.dispatchEvent(event);
                fetchPendingTasks(); // Refresh count when opened
              }}
            >
              <CheckSquare className="w-5 h-5" />
              {pendingTasksCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-destructive text-destructive-foreground">
                  {pendingTasksCount > 9 ? '9+' : pendingTasksCount}
                </Badge>
              )}
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="relative"
              onClick={() => {
                navigate("/notices");
                fetchUnreadNotices(); // Refresh count when opened
              }}
            >
              <Bell className="w-5 h-5" />
              {unreadNoticesCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-destructive text-destructive-foreground">
                  {unreadNoticesCount > 9 ? '9+' : unreadNoticesCount}
                </Badge>
              )}
            </Button>
            <button 
              onClick={() => navigate("/profile")}
              className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center cursor-pointer hover:bg-primary/20 transition-colors"
            >
              <span className="text-sm font-medium text-primary">{userInitials}</span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
