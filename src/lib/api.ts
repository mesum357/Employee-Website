import axios from 'axios';

// API Base URL - connects to shared backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor - add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/auth';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (data: any) =>
    api.post('/auth/register', data),
  logout: () =>
    api.post('/auth/logout'),
  getMe: () =>
    api.get('/auth/me'),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.put('/auth/change-password', { currentPassword, newPassword }),
  checkStatus: (email: string) =>
    api.get(`/auth/check-status/${email}`),
  // WebAuthn / Fingerprint API
  webauthnRegisterStart: () =>
    api.post('/auth/webauthn/register/start'),
  webauthnRegisterComplete: (deviceName: string, credential: any) =>
    api.post('/auth/webauthn/register/complete', { deviceName, credential }),
  webauthnLoginStart: () =>
    api.post('/auth/webauthn/login/start'),
  webauthnLoginComplete: (credential: any) =>
    api.post('/auth/webauthn/login/complete', { credential }),
  getWebAuthnCredentials: () =>
    api.get('/auth/webauthn/credentials'),
  deleteWebAuthnCredential: (credentialId: string) =>
    api.delete(`/auth/webauthn/credential/${credentialId}`),
};

// Employee API (for employees portal)
export const employeeAPI = {
  getProfile: () =>
    api.get('/auth/me'),
  updateProfile: (id: string, data: any) =>
    api.put(`/employees/${id}`, data),
  getDirectory: () =>
    api.get('/employees/directory'),
  uploadDocument: (id: string, formData: FormData) =>
    api.post(`/employees/${id}/documents`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
};

// Attendance API
export const attendanceAPI = {
  checkIn: () =>
    api.post('/attendance/check-in'),
  checkOut: () =>
    api.post('/attendance/check-out'),
  startBreak: (reason: string) =>
    api.post('/attendance/break/start', { reason }),
  endBreak: () =>
    api.post('/attendance/break/end'),
  getToday: () =>
    api.get('/attendance/today'),
  getMy: (month?: number, year?: number) =>
    api.get('/attendance/my', { params: { month, year } }),
  getAll: (params?: any) =>
    api.get('/attendance', { params }),
};

// Leave API
export const leaveAPI = {
  getMy: () =>
    api.get('/leaves/my'),
  getBalance: () =>
    api.get('/leaves/balance'),
  create: (data: any) =>
    api.post('/leaves', data),
  cancel: (id: string) =>
    api.put(`/leaves/${id}/cancel`),
  getAll: (params?: any) =>
    api.get('/leaves', { params }),
};

// Notice API
export const noticeAPI = {
  getAll: (params?: any) =>
    api.get('/notices', { params }),
  getRecent: () =>
    api.get('/notices/recent'),
  getById: (id: string) =>
    api.get(`/notices/${id}`),
  acknowledge: (id: string) =>
    api.put(`/notices/${id}/acknowledge`),
};

// Chat API
export const chatAPI = {
  getAll: () =>
    api.get('/chat'),
  getById: (id: string) =>
    api.get(`/chat/${id}`),
  getMessages: (id: string, page?: number) =>
    api.get(`/chat/${id}/messages`, { params: { page } }),
  getUsers: () =>
    api.get('/chat/users'),
  createPrivate: (userId: string) =>
    api.post('/chat/private', { userId }),
  uploadFile: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/chat/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  sendMessage: (chatId: string, content: string, messageType?: string, attachments?: any[]) =>
    api.post(`/chat/${chatId}/message`, { content, messageType, attachments }),
};

// Message Request API
export const messageRequestAPI = {
  getAll: () =>
    api.get('/message-requests'),
  create: (to: string, message?: string) =>
    api.post('/message-requests', { to, message }),
  accept: (id: string) =>
    api.put(`/message-requests/${id}/accept`),
  reject: (id: string) =>
    api.put(`/message-requests/${id}/reject`),
};

// Task API
export const taskAPI = {
  getMy: (status?: string) =>
    api.get('/tasks/my', { params: { status } }),
  getById: (id: string) =>
    api.get(`/tasks/${id}`),
  update: (id: string, data: any) =>
    api.put(`/tasks/${id}`, data),
  addComment: (id: string, content: string) =>
    api.post(`/tasks/${id}/comment`, { content }),
  uploadImage: (id: string, formData: FormData) =>
    api.post(`/tasks/${id}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
};

// Ticket API
export const ticketAPI = {
  create: (data: { subject: string; category: string; priority: string; description: string }) =>
    api.post('/tickets', data),
  getMy: () =>
    api.get('/tickets/my'),
  getAll: (params?: any) =>
    api.get('/tickets', { params }),
  getById: (id: string) =>
    api.get(`/tickets/${id}`),
};

// Meeting API
export const meetingAPI = {
  getAll: (params?: any) =>
    api.get('/meetings', { params }),
  getUpcoming: () =>
    api.get('/meetings/upcoming'),
  getToday: () =>
    api.get('/meetings/today'),
  getById: (id: string) =>
    api.get(`/meetings/${id}`),
  respond: (id: string, response: 'accepted' | 'declined' | 'tentative') =>
    api.put(`/meetings/${id}/respond`, { response }),
};

// Report API
export const reportAPI = {
  create: (data: { headset?: number; sales?: number; salesCount?: number; salesDetails?: string }) =>
    api.post('/reports', data),
  getMy: (params?: any) =>
    api.get('/reports/my', { params }),
  getWeekly: () =>
    api.get('/reports/my/weekly'),
  getMonthly: () =>
    api.get('/reports/my/monthly'),
  getToday: () =>
    api.get('/reports/today'),
  getDashboard: () =>
    api.get('/reports/dashboard'),
  getEmployeeReport: (id: string) =>
    api.get(`/reports/employee/${id}`),
  // Manager-only methods
  getEmployeeTodayReport: (employeeId: string, date?: string) =>
    api.get(`/reports/employee/${employeeId}/today`, { params: { date } }),
  updateEmployeeReport: (employeeId: string, data: {
    headset?: number;
    sales?: number;
    salesCount?: number;
    salesDetails?: string;
    date?: string
  }) =>
    api.post(`/reports/employee/${employeeId}`, data),
  getEmployees: () =>
    api.get('/employees/directory'),
  getManagerUpdatedReports: (params?: any) =>
    api.get('/reports/manager/updated', { params }),
  updateReport: (id: string, data: any) =>
    api.put(`/reports/${id}`, data),
};

// Settings/Profile API
export const settingsAPI = {
  getProfile: () =>
    api.get('/auth/me'),
  updateProfile: (id: string, data: any) =>
    api.put(`/employees/${id}`, data),
};

export default api;

