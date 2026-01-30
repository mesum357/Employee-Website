import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Bell, Megaphone, AlertTriangle, Info, Calendar, ClipboardList, MessageSquare } from 'lucide-react';

interface NoticeNotification {
    id: string;
    title: string;
    category: string;
    priority: string;
}

interface MeetingNotification {
    id: string;
    title: string;
    startTime: string;
}

interface TaskNotification {
    id: string;
    title: string;
    priority: string;
    dueDate: string;
}

interface ChatMessageNotification {
    chatId: string;
    message: {
        _id: string;
        sender: {
            _id: string;
            email: string;
        };
        content: string;
        createdAt: string;
    };
}

// Notification sound generator using Web Audio API
// Consolidate sound logic

// Get icon based on category/priority
const getNoticeIcon = (category: string, priority: string) => {
    if (priority === 'critical' || priority === 'high' || category === 'urgent') {
        return AlertTriangle;
    }
    if (category === 'general' || category === 'hr' || category === 'policy') {
        return Megaphone;
    }
    return Bell;
};

// Get color based on priority
const getPriorityStyles = (priority: string) => {
    switch (priority) {
        case 'critical':
            return 'border-red-500 bg-red-50 dark:bg-red-950';
        case 'high':
            return 'border-orange-500 bg-orange-50 dark:bg-orange-950';
        default:
            return 'border-primary bg-primary/5';
    }
};

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
    const socketRef = useRef<Socket | null>(null);
    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const handleNewNotice = useCallback((notice: NoticeNotification) => {
        window.dispatchEvent(new CustomEvent('refreshUnreadNotices', { detail: notice }));
        const Icon = getNoticeIcon(notice.category, notice.priority);
        const priorityLabel = notice.priority === 'critical' || notice.priority === 'high'
            ? ` • ${notice.priority.charAt(0).toUpperCase() + notice.priority.slice(1)} Priority`
            : '';

        toast.custom((t) => (
            <div
                onClick={() => {
                    toast.dismiss(t);
                    navigate('/notices');
                }}
                className={`flex items-start gap-3 p-4 rounded-lg border-l-4 cursor-pointer hover:shadow-lg transition-all ${getPriorityStyles(notice.priority)} bg-card shadow-md max-w-sm`}
            >
                <div className={`p-2 rounded-full ${notice.priority === 'critical' ? 'bg-red-100 text-red-600' : notice.priority === 'high' ? 'bg-orange-100 text-orange-600' : 'bg-primary/10 text-primary'}`}>
                    <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-sm line-clamp-2">{notice.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{notice.category.charAt(0).toUpperCase() + notice.category.slice(1)}{priorityLabel}</p>
                    <p className="text-xs text-primary mt-2 font-medium">Click to view →</p>
                </div>
            </div>
        ), { duration: 8000, position: 'top-right' });
    }, [navigate]);

    const handleNewMeeting = useCallback((meeting: MeetingNotification) => {
        window.dispatchEvent(new CustomEvent('refreshMeetings', { detail: meeting }));
        toast.custom((t) => (
            <div
                onClick={() => {
                    toast.dismiss(t);
                    navigate('/meetings');
                }}
                className="flex items-start gap-3 p-4 rounded-lg border-l-4 border-blue-500 bg-card shadow-md max-w-sm cursor-pointer hover:shadow-lg transition-all"
            >
                <div className="p-2 rounded-full bg-blue-100 text-blue-600">
                    <Calendar className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-sm line-clamp-2">New Meeting: {meeting.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">Starts: {new Date(meeting.startTime).toLocaleString()}</p>
                </div>
            </div>
        ), { duration: 8000, position: 'top-right' });
    }, [navigate]);

    const handleNewTask = useCallback((task: TaskNotification) => {
        window.dispatchEvent(new CustomEvent('refreshTasks', { detail: task }));
        toast.custom((t) => (
            <div
                onClick={() => {
                    toast.dismiss(t);
                    navigate('/tasks');
                }}
                className="flex items-start gap-3 p-4 rounded-lg border-l-4 border-green-500 bg-card shadow-md max-w-sm cursor-pointer hover:shadow-lg transition-all"
            >
                <div className="p-2 rounded-full bg-green-100 text-green-600">
                    <ClipboardList className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-sm line-clamp-2">New Task: {task.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">Due: {new Date(task.dueDate).toLocaleDateString()}</p>
                </div>
            </div>
        ), { duration: 8000, position: 'top-right' });
    }, [navigate]);

    const handleNewMessage = useCallback((data: ChatMessageNotification) => {
        // Only show toast if not on chat page OR if on chat page but different chat
        const isChatPage = window.location.pathname === '/chat';
        if (isChatPage) return; // Chat.tsx handles its own real-time updates

        window.dispatchEvent(new CustomEvent('refreshUnreadMessages', { detail: data }));

        toast.custom((t) => (
            <div
                onClick={() => {
                    toast.dismiss(t);
                    navigate('/chat');
                }}
                className="flex items-start gap-3 p-4 rounded-lg border-l-4 border-primary bg-card shadow-md max-w-sm cursor-pointer hover:shadow-lg transition-all"
            >
                <div className="p-2 rounded-full bg-primary/10 text-primary">
                    <MessageSquare className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-sm truncate">{data.message.sender.email}</p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{data.message.content}</p>
                </div>
            </div>
        ), { duration: 5000, position: 'top-right' });
    }, [navigate]);

    useEffect(() => {
        if (!isAuthenticated || !user) {
            // Disconnect if not authenticated
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
            return;
        }

        // Get socket URL from API URL
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const socketUrl = apiUrl.replace('/api', '');

        // Create socket connection
        const socket = io(socketUrl, {
            transports: ['websocket', 'polling'],
            auth: {
                token: localStorage.getItem('token')
            },
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        socketRef.current = socket;

        // Join user's room for personalized notifications
        socket.emit('join', user.id);

        // Listen for socket events
        socket.on('newNotice', handleNewNotice);
        socket.on('newMeeting', handleNewMeeting);
        socket.on('newTask', handleNewTask);
        socket.on('newMessage', handleNewMessage);

        socket.on('connect', () => {
            console.log('🔔 Notification socket connected');
        });

        socket.on('disconnect', () => {
            console.log('🔔 Notification socket disconnected');
        });

        socket.on('connect_error', (error) => {
            console.log('Notification socket connection error:', error.message);
        });

        return () => {
            socket.off('newNotice', handleNewNotice);
            socket.off('newMeeting', handleNewMeeting);
            socket.off('newTask', handleNewTask);
            socket.off('newMessage', handleNewMessage);
            socket.disconnect();
            socketRef.current = null;
        };
    }, [isAuthenticated, user, handleNewNotice, handleNewMeeting, handleNewTask, handleNewMessage]);

    return <>{children}</>;
};

export default NotificationProvider;
