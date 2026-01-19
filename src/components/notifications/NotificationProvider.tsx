import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Bell, Megaphone, AlertTriangle, Info } from 'lucide-react';

interface NoticeNotification {
    id: string;
    title: string;
    category: string;
    priority: string;
}

// Notification sound generator using Web Audio API
const playNotificationSound = () => {
    try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

        // Create a pleasant notification sound (laptop-style ping)
        const oscillator1 = audioContext.createOscillator();
        const oscillator2 = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator1.connect(gainNode);
        oscillator2.connect(gainNode);
        gainNode.connect(audioContext.destination);

        // Set frequencies for a pleasant chime
        oscillator1.frequency.setValueAtTime(880, audioContext.currentTime); // A5
        oscillator1.frequency.setValueAtTime(1100, audioContext.currentTime + 0.1); // ~C#6
        oscillator2.frequency.setValueAtTime(1320, audioContext.currentTime); // E6
        oscillator2.frequency.setValueAtTime(1650, audioContext.currentTime + 0.1); // ~G#6

        oscillator1.type = 'sine';
        oscillator2.type = 'sine';

        // Volume envelope
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.02);
        gainNode.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 0.1);
        gainNode.gain.linearRampToValueAtTime(0.15, audioContext.currentTime + 0.2);
        gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.5);

        oscillator1.start(audioContext.currentTime);
        oscillator2.start(audioContext.currentTime);
        oscillator1.stop(audioContext.currentTime + 0.5);
        oscillator2.stop(audioContext.currentTime + 0.5);
    } catch (error) {
        console.log('Could not play notification sound:', error);
    }
};

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
        // Play notification sound
        playNotificationSound();

        // Trigger refresh of unread notices count in navbar
        const refreshEvent = new CustomEvent('refreshUnreadNotices');
        window.dispatchEvent(refreshEvent);

        const Icon = getNoticeIcon(notice.category, notice.priority);
        const priorityLabel = notice.priority === 'critical' || notice.priority === 'high'
            ? ` • ${notice.priority.charAt(0).toUpperCase() + notice.priority.slice(1)} Priority`
            : '';

        // Show toast notification with click handler
        toast.custom(
            (t) => (
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
                        <p className="font-semibold text-foreground text-sm line-clamp-2">
                            {notice.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                            {notice.category.charAt(0).toUpperCase() + notice.category.slice(1)}{priorityLabel}
                        </p>
                        <p className="text-xs text-primary mt-2 font-medium">
                            Click to view →
                        </p>
                    </div>
                </div>
            ),
            {
                duration: 8000,
                position: 'top-right',
            }
        );
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

        // Listen for new notice events
        socket.on('newNotice', handleNewNotice);

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
            socket.disconnect();
            socketRef.current = null;
        };
    }, [isAuthenticated, user, handleNewNotice]);

    return <>{children}</>;
};

export default NotificationProvider;
