import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  FileUp,
  Briefcase,
  Heart,
  Baby,
  GraduationCap,
  Loader2
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { leaveAPI } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

interface LeaveBalance {
  annual: number;
  sick: number;
  casual: number;
  unpaid: number;
}

interface LeaveRecord {
  _id: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  status: string;
  reason?: string;
  reviewerComments?: string;
  createdAt: string;
}

const leaveTypeConfig = [
  { id: "annual", name: "Annual Leave", icon: Briefcase, color: "text-primary" },
  { id: "sick", name: "Sick Leave", icon: Heart, color: "text-destructive" },
  { id: "casual", name: "Casual Leave", icon: GraduationCap, color: "text-warning" },
  { id: "unpaid", name: "Unpaid Leave", icon: Baby, color: "text-muted-foreground" },
];

const Leave = () => {
  const { user } = useAuth();
  const [selectedType, setSelectedType] = useState("");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [isPartialDay, setIsPartialDay] = useState(false);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [leaveBalance, setLeaveBalance] = useState<LeaveBalance>({
    annual: 15,
    sick: 10,
    casual: 5,
    unpaid: 0
  });
  const [leaveHistory, setLeaveHistory] = useState<LeaveRecord[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    fetchLeaveData();
  }, []);

  const fetchLeaveData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch leave history and balance
      const [myLeavesResponse, balanceResponse] = await Promise.all([
        leaveAPI.getMy(),
        leaveAPI.getBalance()
      ]);

      setLeaveHistory(myLeavesResponse.data.data.leaves || []);
      
      if (balanceResponse.data.data.balance) {
        setLeaveBalance(balanceResponse.data.data.balance);
      }

    } catch (err: any) {
      console.error('Error fetching leave data:', err);
      setError(err.response?.data?.message || 'Failed to load leave data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitLeave = async () => {
    if (!selectedType || !startDate || !endDate) {
      setError('Please fill in all required fields');
      return;
    }

    // Reason is required by backend
    if (!reason || reason.trim() === '') {
      setError('Please provide a reason for your leave request');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      // Calculate total days
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const totalDays = isPartialDay ? 0.5 : Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

      const response = await leaveAPI.create({
        leaveType: selectedType,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        totalDays,
        reason: reason.trim(),
        isHalfDay: isPartialDay
      });

      if (response.data.success) {
        setSuccessMessage('Leave request submitted successfully!');
        setSheetOpen(false);
        // Reset form
        setSelectedType("");
        setStartDate(undefined);
        setEndDate(undefined);
        setReason("");
        setIsPartialDay(false);
        // Refresh data
        fetchLeaveData();
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err: any) {
      console.error('Error submitting leave:', err);
      const errorMessage = err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Failed to submit leave request';
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelLeave = async (leaveId: string) => {
    try {
      const response = await leaveAPI.cancel(leaveId);
      if (response.data.success) {
        setSuccessMessage('Leave request cancelled successfully');
        fetchLeaveData();
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err: any) {
      console.error('Error cancelling leave:', err);
      setError(err.response?.data?.message || 'Failed to cancel leave request');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="badge-success"><CheckCircle2 className="w-3 h-3 mr-1" />Approved</Badge>;
      case "pending":
        return <Badge className="bg-warning-light text-warning border-warning/20"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "rejected":
        return <Badge className="badge-destructive"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      case "cancelled":
        return <Badge variant="outline"><XCircle className="w-3 h-3 mr-1" />Cancelled</Badge>;
      default:
        return null;
    }
  };

  const formatLeaveType = (type: string) => {
    const config = leaveTypeConfig.find(t => t.id === type);
    return config?.name || type.charAt(0).toUpperCase() + type.slice(1) + ' Leave';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getLeaveTypeBalance = (type: string) => {
    return leaveBalance[type as keyof LeaveBalance] || 0;
  };

  const getLeaveTypeUsed = (type: string) => {
    return leaveHistory
      .filter(l => l.leaveType === type && l.status === 'approved')
      .reduce((sum, l) => sum + l.totalDays, 0);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-h2 text-foreground">Leave Management</h1>
          <p className="text-muted-foreground mt-1">Request time off and track your leave balance</p>
        </div>
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Request Leave
            </Button>
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="text-h4">New Leave Request</SheetTitle>
            </SheetHeader>
            <div className="space-y-6 mt-6">
              {/* Leave Type */}
              <div className="space-y-2">
                <Label>Leave Type *</Label>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select leave type" />
                  </SelectTrigger>
                  <SelectContent>
                    {leaveTypeConfig.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        <div className="flex items-center gap-2">
                          <type.icon className={cn("w-4 h-4", type.color)} />
                          {type.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Balance Indicator */}
              {selectedType && (
                <Card className="p-4 bg-primary-light/50 border-primary/20">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground">Remaining Balance</span>
                    <span className="text-h4 text-primary">
                      {getLeaveTypeBalance(selectedType)} days
                    </span>
                  </div>
                </Card>
              )}

              {/* Date Selection */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date *</Label>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start", !startDate && "text-muted-foreground")}
                  >
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    {startDate ? format(startDate, "PPP") : "Pick date"}
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label>End Date *</Label>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start", !endDate && "text-muted-foreground")}
                  >
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    {endDate ? format(endDate, "PPP") : "Pick date"}
                  </Button>
                </div>
              </div>

              <Calendar
                mode="range"
                selected={{ from: startDate, to: endDate }}
                onSelect={(range) => {
                  setStartDate(range?.from);
                  setEndDate(range?.to || range?.from);
                }}
                className="rounded-xl border pointer-events-auto"
                disabled={(date) => date < new Date()}
              />

              {/* Partial Day Toggle */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Partial Day</Label>
                  <p className="text-caption">Request half-day leave</p>
                </div>
                <Switch checked={isPartialDay} onCheckedChange={setIsPartialDay} />
              </div>

              {/* Reason */}
              <div className="space-y-2">
                <Label>Reason *</Label>
                <Textarea 
                  placeholder="Briefly describe your reason for leave..." 
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                />
              </div>

              {/* Policy Reminder */}
              <Card className="p-4 bg-secondary/50">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  <p className="text-small text-muted-foreground">
                    Leave requests should be submitted at least 3 days in advance for annual leave. 
                    Emergency sick leave can be requested on the same day.
                  </p>
                </div>
              </Card>

              {error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-destructive text-sm">
                  {error}
                </div>
              )}

              <Button 
                className="w-full" 
                size="lg" 
                onClick={handleSubmitLeave}
                disabled={submitting || !selectedType || !startDate || !endDate || !reason.trim()}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Request'
                )}
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-success/10 border border-success/20 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-success" />
          <p className="text-success">{successMessage}</p>
        </div>
      )}

      {/* Error Message */}
      {error && !sheetOpen && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-destructive" />
          <p className="text-destructive">{error}</p>
        </div>
      )}

      {/* Leave Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {leaveTypeConfig.map((type, index) => {
          const balance = getLeaveTypeBalance(type.id);
          const used = getLeaveTypeUsed(type.id);
          const remaining = balance - used;
          const Icon = type.icon;
          
          return (
            <Card 
              key={type.id} 
              className={cn(
                "kpi-card animate-fade-up",
                `delay-${(index + 1) * 100}`
              )}
            >
              <div className="flex items-center justify-between">
                <div className={cn("w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center")}>
                  <Icon className={cn("w-6 h-6", type.color)} />
                </div>
                <div className="text-right">
                  <p className="text-h3 text-foreground">{remaining}</p>
                  <p className="text-caption">of {balance}</p>
                </div>
              </div>
              <p className="text-sm font-medium text-foreground mt-2">{type.name}</p>
              <div className="w-full bg-secondary rounded-full h-2 mt-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-500"
                  style={{ width: `${balance > 0 ? (remaining / balance) * 100 : 0}%` }}
                />
              </div>
            </Card>
          );
        })}
      </div>

      {/* Leave History */}
      <Card className="dashboard-card">
        <h2 className="text-h5 text-foreground mb-4">Leave History</h2>
        <div className="space-y-3">
          {leaveHistory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CalendarIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No leave requests found</p>
            </div>
          ) : (
            leaveHistory.map((leave) => (
              <div 
                key={leave._id}
                className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <CalendarIcon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{formatLeaveType(leave.leaveType)}</p>
                    <p className="text-caption">
                      {formatDate(leave.startDate)} → {formatDate(leave.endDate)} ({leave.totalDays} day{leave.totalDays > 1 ? 's' : ''})
                    </p>
                    {leave.reason && (
                      <p className="text-xs text-muted-foreground mt-1">{leave.reason}</p>
                    )}
                    {leave.reviewerComments && leave.status !== 'pending' && (
                      <p className="text-xs text-muted-foreground mt-1 italic">
                        Admin: {leave.reviewerComments}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {getStatusBadge(leave.status)}
                  {leave.status === 'pending' && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleCancelLeave(leave._id)}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};

export default Leave;
