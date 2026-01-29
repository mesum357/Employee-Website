import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
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
  SheetDescription,
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
  attachments?: Array<{ name: string; url: string }>;
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [leaveHistory, setLeaveHistory] = useState<LeaveRecord[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    fetchLeaveData();
  }, []);

  const fetchLeaveData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await leaveAPI.getMy();
      setLeaveHistory(response.data.data.leaves || []);
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

    if (!reason || reason.trim() === '') {
      setError('Please provide a reason for your leave request');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const formData = new FormData();
      formData.append('leaveType', selectedType);
      formData.append('startDate', startDate.toISOString());
      formData.append('endDate', endDate.toISOString());
      formData.append('reason', reason.trim());
      formData.append('isHalfDay', String(isPartialDay));

      if (selectedFile) {
        formData.append('image', selectedFile);
      }

      const response = await leaveAPI.create(formData);

      if (response.data.success) {
        setSuccessMessage('Leave request submitted successfully!');
        setSheetOpen(false);
        // Reset form
        setSelectedType("");
        setStartDate(undefined);
        setEndDate(undefined);
        setReason("");
        setIsPartialDay(false);
        setSelectedFile(null);
        // Refresh data
        fetchLeaveData();

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-h2 text-foreground">Leave Management</h1>
          <p className="text-muted-foreground mt-1">Request time off and track your leave history</p>
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
              <SheetDescription>
                Fill out the form below to request time off.
              </SheetDescription>
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

              {/* Date Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date *</Label>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal", !startDate && "text-muted-foreground")}
                  >
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    <span className="truncate">{startDate ? format(startDate, "PPP") : "Pick date"}</span>
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label>End Date *</Label>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal", !endDate && "text-muted-foreground")}
                  >
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    <span className="truncate">{endDate ? format(endDate, "PPP") : "Pick date"}</span>
                  </Button>
                </div>
              </div>

              <div className="flex justify-center overflow-x-auto w-full">
                <Calendar
                  mode="range"
                  selected={{ from: startDate, to: endDate }}
                  onSelect={(range) => {
                    setStartDate(range?.from);
                    setEndDate(range?.to || range?.from);
                  }}
                  className="rounded-xl border pointer-events-auto w-fit"
                  disabled={(date) => date < new Date()}
                />
              </div>

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

              {/* Image Upload */}
              <div className="space-y-2">
                <Label>Attachment (Optional)</Label>
                <div className="flex flex-col gap-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setSelectedFile(file);
                    }}
                    className="cursor-pointer"
                  />
                  {selectedFile && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <FileUp className="w-3 h-3" />
                      {selectedFile.name}
                    </p>
                  )}
                  <p className="text-caption text-muted-foreground italic">
                    Upload medical reports or any other supporting document images.
                  </p>
                </div>
              </div>



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
        <div className="bg-success/10 border border-success/20 rounded-lg p-4 flex items-center gap-3 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-success" />
          <p className="text-success">{successMessage}</p>
        </div>
      )}

      {/* Error Message */}
      {error && !sheetOpen && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-center gap-3 animate-fade-in">
          <AlertCircle className="w-5 h-5 text-destructive" />
          <p className="text-destructive">{error}</p>
        </div>
      )}

      {/* Leave History */}
      <Card className="dashboard-card overflow-hidden">
        <div className="p-4 border-b border-border bg-secondary/10">
          <h2 className="text-h5 text-foreground">Leave History</h2>
        </div>
        <div className="divide-y divide-border">
          {leaveHistory.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CalendarIcon className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>No leave requests found</p>
            </div>
          ) : (
            leaveHistory.map((leave) => (
              <div
                key={leave._id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-background hover:bg-secondary/5 transition-colors gap-4"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <CalendarIcon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-foreground">{formatLeaveType(leave.leaveType)}</p>
                      {getStatusBadge(leave.status)}
                    </div>
                    <p className="text-xs sm:text-caption text-muted-foreground mt-1">
                      {formatDate(leave.startDate)} → {formatDate(leave.endDate)}
                      <span className="mx-1.5 opacity-30">•</span>
                      <span className="font-medium text-foreground/70">{leave.totalDays} day{leave.totalDays > 1 ? 's' : ''}</span>
                    </p>
                    {leave.reason && (
                      <p className="text-sm text-foreground/80 mt-3 border-l-2 border-primary/10 pl-3 py-0.5 line-clamp-3 italic leading-relaxed">{leave.reason}</p>
                    )}

                    {leave.attachments && leave.attachments.length > 0 && (
                      <div className="mt-2 flex gap-2">
                        {leave.attachments.map((att, idx) => (
                          <a
                            key={idx}
                            href={att.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline flex items-center gap-1"
                          >
                            <FileUp className="w-3 h-3" />
                            View Attachment
                          </a>
                        ))}
                      </div>
                    )}

                    {leave.reviewerComments && (
                      <div className="mt-2 p-2 rounded bg-secondary/20 border border-border">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Admin Feedback</p>
                        <p className="text-xs text-foreground mt-0.5">{leave.reviewerComments}</p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center sm:justify-end gap-3 shrink-0">
                  {leave.status === 'pending' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive border-destructive/20 hover:bg-destructive/10"
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
