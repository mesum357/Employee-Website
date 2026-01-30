import { useState, useEffect } from "react";
import {
  Calendar,
  Video,
  Users,
  Clock,
  MapPin,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn, formatExternalUrl } from "@/lib/utils";
import { meetingAPI } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Meeting {
  _id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location?: string;
  meetingType: "in-person" | "virtual" | "hybrid";
  meetingLink?: string;
  status: "scheduled" | "in-progress" | "completed" | "cancelled" | "postponed";
  organizer: {
    _id: string;
    email: string;
  };
  attendees: Array<{
    employee: {
      _id: string;
      firstName: string;
      lastName: string;
      employeeId: string;
    };
    status: "pending" | "accepted" | "declined" | "tentative";
  }>;
  createdAt: string;
}

export default function Meetings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [upcomingMeetings, setUpcomingMeetings] = useState<Meeting[]>([]);
  const [todayMeetings, setTodayMeetings] = useState<Meeting[]>([]);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("upcoming");
  const [responding, setResponding] = useState(false);

  useEffect(() => {
    fetchMeetings();
  }, []);

  // Real-time refresh listener
  useEffect(() => {
    const handleRefresh = () => {
      fetchMeetings();
    };

    window.addEventListener('refreshMeetings', handleRefresh);

    return () => {
      window.removeEventListener('refreshMeetings', handleRefresh);
    };
  }, []);

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      const [allRes, upcomingRes, todayRes] = await Promise.all([
        meetingAPI.getAll({ status: "scheduled,in-progress" }),
        meetingAPI.getUpcoming(),
        meetingAPI.getToday(),
      ]);

      const allMeetings = allRes.data.data.meetings || [];
      setMeetings(allMeetings);
      setUpcomingMeetings(upcomingRes.data.data.meetings || []);
      setTodayMeetings(todayRes.data.data.meetings || []);
    } catch (error: any) {
      console.error("Error fetching meetings:", error);
      toast.error("Failed to load meetings");
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (meetingId: string, response: "accepted" | "declined" | "tentative") => {
    try {
      setResponding(true);
      await meetingAPI.respond(meetingId, response);

      toast.success(`Meeting ${response} successfully`);

      await fetchMeetings();
      if (selectedMeeting?._id === meetingId) {
        const updated = await meetingAPI.getById(meetingId);
        setSelectedMeeting(updated.data.data.meeting);
      }
    } catch (error: any) {
      console.error("Error responding to meeting:", error);
      toast.error(error.response?.data?.message || "Failed to respond to meeting");
    } finally {
      setResponding(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDateTime = (dateString: string) => {
    return `${formatDate(dateString)} • ${formatTime(dateString)}`;
  };

  const getDuration = (startTime: string, endTime: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const minutes = Math.round((end.getTime() - start.getTime()) / 60000);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const getMyAttendanceStatus = (meeting: Meeting) => {
    if (!user?.employee) return null;
    const attendee = meeting.attendees.find(
      (a) => a.employee._id === user.employee?.id
    );
    return attendee?.status || null;
  };

  const handleViewMeeting = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    setViewDialogOpen(true);
  };

  const displayMeetings = activeTab === "upcoming" ? upcomingMeetings : activeTab === "today" ? todayMeetings : meetings;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-h2 text-foreground">Meetings</h1>
          <p className="text-muted-foreground mt-1">View and join your scheduled meetings</p>
        </div>
        <Button variant="outline" onClick={fetchMeetings} disabled={loading}>
          <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full max-w-xl bg-secondary/50 p-1 rounded-2xl">
          <TabsTrigger value="today" className="flex-1 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm">
            Today
          </TabsTrigger>
          <TabsTrigger value="upcoming" className="flex-1 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm">
            Upcoming
          </TabsTrigger>
          <TabsTrigger value="all" className="flex-1 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm">
            All Meetings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="mt-6">
          <div className="space-y-4">
            {todayMeetings.length === 0 ? (
              <div className="dashboard-card text-center py-12">
                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
                <p className="text-muted-foreground">No meetings scheduled for today</p>
              </div>
            ) : (
              todayMeetings.map((meeting) => {
                const myStatus = getMyAttendanceStatus(meeting);
                return (
                  <div
                    key={meeting._id}
                    className="dashboard-card p-4 sm:p-6 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleViewMeeting(meeting)}
                  >
                    <div className="flex flex-col md:flex-row items-start gap-4">
                      <div className="w-full md:w-14 h-12 md:h-14 rounded-xl bg-primary-light flex flex-row md:flex-col items-center justify-center flex-shrink-0 gap-2 md:gap-0">
                        <Calendar className="w-5 h-5 text-primary mb-0 md:mb-0.5" />
                        <span className="text-xs font-medium text-primary uppercase">{getDuration(meeting.startTime, meeting.endTime)}</span>
                      </div>
                      <div className="flex-1 min-w-0 w-full">
                        <div className="flex flex-col sm:flex-row items-start justify-between gap-2 mb-2">
                          <div className="min-w-0">
                            <h3 className="text-base sm:text-h4 text-foreground font-semibold truncate">{meeting.title}</h3>
                            <p className="text-sm text-muted-foreground mt-1">{formatDateTime(meeting.startTime)}</p>
                          </div>
                          {myStatus && (
                            <span
                              className={cn(
                                "px-2 py-1 rounded-full text-[10px] sm:text-xs font-medium whitespace-nowrap self-start sm:self-center",
                                myStatus === "accepted" && "bg-success-light text-success",
                                myStatus === "declined" && "bg-destructive-light text-destructive",
                                myStatus === "tentative" && "bg-warning-light text-warning",
                                myStatus === "pending" && "bg-muted text-muted-foreground"
                              )}
                            >
                              {myStatus.charAt(0).toUpperCase() + myStatus.slice(1)}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs sm:text-sm text-muted-foreground mt-2">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {formatTime(meeting.startTime)} - {formatTime(meeting.endTime)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" />
                            {meeting.attendees.length} attendees
                          </span>
                          {meeting.location && (
                            <span className="flex items-center gap-1 min-w-0 truncate">
                              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                              <span className="truncate">{meeting.location}</span>
                            </span>
                          )}
                        </div>
                        {meeting.description && (
                          <p className="text-xs sm:text-sm text-muted-foreground mt-2 line-clamp-2">{meeting.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-2 md:mt-0 w-full md:w-auto" onClick={(e) => e.stopPropagation()}>
                        {meeting.meetingLink && (
                          <Button
                            size="sm"
                            className="flex-1 md:flex-none gap-1.5"
                            onClick={() => window.open(formatExternalUrl(meeting.meetingLink), "_blank")}
                          >
                            <Video className="w-4 h-4" />
                            Join
                          </Button>
                        )}
                        <Button size="sm" variant="outline" className="flex-1 md:flex-none" onClick={() => handleViewMeeting(meeting)}>
                          Details
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </TabsContent>

        <TabsContent value="upcoming" className="mt-6">
          <div className="space-y-4">
            {upcomingMeetings.length === 0 ? (
              <div className="dashboard-card text-center py-12">
                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
                <p className="text-muted-foreground">No upcoming meetings</p>
              </div>
            ) : (
              upcomingMeetings.map((meeting) => {
                const myStatus = getMyAttendanceStatus(meeting);
                return (
                  <div
                    key={meeting._id}
                    className="dashboard-card p-4 sm:p-6 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleViewMeeting(meeting)}
                  >
                    <div className="flex flex-col md:flex-row items-start gap-4">
                      <div className="w-full md:w-14 h-12 md:h-14 rounded-xl bg-primary-light flex flex-row md:flex-col items-center justify-center flex-shrink-0 gap-2 md:gap-0">
                        <Calendar className="w-5 h-5 text-primary mb-0 md:mb-0.5" />
                        <span className="text-xs font-medium text-primary uppercase">{getDuration(meeting.startTime, meeting.endTime)}</span>
                      </div>
                      <div className="flex-1 min-w-0 w-full">
                        <div className="flex flex-col sm:flex-row items-start justify-between gap-2 mb-2">
                          <div className="min-w-0">
                            <h3 className="text-base sm:text-h4 text-foreground font-semibold truncate">{meeting.title}</h3>
                            <p className="text-sm text-muted-foreground mt-1">{formatDateTime(meeting.startTime)}</p>
                          </div>
                          {myStatus && (
                            <span
                              className={cn(
                                "px-2 py-1 rounded-full text-[10px] sm:text-xs font-medium whitespace-nowrap self-start sm:self-center",
                                myStatus === "accepted" && "bg-success-light text-success",
                                myStatus === "declined" && "bg-destructive-light text-destructive",
                                myStatus === "tentative" && "bg-warning-light text-warning",
                                myStatus === "pending" && "bg-muted text-muted-foreground"
                              )}
                            >
                              {myStatus.charAt(0).toUpperCase() + myStatus.slice(1)}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs sm:text-sm text-muted-foreground mt-2">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {formatTime(meeting.startTime)} - {formatTime(meeting.endTime)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" />
                            {meeting.attendees.length} attendees
                          </span>
                          {meeting.location && (
                            <span className="flex items-center gap-1 min-w-0 truncate">
                              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                              <span className="truncate">{meeting.location}</span>
                            </span>
                          )}
                        </div>
                        {meeting.description && (
                          <p className="text-xs sm:text-sm text-muted-foreground mt-2 line-clamp-2">{meeting.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-2 md:mt-0 w-full md:w-auto" onClick={(e) => e.stopPropagation()}>
                        {meeting.meetingLink && (
                          <Button
                            size="sm"
                            className="flex-1 md:flex-none gap-1.5"
                            onClick={() => window.open(formatExternalUrl(meeting.meetingLink), "_blank")}
                          >
                            <Video className="w-4 h-4" />
                            Join
                          </Button>
                        )}
                        <Button size="sm" variant="outline" className="flex-1 md:flex-none" onClick={() => handleViewMeeting(meeting)}>
                          Details
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </TabsContent>

        <TabsContent value="all" className="mt-6">
          <div className="space-y-4">
            {meetings.length === 0 ? (
              <div className="dashboard-card text-center py-12">
                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
                <p className="text-muted-foreground">No meetings found</p>
              </div>
            ) : (
              meetings.map((meeting) => {
                const myStatus = getMyAttendanceStatus(meeting);
                return (
                  <div
                    key={meeting._id}
                    className="dashboard-card p-4 sm:p-6 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleViewMeeting(meeting)}
                  >
                    <div className="flex flex-col md:flex-row items-start gap-4">
                      <div className="w-full md:w-14 h-12 md:h-14 rounded-xl bg-primary-light flex flex-row md:flex-col items-center justify-center flex-shrink-0 gap-2 md:gap-0">
                        <Calendar className="w-5 h-5 text-primary mb-0 md:mb-0.5" />
                        <span className="text-xs font-medium text-primary uppercase">{getDuration(meeting.startTime, meeting.endTime)}</span>
                      </div>
                      <div className="flex-1 min-w-0 w-full">
                        <div className="flex flex-col sm:flex-row items-start justify-between gap-2 mb-2">
                          <div className="min-w-0">
                            <h3 className="text-base sm:text-h4 text-foreground font-semibold truncate">{meeting.title}</h3>
                            <p className="text-sm text-muted-foreground mt-1">{formatDateTime(meeting.startTime)}</p>
                          </div>
                          <div className="flex items-center gap-2 self-start sm:self-center">
                            {myStatus && (
                              <span
                                className={cn(
                                  "px-2 py-1 rounded-full text-[10px] sm:text-xs font-medium whitespace-nowrap",
                                  myStatus === "accepted" && "bg-success-light text-success",
                                  myStatus === "declined" && "bg-destructive-light text-destructive",
                                  myStatus === "tentative" && "bg-warning-light text-warning",
                                  myStatus === "pending" && "bg-muted text-muted-foreground"
                                )}
                              >
                                {myStatus.charAt(0).toUpperCase() + myStatus.slice(1)}
                              </span>
                            )}
                            <span
                              className={cn(
                                "px-2 py-1 rounded-full text-[10px] sm:text-xs font-medium capitalize",
                                meeting.status === "scheduled" && "bg-primary-light text-primary",
                                meeting.status === "in-progress" && "bg-warning-light text-warning",
                                meeting.status === "completed" && "bg-success-light text-success",
                                meeting.status === "cancelled" && "bg-destructive-light text-destructive"
                              )}
                            >
                              {meeting.status}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs sm:text-sm text-muted-foreground mt-2">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {formatTime(meeting.startTime)} - {formatTime(meeting.endTime)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" />
                            {meeting.attendees.length} attendees
                          </span>
                          {meeting.location && (
                            <span className="flex items-center gap-1 min-w-0 truncate">
                              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                              <span className="truncate">{meeting.location}</span>
                            </span>
                          )}
                        </div>
                        {meeting.description && (
                          <p className="text-xs sm:text-sm text-muted-foreground mt-2 line-clamp-2">{meeting.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-2 md:mt-0 w-full md:w-auto" onClick={(e) => e.stopPropagation()}>
                        {meeting.meetingLink && meeting.status !== "completed" && meeting.status !== "cancelled" && (
                          <Button
                            size="sm"
                            className="flex-1 md:flex-none gap-1.5"
                            onClick={() => window.open(formatExternalUrl(meeting.meetingLink), "_blank")}
                          >
                            <Video className="w-4 h-4" />
                            Join
                          </Button>
                        )}
                        <Button size="sm" variant="outline" className="flex-1 md:flex-none" onClick={() => handleViewMeeting(meeting)}>
                          Details
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* View Meeting Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              {selectedMeeting?.title}
            </DialogTitle>
            <DialogDescription>{selectedMeeting && formatDateTime(selectedMeeting.startTime)}</DialogDescription>
          </DialogHeader>

          {selectedMeeting && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Start Time</label>
                  <p className="font-medium">{formatDateTime(selectedMeeting.startTime)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">End Time</label>
                  <p className="font-medium">{formatDateTime(selectedMeeting.endTime)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Duration</label>
                  <p className="font-medium">{getDuration(selectedMeeting.startTime, selectedMeeting.endTime)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Type</label>
                  <p className="font-medium capitalize">{selectedMeeting.meetingType}</p>
                </div>
                {selectedMeeting.location && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Location</label>
                    <p className="font-medium">{selectedMeeting.location}</p>
                  </div>
                )}
                {selectedMeeting.meetingLink && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Meeting Link</label>
                    <div className="flex items-center gap-2 mt-1">
                      <a
                        href={formatExternalUrl(selectedMeeting.meetingLink)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-primary hover:underline flex items-center gap-1"
                      >
                        {selectedMeeting.meetingLink}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {selectedMeeting.description && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Description</label>
                  <p className="mt-1 text-sm whitespace-pre-wrap">{selectedMeeting.description}</p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Attendees ({selectedMeeting.attendees.length})
                </label>
                <div className="border rounded-lg p-4 max-h-60 overflow-y-auto">
                  <div className="space-y-3">
                    {selectedMeeting.attendees.map((attendee, index) => {
                      const isMe = attendee.employee._id === user?.employee?.id;
                      return (
                        <div key={index} className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm">
                              {attendee.employee.firstName} {attendee.employee.lastName}
                              {isMe && <span className="text-xs text-muted-foreground ml-2">(You)</span>}
                            </p>
                            <p className="text-xs text-muted-foreground">{attendee.employee.employeeId}</p>
                          </div>
                          <span
                            className={cn(
                              "px-2 py-1 rounded-full text-xs font-medium",
                              attendee.status === "accepted" && "bg-success-light text-success",
                              attendee.status === "declined" && "bg-destructive-light text-destructive",
                              attendee.status === "tentative" && "bg-warning-light text-warning",
                              attendee.status === "pending" && "bg-muted text-muted-foreground"
                            )}
                          >
                            {attendee.status.charAt(0).toUpperCase() + attendee.status.slice(1)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {getMyAttendanceStatus(selectedMeeting) === "pending" && (
                <div className="border-t pt-4">
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">Your Response</label>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      className="gap-2"
                      onClick={() => handleRespond(selectedMeeting._id, "accepted")}
                      disabled={responding}
                    >
                      <CheckCircle className="w-4 h-4" />
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-2"
                      onClick={() => handleRespond(selectedMeeting._id, "tentative")}
                      disabled={responding}
                    >
                      <AlertCircle className="w-4 h-4" />
                      Tentative
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-2 text-destructive hover:text-destructive"
                      onClick={() => handleRespond(selectedMeeting._id, "declined")}
                      disabled={responding}
                    >
                      <XCircle className="w-4 h-4" />
                      Decline
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            {selectedMeeting?.meetingLink && selectedMeeting.status !== "completed" && selectedMeeting.status !== "cancelled" && (
              <Button onClick={() => window.open(formatExternalUrl(selectedMeeting.meetingLink), "_blank")}>
                <Video className="w-4 h-4 mr-2" />
                Join Meeting
              </Button>
            )}
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
