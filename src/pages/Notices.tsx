import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Search,
  Pin,
  Calendar,
  Building,
  Users,
  Megaphone,
  ChevronRight,
  Clock,
  Loader2,
  AlertCircle,
  X,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { noticeAPI } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

interface Notice {
  _id: string;
  title: string;
  content: string;
  category: string;
  priority: string;
  targetAudience: string;
  departments?: Array<{ _id: string; name: string }> | string[];
  publishedBy?: { email: string; role?: string };
  publishedAt: string;
  expiresAt?: string;
  isPinned: boolean;
  isActive: boolean;
  readBy?: Array<{ user: any }>;
}

const categoryLabels: Record<string, string> = {
  general: "General",
  urgent: "Urgent",
  hr: "HR",
  event: "Event",
  policy: "Policy",
  holiday: "Holiday",
  other: "Other",
};

const Notices = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  useEffect(() => {
    fetchNotices();

    // Refresh unread count in navbar when notices page is visited
    const event = new CustomEvent('refreshUnreadNotices');
    window.dispatchEvent(event);
  }, []);

  useEffect(() => {
    // Refresh notices when window regains focus (user might have read notices in another tab)
    const handleFocus = () => {
      fetchNotices();
      const event = new CustomEvent('refreshUnreadNotices');
      window.dispatchEvent(event);
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const fetchNotices = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await noticeAPI.getAll({ isActive: true });
      setNotices(response.data.data.notices || []);
    } catch (err: any) {
      console.error("Error fetching notices:", err);
      setError(err.response?.data?.message || "Failed to load notices");
    } finally {
      setLoading(false);
    }
  };

  const handleNoticeClick = async (notice: Notice) => {
    setSelectedNotice(notice);
    setIsDetailOpen(true);

    // Mark notice as read if not already read
    if (!isNoticeRead(notice)) {
      try {
        await noticeAPI.getById(notice._id);
        // Refresh notices to update read count and status
        await fetchNotices();
        // Update selected notice with fresh data
        const response = await noticeAPI.getById(notice._id);
        setSelectedNotice(response.data.data.notice);

        // Refresh unread count in navbar
        const event = new CustomEvent('refreshUnreadNotices');
        window.dispatchEvent(event);
      } catch (err) {
        console.error("Error marking notice as read:", err);
      }
    }
  };

  const categories = ["All", ...Object.values(categoryLabels)];

  const filteredNotices = notices.filter((notice) => {
    const matchesSearch =
      notice.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notice.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" || categoryLabels[notice.category] === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const pinnedNotices = filteredNotices.filter((n) => n.isPinned);
  const regularNotices = filteredNotices.filter((n) => !n.isPinned);

  // Sort: pinned first, then by published date (newest first)
  const sortedNotices = [...pinnedNotices, ...regularNotices].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getReadCount = (notice: Notice) => {
    return notice.readBy?.length || 0;
  };

  const isNoticeRead = (notice: Notice) => {
    if (!user?.id || !notice.readBy || notice.readBy.length === 0) return false;
    return notice.readBy.some((read: any) => {
      const readUserId = typeof read.user === 'object' ? read.user._id : read.user;
      return readUserId?.toString() === user.id.toString();
    });
  };

  const handleMarkAsRead = async (noticeId: string) => {
    try {
      // Mark as read by fetching the notice (backend automatically marks it as read)
      const response = await noticeAPI.getById(noticeId);
      // Refresh notices to update read status
      await fetchNotices();

      // Update selected notice with fresh data
      if (selectedNotice?._id === noticeId) {
        setSelectedNotice(response.data.data.notice);
      }

      // Refresh unread count in navbar
      const event = new CustomEvent('refreshUnreadNotices');
      window.dispatchEvent(event);
    } catch (err: any) {
      console.error("Error marking notice as read:", err);
    }
  };

  const getDepartmentName = (notice: Notice) => {
    if (!notice.departments || notice.departments.length === 0) {
      return notice.targetAudience === "all" ? "All Employees" : "All";
    }
    if (Array.isArray(notice.departments)) {
      return notice.departments
        .map((d) => (typeof d === "object" && d ? d.name : d))
        .join(", ");
    }
    return "All";
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-destructive/10 text-destructive border-destructive/20";
      case "high":
        return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200";
      case "medium":
        return "bg-warning/10 text-warning border-warning/20";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-full overflow-x-hidden px-1">
      {/* Header */}
      <div>
        <h1 className="text-h2 text-foreground">Notice Board</h1>
        <p className="text-muted-foreground mt-1">Company announcements and updates</p>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-destructive" />
          <p className="text-destructive">{error}</p>
        </div>
      )}

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative min-w-0">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search notices..."
            className="pl-12 h-11 md:h-10 w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="w-full md:w-auto">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none w-full">
            {categories.map((cat) => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? "default" : "outline"}
                size="sm"
                className="whitespace-nowrap h-9 md:h-10 flex-shrink-0"
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Pinned Strip */}
      {pinnedNotices.length > 0 && (
        <Card className="p-4 bg-primary/5 border-primary/20 w-full overflow-hidden">
          <div className="flex items-center gap-2 text-primary mb-3">
            <Pin className="w-4 h-4" />
            <span className="text-sm font-medium">Pinned Notices</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {pinnedNotices.map((notice) => {
              const isRead = isNoticeRead(notice);
              return (
                <div
                  key={notice._id}
                  onClick={() => handleNoticeClick(notice)}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-xl bg-card hover:bg-secondary/50 transition-colors cursor-pointer group",
                    !isRead && "border border-primary/30 bg-primary/5"
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 w-full">
                      <p className="font-medium text-foreground truncate group-hover:text-primary transition-colors flex-1">
                        {notice.title}
                      </p>
                      {!isRead && (
                        <Badge className="bg-primary text-primary-foreground text-[10px] h-4 px-1 flex-shrink-0">
                          New
                        </Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate">
                      <span className="opacity-80">{notice.publishedBy?.email?.split('@')[0] || "Admin"}</span> • {formatDate(notice.publishedAt)}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Notice Feed */}
      <div className="space-y-4">
        {sortedNotices.map((notice, index) => {
          const isRead = isNoticeRead(notice);
          return (
            <Card
              key={notice._id}
              onClick={() => handleNoticeClick(notice)}
              className={cn(
                "dashboard-card cursor-pointer group animate-fade-up w-full overflow-hidden",
                `delay-${(index + 1) * 100}`,
                !isRead && "border-primary/20 bg-primary/5"
              )}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {!isRead && (
                      <Badge className="bg-primary text-primary-foreground">
                        New
                      </Badge>
                    )}
                    <Badge variant="secondary">{categoryLabels[notice.category] || notice.category}</Badge>
                    {notice.publishedBy?.role === "boss" || notice.publishedBy?.role === "admin" ? (
                      <Badge className="bg-primary/10 text-primary border-primary/20">
                        Boss
                      </Badge>
                    ) : null}
                    {notice.priority === "critical" || notice.priority === "high" ? (
                      <Badge className={cn("border", getPriorityColor(notice.priority))}>
                        {notice.priority.charAt(0).toUpperCase() + notice.priority.slice(1)}
                      </Badge>
                    ) : null}
                    {notice.isPinned && (
                      <Badge variant="outline" className="text-warning border-warning">
                        <Pin className="w-3 h-3 mr-1" />
                        Pinned
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-h5 text-foreground group-hover:text-primary transition-colors leading-tight">
                      {notice.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                      {notice.content}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-1">
                    <span className="text-[11px] sm:text-xs text-muted-foreground flex items-center gap-1.5">
                      <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary/70" />
                      {formatDate(notice.publishedAt)}
                    </span>
                    <span className="text-[11px] sm:text-xs text-muted-foreground flex items-center gap-1.5 max-w-[150px]">
                      <Building className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary/70" />
                      <span className="truncate">{getDepartmentName(notice)}</span>
                    </span>
                    {notice.publishedBy && (
                      <span className="text-[11px] sm:text-xs text-muted-foreground flex items-center gap-1.5 max-w-[180px]">
                        <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary/70" />
                        <span className="truncate">{notice.publishedBy.email}</span>
                      </span>
                    )}
                    <span className="text-[11px] sm:text-xs text-muted-foreground flex items-center gap-1.5">
                      <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary/70" />
                      {getReadCount(notice)} <span className="hidden xs:inline">views</span>
                    </span>
                  </div>
                </div>
                <div className="hidden sm:block flex-shrink-0 pt-1">
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {filteredNotices.length === 0 && (
        <Card className="dashboard-card text-center py-12">
          <Megaphone className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-h5 text-foreground">No notices found</h3>
          <p className="text-muted-foreground mt-1">
            {searchQuery || selectedCategory !== "All"
              ? "Try adjusting your search or filter criteria"
              : "No notices have been posted yet"}
          </p>
        </Card>
      )}

      {/* Notice Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pr-8">
            <div className="space-y-4">
              <div className="space-y-2">
                <DialogTitle className="text-xl md:text-2xl leading-tight">
                  {selectedNotice?.title}
                </DialogTitle>
                <DialogDescription className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1">
                  <span className="flex items-center gap-1.5 text-sm">
                    <Calendar className="w-4 h-4 text-primary" />
                    {selectedNotice && formatDate(selectedNotice.publishedAt)}
                  </span>
                  <span className="flex items-center gap-1.5 text-sm">
                    <Building className="w-4 h-4 text-primary" />
                    {selectedNotice && getDepartmentName(selectedNotice)}
                  </span>
                  {selectedNotice?.publishedBy && (
                    <span className="flex items-center gap-1.5 text-sm">
                      <Users className="w-4 h-4 text-primary" />
                      {selectedNotice.publishedBy.email}
                    </span>
                  )}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          {selectedNotice && (
            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary">
                    {categoryLabels[selectedNotice.category] || selectedNotice.category}
                  </Badge>
                  {selectedNotice.priority && (
                    <Badge className={cn("border", getPriorityColor(selectedNotice.priority))}>
                      {selectedNotice.priority.charAt(0).toUpperCase() + selectedNotice.priority.slice(1)}{" "}
                      Priority
                    </Badge>
                  )}
                  {selectedNotice.isPinned && (
                    <Badge variant="outline" className="text-warning border-warning">
                      <Pin className="w-3 h-3 mr-1" />
                      Pinned
                    </Badge>
                  )}
                  {isNoticeRead(selectedNotice) && (
                    <Badge variant="outline" className="text-success border-success">
                      <Check className="w-3 h-3 mr-1" />
                      Read
                    </Badge>
                  )}
                </div>
                {!isNoticeRead(selectedNotice) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleMarkAsRead(selectedNotice._id)}
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Mark as Read
                  </Button>
                )}
              </div>
              <div className="prose max-w-none">
                <p className="whitespace-pre-wrap text-foreground">{selectedNotice.content}</p>
              </div>
              {selectedNotice.expiresAt && (
                <div className="pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    <Clock className="w-4 h-4 inline mr-1" />
                    Expires on: {formatDate(selectedNotice.expiresAt)}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Notices;
