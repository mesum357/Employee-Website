import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { TasksPopup } from "@/components/TasksPopup";
import { NotificationProvider } from "@/components/notifications/NotificationProvider";

// Pages
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Attendance from "./pages/Attendance";
import Leave from "./pages/Leave";
import Notices from "./pages/Notices";
import Meetings from "./pages/Meetings";
import Chat from "./pages/Chat";
import Report from "./pages/Report";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Protected wrapper component
const ProtectedPage = ({ children }: { children: React.ReactNode }) => {
  return (
    <DashboardLayout>
      {children}
    </DashboardLayout>
  );
};

// Manager-only page wrapper - redirects non-managers to dashboard
const ManagerOnlyPage = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  // Check if user's designation is "Manager"
  const designation = user?.employee?.designation;
  const isManager = designation?.toLowerCase() === 'manager';

  if (!isManager) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <DashboardLayout>
      {children}
    </DashboardLayout>
  );
};

// Root redirect based on auth status
const RootRedirect = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Navigate to="/auth" replace />;
};

// Auth page wrapper - redirect if already logged in
const AuthPageWrapper = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Auth />;
};

const AppRoutes = () => (
  <Routes>
    {/* Root redirect */}
    <Route path="/" element={<RootRedirect />} />

    {/* Auth route - public but redirects if logged in */}
    <Route path="/auth" element={<AuthPageWrapper />} />

    {/* Protected routes with dashboard layout */}
    <Route path="/dashboard" element={<ProtectedPage><Dashboard /></ProtectedPage>} />
    <Route path="/attendance" element={<ProtectedPage><Attendance /></ProtectedPage>} />
    <Route path="/leave" element={<ProtectedPage><Leave /></ProtectedPage>} />
    <Route path="/notices" element={<ProtectedPage><Notices /></ProtectedPage>} />
    <Route path="/meetings" element={<ProtectedPage><Meetings /></ProtectedPage>} />
    <Route path="/chat" element={<ProtectedPage><Chat /></ProtectedPage>} />
    <Route path="/report" element={<ManagerOnlyPage><Report /></ManagerOnlyPage>} />
    <Route path="/settings" element={<ProtectedPage><Settings /></ProtectedPage>} />
    <Route path="/profile" element={<ProtectedPage><Profile /></ProtectedPage>} />

    {/* 404 */}
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <NotificationProvider>
            <AppRoutes />
            <TasksPopup />
          </NotificationProvider>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
