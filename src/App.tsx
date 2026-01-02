import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/layout/DashboardLayout";

// Pages
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Attendance from "./pages/Attendance";
import Leave from "./pages/Leave";
import Notices from "./pages/Notices";
import Chat from "./pages/Chat";
import Directory from "./pages/Directory";
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
    <Route path="/chat" element={<ProtectedPage><Chat /></ProtectedPage>} />
    <Route path="/directory" element={<ProtectedPage><Directory /></ProtectedPage>} />
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
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
