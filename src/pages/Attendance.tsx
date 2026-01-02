import { useState, useEffect } from "react";
import { 
  MapPin, 
  Check, 
  Clock,
  Calendar,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { attendanceAPI } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

interface AttendanceRecord {
  _id: string;
  date: string;
  checkIn?: {
    time: string;
    ipAddress?: string;
  };
  checkOut?: {
    time: string;
    ipAddress?: string;
  };
  status: string;
  workingHours?: number;
}

interface TodayStatus {
  attendance: AttendanceRecord | null;
  isCheckedIn: boolean;
  isCheckedOut: boolean;
}

const Attendance = () => {
  const { user } = useAuth();
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [isClockedOut, setIsClockedOut] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [punchHistory, setPunchHistory] = useState<AttendanceRecord[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord | null>(null);
  const [clockInTime, setClockInTime] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [monthlyAttendance, setMonthlyAttendance] = useState<AttendanceRecord[]>([]);

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch today's attendance status and punch history
  useEffect(() => {
    fetchAttendanceData();
  }, [currentMonth]);

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch today's status
      const todayResponse = await attendanceAPI.getToday();
      const todayData: TodayStatus = todayResponse.data.data;
      
      setIsClockedIn(todayData.isCheckedIn);
      setIsClockedOut(todayData.isCheckedOut);
      setTodayAttendance(todayData.attendance);
      
      if (todayData.attendance?.checkIn?.time) {
        setClockInTime(new Date(todayData.attendance.checkIn.time).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        }));
      }

      // Fetch monthly attendance for history and calendar
      const month = currentMonth.getMonth() + 1;
      const year = currentMonth.getFullYear();
      const myAttendanceResponse = await attendanceAPI.getMy(month, year);
      const attendanceData = myAttendanceResponse.data.data.attendance || [];
      
      setPunchHistory(attendanceData);
      setMonthlyAttendance(attendanceData);

    } catch (err: any) {
      console.error('Error fetching attendance:', err);
      setError(err.response?.data?.message || 'Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  };

  const handleClockIn = async () => {
    try {
      setActionLoading(true);
      setError(null);
      
      const response = await attendanceAPI.checkIn();
      
      if (response.data.success) {
        setIsClockedIn(true);
        setTodayAttendance(response.data.data.attendance);
        setClockInTime(new Date().toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        }));
        // Refresh data
        fetchAttendanceData();
      }
    } catch (err: any) {
      console.error('Clock in error:', err);
      setError(err.response?.data?.message || 'Failed to clock in');
    } finally {
      setActionLoading(false);
    }
  };

  const handleClockOut = async () => {
    try {
      setActionLoading(true);
      setError(null);
      
      const response = await attendanceAPI.checkOut();
      
      if (response.data.success) {
        setIsClockedOut(true);
        setTodayAttendance(response.data.data.attendance);
        // Refresh data
        fetchAttendanceData();
      }
    } catch (err: any) {
      console.error('Clock out error:', err);
      setError(err.response?.data?.message || 'Failed to clock out');
    } finally {
      setActionLoading(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatRecordDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatRecordTime = (timeString: string | undefined) => {
    if (!timeString) return '-';
    return new Date(timeString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const calculateWorkHours = (checkIn?: { time: string }, checkOut?: { time: string }) => {
    if (!checkIn?.time || !checkOut?.time) return '-';
    const inTime = new Date(checkIn.time);
    const outTime = new Date(checkOut.time);
    const diffMs = outTime.getTime() - inTime.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const getStatusBadge = (record: AttendanceRecord) => {
    if (record.checkOut?.time) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-success-light text-success">
          <Check className="w-3 h-3" />
          Complete
        </span>
      );
    }
    if (record.checkIn?.time) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-warning/10 text-warning">
          <Clock className="w-3 h-3" />
          In Progress
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-destructive/10 text-destructive">
        Absent
      </span>
    );
  };

  // Calculate worked time since clock in
  const getWorkedTime = () => {
    if (!todayAttendance?.checkIn?.time) return null;
    
    const checkInTime = new Date(todayAttendance.checkIn.time);
    const endTime = todayAttendance.checkOut?.time 
      ? new Date(todayAttendance.checkOut.time) 
      : new Date();
    
    const diffMs = endTime.getTime() - checkInTime.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  // Navigate months
  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  // Get days in current month for calendar
  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return { firstDay, daysInMonth };
  };

  // Check if a date has attendance
  const getDateAttendance = (day: number) => {
    const dateStr = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day).toDateString();
    return monthlyAttendance.find(a => new Date(a.date).toDateString() === dateStr);
  };

  const { firstDay, daysInMonth } = getDaysInMonth();
  const isToday = (day: number) => {
    const today = new Date();
    return today.getDate() === day && 
           today.getMonth() === currentMonth.getMonth() && 
           today.getFullYear() === currentMonth.getFullYear();
  };

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
      <div>
        <h1 className="text-h2 text-foreground">Attendance</h1>
        <p className="text-muted-foreground mt-1">Track your daily attendance and punch history.</p>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-destructive" />
          <p className="text-destructive">{error}</p>
        </div>
      )}

      {/* Clock Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Clock In/Out Card */}
        <div className="dashboard-card flex flex-col items-center py-10">
          <div className="text-center mb-6">
            <p className="text-muted-foreground">{formatDate(currentTime)}</p>
            <p className="text-display text-foreground mt-2 font-mono tracking-wider">
              {formatTime(currentTime)}
            </p>
          </div>

          {/* Status Badge */}
          <div className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full mb-8",
            isClockedIn && !isClockedOut
              ? "bg-success-light text-success" 
              : isClockedOut
              ? "bg-muted text-muted-foreground"
              : "bg-muted text-muted-foreground"
          )}>
            <div className={cn(
              "w-2 h-2 rounded-full",
              isClockedIn && !isClockedOut ? "bg-success animate-pulse" : "bg-muted-foreground"
            )} />
            <span className="font-medium text-sm">
              {isClockedOut 
                ? "Clocked Out for Today" 
                : isClockedIn 
                ? "Currently Clocked In" 
                : "Not Clocked In"}
            </span>
          </div>

          {/* Clock Button */}
          {!isClockedOut ? (
            <button
              onClick={isClockedIn ? handleClockOut : handleClockIn}
              disabled={actionLoading}
              className={cn(
                "clock-btn",
                isClockedIn ? "clock-btn-out" : "clock-btn-in",
                isClockedIn && "pulse-glow",
                actionLoading && "opacity-50 cursor-not-allowed"
              )}
            >
              <div className="text-center">
                {actionLoading ? (
                  <Loader2 className="w-10 h-10 mx-auto mb-2 animate-spin" />
                ) : (
                  <Clock className="w-10 h-10 mx-auto mb-2" />
                )}
                <span>{isClockedIn ? "Clock Out" : "Clock In"}</span>
              </div>
            </button>
          ) : (
            <div className="w-36 h-36 rounded-full bg-muted flex items-center justify-center">
              <div className="text-center">
                <Check className="w-10 h-10 mx-auto mb-2 text-success" />
                <span className="text-muted-foreground">Day Complete</span>
              </div>
            </div>
          )}

          {/* Location */}
          <div className="flex items-center gap-2 mt-8 text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span className="text-sm">Main Office</span>
            <Check className="w-4 h-4 text-success" />
          </div>

          {isClockedIn && clockInTime && (
            <p className="text-sm text-muted-foreground mt-4">
              Clocked in since <span className="font-medium text-foreground">{clockInTime}</span>
              {getWorkedTime() && (
                <>
                  <span className="mx-2">•</span>
                  <span className="font-medium text-success">{getWorkedTime()} worked</span>
                </>
              )}
            </p>
          )}
        </div>

        {/* Monthly Calendar Preview */}
        <div className="dashboard-card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-h4 text-foreground">
              {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h3>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" onClick={prevMonth}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={nextMonth}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 text-center mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-xs text-muted-foreground font-medium py-2">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells for starting day */}
            {[...Array(firstDay)].map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}
            {/* Days of month */}
            {[...Array(daysInMonth)].map((_, i) => {
              const day = i + 1;
              const dayAttendance = getDateAttendance(day);
              const isWeekend = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day).getDay() % 6 === 0;
              const hasCheckIn = dayAttendance?.checkIn?.time;
              const hasCheckOut = dayAttendance?.checkOut?.time;
              
              return (
                <div 
                  key={day}
                  className={cn(
                    "aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-colors cursor-pointer hover:bg-secondary",
                    isToday(day) && "bg-primary text-primary-foreground hover:bg-primary",
                    hasCheckIn && hasCheckOut && !isToday(day) && "bg-success-light text-success",
                    hasCheckIn && !hasCheckOut && !isToday(day) && "bg-warning/10 text-warning",
                    isWeekend && !hasCheckIn && "text-muted-foreground"
                  )}
                >
                  {day}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-6 mt-6 pt-4 border-t border-border">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-success" />
              <span className="text-sm text-muted-foreground">Present</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-warning" />
              <span className="text-sm text-muted-foreground">In Progress</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary" />
              <span className="text-sm text-muted-foreground">Today</span>
            </div>
          </div>
        </div>
      </div>

      {/* Punch History */}
      <div className="dashboard-card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-light flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <h3 className="text-h4 text-foreground">Punch History</h3>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Date</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Clock In</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Clock Out</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Total Hours</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {punchHistory.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted-foreground">
                    No attendance records found for this month
                  </td>
                </tr>
              ) : (
                punchHistory.map((record) => (
                  <tr 
                    key={record._id} 
                    className="border-b border-border/50 hover:bg-secondary/50 transition-colors"
                  >
                    <td className="py-4 px-4 font-medium text-foreground">
                      {formatRecordDate(record.date)}
                    </td>
                    <td className="py-4 px-4 text-muted-foreground">
                      {formatRecordTime(record.checkIn?.time)}
                    </td>
                    <td className="py-4 px-4 text-muted-foreground">
                      {formatRecordTime(record.checkOut?.time)}
                    </td>
                    <td className="py-4 px-4 font-medium text-foreground">
                      {calculateWorkHours(record.checkIn, record.checkOut)}
                    </td>
                    <td className="py-4 px-4">
                      {getStatusBadge(record)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Attendance;
