import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI } from '@/lib/api';

interface Employee {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  avatar?: string;
  department?: {
    _id: string;
    name: string;
  };
  designation?: string;
}

interface User {
  id: string;
  email: string;
  role: 'employee' | 'hr' | 'manager' | 'boss' | 'admin';
  verificationStatus: string;
  employee?: Employee;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string; code?: string }>;
  loginWithFingerprint: () => Promise<{ success: boolean; message?: string; code?: string }>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!token && !!user;

  const checkAuth = async () => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await authAPI.getMe();
      const userData = response.data.data.user;
      setUser(userData);
      setToken(storedToken);
    } catch (error) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; message?: string; code?: string }> => {
    try {
      const response = await authAPI.login(email, password);
      const { token: newToken, user: userData } = response.data.data;
      
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(userData));
      
      setToken(newToken);
      setUser(userData);
      
      return { success: true };
    } catch (error: any) {
      const code = error.response?.data?.code;
      const message = error.response?.data?.message || 'Login failed';
      return { success: false, message, code };
    }
  };

  const loginWithFingerprint = async (): Promise<{ success: boolean; message?: string; code?: string }> => {
    try {
      // Step 1: Start authentication (no email needed for usernameless)
      const startResponse = await authAPI.webauthnLoginStart();
      const options = startResponse.data.data;

      // Step 2: Use browser API to authenticate  
      const { startAuthentication } = await import('@simplewebauthn/browser');
      // SimpleWebAuthn v13+ - pass options wrapped
      const credential = await startAuthentication({ optionsJSON: options });

      // Step 3: Complete authentication (no email needed - user found by credential ID)
      const completeResponse = await authAPI.webauthnLoginComplete(credential);
      
      if (completeResponse.data.success) {
        const { token: newToken, user: userData } = completeResponse.data.data;
        
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(userData));
        
        setToken(newToken);
        setUser(userData);
        
        return { success: true };
      } else {
        return { success: false, message: 'Fingerprint authentication failed' };
      }
    } catch (error: any) {
      let message = 'Fingerprint login failed';
      
      if (error.name === 'NotAllowedError') {
        message = 'Fingerprint authentication was cancelled';
      } else if (error.response?.data?.message) {
        message = error.response.data.message;
      }
      
      return { success: false, message };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isAuthenticated,
      isLoading,
      login,
      loginWithFingerprint,
      logout,
      checkAuth,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
