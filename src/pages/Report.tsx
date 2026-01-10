import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { 
  FileText, 
  CheckCircle2, 
  Loader2, 
  Calendar,
  Headphones,
  DollarSign,
} from "lucide-react";
import { reportAPI } from "@/lib/api";
import { toast } from "sonner";

interface Report {
  _id: string;
  date: string;
  headset: boolean;
  sales: number;
  createdAt: string;
}

const Report = () => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [headset, setHeadset] = useState(false);
  const [sales, setSales] = useState("");
  const [todayReport, setTodayReport] = useState<Report | null>(null);
  const [reportHistory, setReportHistory] = useState<Report[]>([]);

  useEffect(() => {
    fetchTodayReport();
    fetchReportHistory();
  }, []);

  const fetchTodayReport = async () => {
    try {
      const res = await reportAPI.getToday();
      const report = res.data.data.report;
      if (report) {
        setTodayReport(report);
        setHeadset(report.headset || false);
        setSales(report.sales?.toString() || "0");
      }
    } catch (error: any) {
      console.error("Error fetching today's report:", error);
    }
  };

  const fetchReportHistory = async () => {
    try {
      setLoading(true);
      const res = await reportAPI.getMy({ limit: 30 });
      const reports = res.data.data.reports || [];
      setReportHistory(reports);
    } catch (error: any) {
      console.error("Error fetching report history:", error);
      toast.error("Failed to load report history");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    const salesValue = parseFloat(sales) || 0;
    
    if (salesValue < 0) {
      toast.error("Sales amount cannot be negative");
      return;
    }

    setSubmitting(true);
    try {
      const res = await reportAPI.create({
        headset,
        sales: salesValue
      });
      
      toast.success(todayReport ? "Report updated successfully!" : "Report submitted successfully!", {
        description: `Date: ${new Date().toLocaleDateString()}`,
      });
      
      // Refresh data
      await fetchTodayReport();
      await fetchReportHistory();
    } catch (error: any) {
      console.error("Error submitting report:", error);
      toast.error(error.response?.data?.message || "Failed to submit report");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Daily Report</h1>
        <p className="text-muted-foreground mt-1">
          Submit your daily headset usage and sales report
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Report Form */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary-light flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                {todayReport ? "Update Today's Report" : "Submit Today's Report"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Headset Checkbox */}
            <div className="space-y-2">
              <Label htmlFor="headset" className="text-base font-medium flex items-center gap-2">
                <Headphones className="w-5 h-5" />
                Headset
              </Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="headset"
                  checked={headset}
                  onCheckedChange={(checked) => setHeadset(checked === true)}
                />
                <label
                  htmlFor="headset"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  I used headset today
                </label>
              </div>
            </div>

            {/* Sales Input */}
            <div className="space-y-2">
              <Label htmlFor="sales" className="text-base font-medium flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Sales
              </Label>
              <Input
                id="sales"
                type="number"
                placeholder="Enter sales amount"
                value={sales}
                onChange={(e) => setSales(e.target.value)}
                min="0"
                step="0.01"
              />
              <p className="text-xs text-muted-foreground">
                Enter your total sales for today
              </p>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full"
              size="lg"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {todayReport ? "Updating..." : "Submitting..."}
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  {todayReport ? "Update Report" : "Submit Report"}
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Report History */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary-light flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">Report History</h2>
              <p className="text-sm text-muted-foreground">
                Your last 30 reports
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : reportHistory.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">No reports found</p>
              <p className="text-xs mt-1">Start submitting daily reports to see your history</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {reportHistory.map((report) => (
                <div
                  key={report._id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border bg-card hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-sm">{formatDate(report.date)}</p>
                      {new Date(report.date).toDateString() === new Date().toDateString() && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                          Today
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Headphones className="w-4 h-4" />
                        <span>{report.headset ? "Yes" : "No"}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        <span>{report.sales?.toLocaleString() || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Report;
