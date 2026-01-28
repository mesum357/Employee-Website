import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Search,
  Send,
  Paperclip,
  Smile,
  MoreVertical,
  Phone,
  Video,
  Image as ImageIcon,
  File,
  Check,
  CheckCheck,
  Circle,
  Loader2,
  AlertCircle,
  X,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { chatAPI, messageRequestAPI } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { io, Socket } from "socket.io-client";

interface ChatUser {
  _id: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
  employeeId?: string;
  department?: { _id: string; name: string };
  designation?: string;
  avatar?: string;
  displayName: string;
  employee?: {
    firstName: string;
    lastName: string;
    employeeId?: string;
    department?: { _id: string; name: string };
    designation?: string;
    avatar?: string;
  };
}

interface Message {
  _id: string;
  sender: { _id: string; email: string } | string;
  content: string;
  messageType?: string;
  attachments?: Array<{
    name: string;
    url: string;
    type: string;
    size?: number;
  }>;
  createdAt: string;
  readBy?: Array<{ user: string }>;
  isDeleted?: boolean;
}

interface Chat {
  _id: string;
  chatType: string;
  participants: ChatUser[];
  lastMessage?: {
    content: string;
    sender: { _id: string; email: string };
    createdAt: string;
  };
  messages?: Message[];
  unreadCount?: number;
}

const Chat = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadedAttachments, setUploadedAttachments] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showMobileChat, setShowMobileChat] = useState(false);

  // Initialize socket connection
  useEffect(() => {
    if (!user?.id) return;

    // Get socket URL from API URL
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const socketUrl = apiUrl.replace('/api', '');

    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      auth: {
        token: localStorage.getItem('token')
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    socketRef.current = socket;

    // Join user's personal room
    socket.emit('join', user.id);

    // Listen for new messages
    const handleNewMessage = (data: { chatId: string; message: Message }) => {
      if (selectedChat && data.chatId === selectedChat._id) {
        setMessages(prev => {
          // Check if message already exists to prevent duplicates
          const messageExists = prev.some(m => m._id === data.message._id);
          if (messageExists) {
            return prev;
          }
          return [...prev, data.message];
        });
        scrollToBottom();
      }

      // Update chat list
      fetchChats();
    };

    socket.on('newMessage', handleNewMessage);

    // Handle typing indicators
    socket.on('userTyping', (data: { userId: string; chatId: string; isTyping: boolean }) => {
      // Can implement typing indicator here
    });

    // Handle connection status
    socket.on('connect', () => {
      console.log('Connected to socket');
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from socket');
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    return () => {
      socket.off('newMessage', handleNewMessage);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user?.id]); // Only depend on user.id, not selectedChat

  // Fetch all users and chats on mount
  useEffect(() => {
    fetchData();
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [usersRes, chatsRes] = await Promise.all([
        chatAPI.getUsers(),
        chatAPI.getAll(),
      ]);

      setUsers(usersRes.data.data.users || []);
      setChats(chatsRes.data.data.chats || []);
    } catch (err: any) {
      console.error('Error fetching chat data:', err);
      setError(err.response?.data?.message || 'Failed to load chat data');
    } finally {
      setLoading(false);
    }
  };

  const fetchChats = async () => {
    try {
      const chatsRes = await chatAPI.getAll();
      setChats(chatsRes.data.data.chats || []);
    } catch (err: any) {
      console.error('Error fetching chats:', err);
    }
  };

  const handleSelectUser = async (selectedUser: ChatUser) => {
    try {
      setLoading(true);
      setError(null);

      // Check if user is employee and trying to message boss
      if (user?.role === 'employee' && selectedUser.role === 'boss') {
        // Create message request instead of direct chat
        try {
          const response = await messageRequestAPI.create(selectedUser._id);

          // If chat was created (request was already accepted), load it
          if (response.data.data.chat) {
            const chat = response.data.data.chat;
            const messagesRes = await chatAPI.getById(chat._id);
            const chatWithMessages = messagesRes.data.data.chat;
            setSelectedChat(chatWithMessages);
            setMessages(chatWithMessages.messages?.filter((m: Message) => !m.isDeleted) || []);
            fetchChats();
          } else {
            // Request is pending
            setError('Message request sent. Waiting for boss to accept...');
            // Refresh to show pending status
            fetchChats();
          }
        } catch (err: any) {
          if (err.response?.status === 400 && err.response?.data?.message?.includes('already pending')) {
            setError('Message request already pending. Waiting for boss to accept...');
          } else {
            throw err;
          }
        }
      } else {
        // Create or get existing private chat (normal flow)
        const response = await chatAPI.createPrivate(selectedUser._id);
        const chat = response.data.data.chat;

        // Fetch messages for this chat
        const messagesRes = await chatAPI.getById(chat._id);
        const chatWithMessages = messagesRes.data.data.chat;

        setSelectedChat(chatWithMessages);
        setMessages(chatWithMessages.messages?.filter((m: Message) => !m.isDeleted) || []);
        setShowMobileChat(true);

        // Refresh chats list
        fetchChats();
      }
    } catch (err: any) {
      console.error('Error creating/loading chat:', err);
      setError(err.response?.data?.message || 'Failed to load chat');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectChat = async (chat: Chat) => {
    try {
      setLoading(true);

      // Fetch messages for this chat
      const messagesRes = await chatAPI.getById(chat._id);
      const chatWithMessages = messagesRes.data.data.chat;

      setSelectedChat(chatWithMessages);
      setMessages(chatWithMessages.messages?.filter((m: Message) => !m.isDeleted) || []);
      setShowMobileChat(true);

      // Refresh unread count in sidebar (messages are marked as read when fetching)
      window.dispatchEvent(new CustomEvent('refreshUnreadMessages'));
      // Refresh chat list to update unread counts
      fetchChats();
    } catch (err: any) {
      console.error('Error loading chat:', err);
      setError(err.response?.data?.message || 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file: File, isImage: boolean) => {
    try {
      setUploading(true);
      const response = await chatAPI.uploadFile(file);
      if (response.data.success) {
        const attachment = {
          ...response.data.data,
          type: isImage ? 'image' : 'file'
        };
        setUploadedAttachments(prev => [...prev, attachment]);
      }
    } catch (err: any) {
      console.error('Error uploading file:', err);
      setError(err.response?.data?.message || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, isImage: boolean) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      handleFileUpload(file, isImage);
    });

    // Reset input
    e.target.value = '';
  };

  const removeAttachment = (index: number) => {
    setUploadedAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSendMessage = async () => {
    if ((!messageInput.trim() && uploadedAttachments.length === 0) || !selectedChat || sending) return;

    const messageContent = messageInput.trim();
    const attachments = [...uploadedAttachments];
    setMessageInput(""); // Clear input immediately for better UX
    setUploadedAttachments([]); // Clear attachments

    try {
      setSending(true);

      // Determine message type based on attachments
      let messageType = 'text';
      if (attachments.length > 0) {
        const hasImage = attachments.some(att => att.type === 'image');
        messageType = hasImage ? 'image' : 'file';
      }

      const response = await chatAPI.sendMessage(selectedChat._id, messageContent, messageType, attachments);

      if (response.data.success) {
        // Add message immediately for sender (optimistic update)
        // Other participants will receive via socket
        const newMessage = response.data.data.message;
        setMessages(prev => {
          // Double-check to prevent duplicates (in case socket also emits)
          const exists = prev.some(m => m._id === newMessage._id);
          if (exists) return prev;
          return [...prev, newMessage];
        });
        scrollToBottom();

        // Update chat list to update last message
        fetchChats();
      }
    } catch (err: any) {
      console.error('Error sending message:', err);
      setError(err.response?.data?.message || 'Failed to send message');
      // Restore input on error
      setMessageInput(messageContent);
      setUploadedAttachments(attachments);
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getOtherParticipant = (chat: Chat): ChatUser | null => {
    if (!user) return null;
    const other = chat.participants.find(p => p._id.toString() !== user.id);
    if (!other) return null;

    // Format participant data
    if (other.employee) {
      return {
        _id: other._id,
        email: other.email,
        role: other.role,
        firstName: other.employee.firstName,
        lastName: other.employee.lastName,
        employeeId: other.employee.employeeId,
        department: other.employee.department,
        designation: other.employee.designation,
        avatar: other.employee.avatar,
        displayName: `${other.employee.firstName} ${other.employee.lastName}`
      };
    }

    return {
      _id: other._id,
      email: other.email,
      role: other.role,
      firstName: other.firstName || other.email.split('@')[0],
      lastName: other.lastName || '',
      displayName: other.displayName || other.firstName || other.email.split('@')[0]
    };
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatMessageTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getAvatarInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const isMessageRead = (message: Message) => {
    if (!user || typeof message.sender === 'string') return false;
    if (message.sender._id.toString() === user.id) return true;
    return message.readBy?.some(r => r.user.toString() === user.id) || false;
  };

  const filteredUsers = users.filter(u =>
    u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredChats = chats.filter(chat => {
    const otherUser = getOtherParticipant(chat);
    if (!otherUser) return false;
    return (
      otherUser.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      otherUser.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  if (loading && !selectedChat) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const otherUser = selectedChat ? getOtherParticipant(selectedChat) : null;

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col md:flex-row gap-4 md:gap-6 relative overflow-hidden">
      {/* Users/Chats List */}
      <Card className={cn(
        "w-full md:w-80 flex-shrink-0 flex flex-col overflow-hidden",
        showMobileChat && "hidden md:flex"
      )}>
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2">
            {/* Existing Chats */}
            {filteredChats.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-medium text-muted-foreground px-3 py-2">Recent Chats</p>
                {filteredChats.map((chat) => {
                  const other = getOtherParticipant(chat);
                  if (!other) return null;

                  return (
                    <button
                      key={chat._id}
                      onClick={() => handleSelectChat(chat)}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left mb-2",
                        selectedChat?._id === chat._id
                          ? "bg-primary/10"
                          : "hover:bg-secondary/50"
                      )}
                    >
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-medium text-primary">
                            {getAvatarInitials(other.displayName)}
                          </span>
                        </div>
                        {onlineUsers.has(other._id) && (
                          <Circle className="absolute bottom-0 right-0 w-4 h-4 text-success fill-success bg-card rounded-full" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-foreground truncate">{other.displayName}</p>
                          {chat.lastMessage && (
                            <span className="text-caption text-xs">{formatTime(chat.lastMessage.createdAt)}</span>
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-small text-muted-foreground truncate">
                            {chat.lastMessage?.content || 'No messages yet'}
                          </p>
                          {chat.unreadCount && chat.unreadCount > 0 && (
                            <Badge className="bg-primary text-primary-foreground min-w-[20px] h-5 flex items-center justify-center text-xs">
                              {chat.unreadCount > 9 ? '9+' : chat.unreadCount}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* All Users */}
            <div>
              <p className="text-xs font-medium text-muted-foreground px-3 py-2">
                {filteredChats.length > 0 ? 'All Users' : 'Start a Conversation'}
              </p>
              {filteredUsers.map((chatUser) => {
                const existingChat = chats.find(c => {
                  const other = getOtherParticipant(c);
                  return other?._id === chatUser._id;
                });

                if (existingChat) return null; // Already shown in recent chats

                return (
                  <button
                    key={chatUser._id}
                    onClick={() => handleSelectUser(chatUser)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left mb-2",
                      selectedChat && getOtherParticipant(selectedChat)?._id === chatUser._id
                        ? "bg-primary/10"
                        : "hover:bg-secondary/50"
                    )}
                  >
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">
                          {getAvatarInitials(chatUser.displayName)}
                        </span>
                      </div>
                      {onlineUsers.has(chatUser._id) && (
                        <Circle className="absolute bottom-0 right-0 w-4 h-4 text-success fill-success bg-card rounded-full" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-foreground truncate">{chatUser.displayName}</p>
                        {chatUser.role && chatUser.role !== 'employee' && (
                          <Badge variant="outline" className="text-xs">
                            {chatUser.role.toUpperCase()}
                          </Badge>
                        )}
                      </div>
                      <p className="text-small text-muted-foreground truncate mt-1">
                        {chatUser.designation || chatUser.email}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {filteredUsers.length === 0 && filteredChats.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No users found</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </Card>

      {/* Chat Area */}
      {selectedChat && otherUser ? (
        <Card className={cn(
          "flex-1 flex flex-col overflow-hidden",
          !showMobileChat && "hidden md:flex"
        )}>
          {/* Chat Header */}
          <div className="p-3 md:p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden -ml-2 h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={() => setShowMobileChat(false)}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-medium text-primary">
                    {getAvatarInitials(otherUser.displayName)}
                  </span>
                </div>
                {onlineUsers.has(otherUser._id) && (
                  <Circle className="absolute bottom-0 right-0 w-3 h-3 text-success fill-success bg-card rounded-full" />
                )}
              </div>
              <div>
                <p className="font-medium text-foreground">{otherUser.displayName}</p>
                <p className="text-caption">
                  {onlineUsers.has(otherUser._id) ? "Online" : otherUser.email}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon">
                <Phone className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <Video className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <MoreVertical className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p>No messages yet. Start the conversation!</p>
                </div>
              ) : (
                messages.map((message) => {
                  const isMe = typeof message.sender === 'object'
                    ? message.sender._id.toString() === user?.id
                    : message.sender === user?.id;
                  const senderName = typeof message.sender === 'object'
                    ? message.sender.email
                    : 'Unknown';

                  return (
                    <div
                      key={message._id}
                      className={cn(
                        "flex",
                        isMe ? "justify-end" : "justify-start"
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[70%] rounded-2xl px-4 py-3",
                          isMe
                            ? "bg-primary text-primary-foreground rounded-br-md"
                            : "bg-secondary text-foreground rounded-bl-md"
                        )}
                      >
                        {message.attachments && message.attachments.length > 0 && (
                          <div className="mb-2 space-y-2">
                            {message.attachments.map((attachment, idx) => (
                              <div key={idx} className="rounded-lg overflow-hidden">
                                {attachment.type === 'image' ? (
                                  <img
                                    src={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${attachment.url}`}
                                    alt={attachment.name}
                                    className="max-w-full max-h-64 rounded-lg object-cover cursor-pointer"
                                    onClick={() => window.open(`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${attachment.url}`, '_blank')}
                                  />
                                ) : (
                                  <a
                                    href={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${attachment.url}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={cn(
                                      "flex items-center gap-2 p-2 rounded-lg border",
                                      isMe
                                        ? "bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground"
                                        : "bg-secondary border-border text-foreground"
                                    )}
                                  >
                                    <File className="w-4 h-4" />
                                    <span className="text-sm truncate flex-1">{attachment.name}</span>
                                    {attachment.size && (
                                      <span className="text-xs opacity-70">
                                        {(attachment.size / 1024 / 1024).toFixed(2)} MB
                                      </span>
                                    )}
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        {message.content && (
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        )}
                        <div className={cn(
                          "flex items-center gap-1 mt-1",
                          isMe ? "justify-end" : "justify-start"
                        )}>
                          <span className={cn(
                            "text-xs",
                            isMe ? "text-primary-foreground/70" : "text-muted-foreground"
                          )}>
                            {formatMessageTime(message.createdAt)}
                          </span>
                          {isMe && (
                            isMessageRead(message)
                              ? <CheckCheck className="w-4 h-4 text-primary-foreground/70" />
                              : <Check className="w-4 h-4 text-primary-foreground/70" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="p-4 border-t border-border">
            {error && (
              <div className="mb-2 bg-destructive/10 border border-destructive/20 rounded-lg p-2 text-destructive text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}
            {uploadedAttachments.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-2">
                {uploadedAttachments.map((attachment, idx) => (
                  <div key={idx} className="relative inline-block">
                    {attachment.type === 'image' ? (
                      <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-border">
                        <img
                          src={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${attachment.url}`}
                          alt={attachment.name}
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => removeAttachment(idx)}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:bg-destructive/90"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-secondary">
                        <File className="w-4 h-4" />
                        <span className="text-xs truncate max-w-[100px]">{attachment.name}</span>
                        <button
                          onClick={() => removeAttachment(idx)}
                          className="ml-1 w-4 h-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:bg-destructive/90"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center gap-3">
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv"
                onChange={(e) => handleFileSelect(e, false)}
              />
              <input
                type="file"
                ref={imageInputRef}
                className="hidden"
                accept="image/*"
                onChange={(e) => handleFileSelect(e, true)}
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <Paperclip className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => imageInputRef.current?.click()}
                disabled={uploading}
              >
                <ImageIcon className="w-5 h-5" />
              </Button>
              <Input
                placeholder="Type a message..."
                className="flex-1"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                disabled={sending || uploading}
              />
              <Button variant="ghost" size="icon">
                <Smile className="w-5 h-5" />
              </Button>
              <Button
                size="icon"
                disabled={(!messageInput.trim() && uploadedAttachments.length === 0) || sending || uploading}
                onClick={handleSendMessage}
              >
                {(sending || uploading) ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="flex-1 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <Circle className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p className="text-lg font-medium">Select a user to start chatting</p>
            <p className="text-sm mt-2">Choose someone from the list to begin a conversation</p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default Chat;
