import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  FileText,
  CheckCircle2,
  Loader2,
  Headphones,
  DollarSign,
  Users,
  Calendar,
  ArrowUpRight,
  User,
} from "lucide-react";
import { reportAPI } from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface Report {
  _id: string;
  date: string;
  headset: number;
  sales: number; // sales amount
  salesCount?: number;
  salesDetails?: string;
  createdAt: string;
}

interface ManagerReport extends Report {
  employee: {
    _id: string;
    firstName: string;
    lastName: string;
    employeeId: string;
    department?: { name: string };
  };
}

interface Employee {
  _id: string;
  firstName: string;
  lastName: string;
  employeeId: string;
  department?: { name: string };
}

type Period = 'daily' | 'weekly' | 'monthly';

const Report = () => {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [headset, setHeadset] = useState("");
  const [sales, setSales] = useState("");
  const [todayReport, setTodayReport] = useState<Report | null>(null);

  // Manager-specific state
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeHeadset, setSelectedEmployeeHeadset] = useState<string>("");
  const [selectedEmployeeSales, setSelectedEmployeeSales] = useState<string>("");
  const [employeeHeadset, setEmployeeHeadset] = useState("");
  const [employeeSalesAmount, setEmployeeSalesAmount] = useState("");
  const [employeeSalesCount, setEmployeeSalesCount] = useState("");
  const [employeeSalesDetails, setEmployeeSalesDetails] = useState("");
  const [employeeHeadsetSubmitting, setEmployeeHeadsetSubmitting] = useState(false);
  const [employeeSalesSubmitting, setEmployeeSalesSubmitting] = useState(false);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [managerUpdatedReports, setManagerUpdatedReports] = useState<ManagerReport[]>([]);
  const [loadingManagerReports, setLoadingManagerReports] = useState(false);
  const [period, setPeriod] = useState<Period>('daily');
  const [employeeReportDate, setEmployeeReportDate] = useState(new Date().toISOString().split('T')[0]);

  // Update Modal State
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [updatingReport, setUpdatingReport] = useState<Report | null>(null);
  const [updatingEmployee, setUpdatingEmployee] = useState<any>(null);
  const [updatingHeadset, setUpdatingHeadset] = useState("");
  const [updatingSalesAmount, setUpdatingSalesAmount] = useState("");
  const [updatingSalesCount, setUpdatingSalesCount] = useState("");
  const [updatingSalesDetails, setUpdatingSalesDetails] = useState("");
  const [updatingSubmitting, setUpdatingSubmitting] = useState(false);

  // Check if user is a manager (by designation)
  const isManager = useMemo(() => {
    const designation = user?.employee?.designation;
    return designation?.toLowerCase() === 'manager';
  }, [user?.employee?.designation]);

  useEffect(() => {
    fetchTodayReport();
    if (isManager) {
      fetchEmployees();
      fetchManagerUpdatedReports();
    }
  }, [isManager, period]);

  const fetchManagerUpdatedReports = async () => {
    try {
      setLoadingManagerReports(true);
      let startDate, endDate;
      const now = new Date();

      if (period === 'daily') {
        startDate = new Date(now.setHours(0, 0, 0, 0)).toISOString();
      } else if (period === 'weekly') {
        const start = new Date(now.setDate(now.getDate() - now.getDay()));
        startDate = new Date(start.setHours(0, 0, 0, 0)).toISOString();
      } else if (period === 'monthly') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      }

      const res = await reportAPI.getManagerUpdatedReports({
        limit: 100,
        startDate,
        endDate: new Date().toISOString()
      });
      const reports = res.data.data.reports || [];
      setManagerUpdatedReports(reports);
    } catch (error: any) {
      console.error("Error fetching manager updated reports:", error);
    } finally {
      setLoadingManagerReports(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      setLoadingEmployees(true);
      const res = await reportAPI.getEmployees();
      const empList = res.data.data.employees || [];

      // Filter out HR, Admin, Boss, and Manager - only show regular employees
      const filteredEmployees = empList.filter((emp: Employee) => {
        const designation = (emp as any).designation?.toLowerCase() || '';
        const deptName = emp.department?.name?.toLowerCase() || '';
        const isRestricted = ['hr', 'admin', 'boss', 'manager'].some(role =>
          designation.includes(role) || deptName.includes(role)
        );
        return !isRestricted;
      });

      setEmployees(filteredEmployees);
    } catch (error: any) {
      console.error("Error fetching employees:", error);
    } finally {
      setLoadingEmployees(false);
    }
  };

  const handleOpenUpdate = (report: ManagerReport) => {
    setUpdatingEmployee(report.employee);
    setUpdatingReport(report);
    setUpdatingHeadset(report.headset?.toString() || "0");
    setUpdatingSalesAmount(report.sales?.toString() || "0");
    setUpdatingSalesCount(report.salesCount?.toString() || "0");
    setUpdatingSalesDetails(report.salesDetails || "");
    setIsUpdateModalOpen(true);
  };

  const handleDateChange = (newDate: string) => {
    setEmployeeReportDate(newDate);
  };

  const handleHeadsetSubmit = async () => {
    if (!selectedEmployeeHeadset) {
      toast.error("Please select an employee first");
      return;
    }

    const headsetValue = parseFloat(employeeHeadset) || 0;
    if (headsetValue < 0) {
      toast.error("Headset number cannot be negative");
      return;
    }

    setEmployeeHeadsetSubmitting(true);
    try {
      const res = await reportAPI.updateEmployeeReport(selectedEmployeeHeadset, {
        headset: headsetValue,
        date: employeeReportDate
      });

      toast.success(res.data.message || "Headset count added successfully!");
      setEmployeeHeadset("");
      setSelectedEmployeeHeadset("");
      await fetchManagerUpdatedReports();
    } catch (error: any) {
      console.error("Error adding headset report:", error);
      toast.error(error.response?.data?.message || "Failed to add headset report");
    } finally {
      setEmployeeHeadsetSubmitting(false);
    }
  };

  const handleSalesSubmit = async () => {
    if (!selectedEmployeeSales) {
      toast.error("Please select an employee first");
      return;
    }

    const amountValue = parseFloat(employeeSalesAmount) || 0;
    const countValue = parseInt(employeeSalesCount) || 0;

    if (amountValue < 0 || countValue < 0) {
      toast.error("Sales values cannot be negative");
      return;
    }

    setEmployeeSalesSubmitting(true);
    try {
      const res = await reportAPI.updateEmployeeReport(selectedEmployeeSales, {
        sales: amountValue,
        salesCount: countValue,
        salesDetails: employeeSalesDetails,
        date: employeeReportDate
      });

      toast.success(res.data.message || "Sales record added successfully!");
      setEmployeeSalesAmount("");
      setEmployeeSalesCount("");
      setEmployeeSalesDetails("");
      setSelectedEmployeeSales("");
      await fetchManagerUpdatedReports();
    } catch (error: any) {
      console.error("Error adding sales report:", error);
      toast.error(error.response?.data?.message || "Failed to add sales report");
    } finally {
      setEmployeeSalesSubmitting(false);
    }
  };

  const handleUpdateSubmit = async () => {
    if (!updatingEmployee) return;

    const headsetValue = parseFloat(updatingHeadset) || 0;
    const salesAmountValue = parseFloat(updatingSalesAmount) || 0;
    const salesCountValue = parseInt(updatingSalesCount) || 0;

    setUpdatingSubmitting(true);
    try {
      // If we have a specific report ID, use the update API
      // Otherwise, use the legacy create/update API
      if (updatingReport && (updatingReport as any)._id) {
        await reportAPI.updateReport((updatingReport as any)._id, {
          headset: headsetValue,
          sales: salesAmountValue,
          salesCount: salesCountValue,
          salesDetails: updatingSalesDetails,
          date: employeeReportDate
        });
      } else {
        await reportAPI.updateEmployeeReport(updatingEmployee._id, {
          headset: headsetValue,
          sales: salesAmountValue,
          salesCount: salesCountValue,
          salesDetails: updatingSalesDetails,
          date: employeeReportDate
        });
      }

      toast.success("Report updated successfully!");
      setIsUpdateModalOpen(false);
      await fetchManagerUpdatedReports();
    } catch (error: any) {
      console.error("Error updating employee report:", error);
      toast.error(error.response?.data?.message || "Failed to update report");
    } finally {
      setUpdatingSubmitting(false);
    }
  };

  const fetchTodayReport = async () => {
    try {
      const res = await reportAPI.getToday();
      const report = res.data.data.report;
      if (report) {
        setTodayReport(report);
        setHeadset(report.headset?.toString() || "0");
        setSales(report.sales?.toString() || "0");
      } else {
        setHeadset("0");
        setSales("0");
      }
    } catch (error: any) {
      console.error("Error fetching today's report:", error);
      setHeadset("0");
      setSales("0");
    }
  };

  const handleSubmit = async () => {
    const headsetValue = parseFloat(headset) || 0;
    const salesValue = parseFloat(sales) || 0;

    if (headsetValue < 0) {
      toast.error("Headset number cannot be negative");
      return;
    }

    if (salesValue < 0) {
      toast.error("Sales amount cannot be negative");
      return;
    }

    setSubmitting(true);
    try {
      await reportAPI.create({
        headset: headsetValue,
        sales: salesValue
      });

      toast.success(todayReport ? "Report updated successfully!" : "Report submitted successfully!");
      await fetchTodayReport();
    } catch (error: any) {
      console.error("Error submitting report:", error);
      toast.error(error.response?.data?.message || "Failed to submit report");
    } finally {
      setSubmitting(false);
    }
  };

  // Aggregate reports by employee for the selected period
  const aggregatedData = useMemo(() => {
    const data: Record<string, {
      name: string;
      id: string;
      headset: number;
      sales: number;
      salesCount: number;
      count: number;
      firstName: string;
      lastName: string;
    }> = {};

    managerUpdatedReports.forEach(report => {
      const empId = report.employee?._id;
      if (!empId) return;

      if (!data[empId]) {
        data[empId] = {
          name: `${report.employee.firstName} ${report.employee.lastName}`,
          id: report.employee._id,
          headset: 0,
          sales: 0,
          salesCount: 0,
          count: 0,
          firstName: report.employee.firstName,
          lastName: report.employee.lastName
        };
      }

      data[empId].headset += report.headset || 0;
      data[empId].sales += report.sales || 0;
      data[empId].salesCount += report.salesCount || 0;
      data[empId].count += 1;
    });

    return Object.values(data).sort((a, b) => b.sales - a.sales);
  }, [managerUpdatedReports]);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Daily Report</h1>
          <p className="text-muted-foreground mt-1">
            {isManager ? "Manage your reports and track employee progress" : "Submit your daily headset number and sales report"}
          </p>
        </div>

        {isManager && (
          <div className="flex items-center gap-2 bg-muted p-1 rounded-lg">
            {(['daily', 'weekly', 'monthly'] as Period[]).map((p) => (
              <Button
                key={p}
                variant={period === p ? "default" : "ghost"}
                size="sm"
                onClick={() => setPeriod(p)}
                className="capitalize h-8 px-4"
              >
                {p}
              </Button>
            ))}
          </div>
        )}
      </div>

      {isManager && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Form 1: Headset Count */}
            <Card className="p-6 border-blue-500/20 bg-blue-500/5">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center">
                  <Headphones className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Headset Count</h2>
                  <p className="text-xs text-muted-foreground">Log daily headset usage</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Select Employee</Label>
                  <Select value={selectedEmployeeHeadset} onValueChange={setSelectedEmployeeHeadset}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((emp) => (
                        <SelectItem key={emp._id} value={emp._id}>
                          {emp.firstName} {emp.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Headset Count</Label>
                    <Input
                      type="number"
                      value={employeeHeadset}
                      onChange={(e) => setEmployeeHeadset(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={employeeReportDate}
                      onChange={(e) => setEmployeeReportDate(e.target.value)}
                    />
                  </div>
                </div>

                <Button
                  onClick={handleHeadsetSubmit}
                  disabled={employeeHeadsetSubmitting}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {employeeHeadsetSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                  Submit Headset
                </Button>
              </div>
            </Card>

            {/* Form 2: Sales */}
            <Card className="p-6 border-emerald-500/20 bg-emerald-500/5">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Sales Record</h2>
                  <p className="text-xs text-muted-foreground">Log sales performance</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Select Employee</Label>
                  <Select value={selectedEmployeeSales} onValueChange={setSelectedEmployeeSales}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((emp) => (
                        <SelectItem key={emp._id} value={emp._id}>
                          {emp.firstName} {emp.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>No. of Sales</Label>
                    <Input
                      type="number"
                      value={employeeSalesCount}
                      onChange={(e) => setEmployeeSalesCount(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Amount</Label>
                    <Input
                      type="number"
                      value={employeeSalesAmount}
                      onChange={(e) => setEmployeeSalesAmount(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={employeeReportDate}
                      onChange={(e) => setEmployeeReportDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Sales Details</Label>
                  <Input
                    value={employeeSalesDetails}
                    onChange={(e) => setEmployeeSalesDetails(e.target.value)}
                    placeholder="Enter sale details (clients, items, etc.)"
                  />
                </div>

                <Button
                  onClick={handleSalesSubmit}
                  disabled={employeeSalesSubmitting}
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                >
                  {employeeSalesSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                  Submit Sales
                </Button>
              </div>
            </Card>
          </div>

          {/* Progress Overview Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Headphones className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="font-semibold text-lg">Recent Headsets</h3>
              </div>
              <div className="space-y-4">
                {aggregatedData.length === 0 ? (
                  <p className="text-center py-8 text-sm text-muted-foreground">No data for this period</p>
                ) : (
                  aggregatedData.map((data) => (
                    <div key={data.id} className="p-3 rounded-lg border bg-blue-50/30">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{data.name}</span>
                        <span className="font-bold text-blue-600">{data.headset} headsets</span>
                      </div>
                      <div className="mt-2 h-1.5 w-full bg-blue-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${Math.min((data.headset / Math.max(...aggregatedData.map(d => d.headset || 1))) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                </div>
                <h3 className="font-semibold text-lg">Sales Activity</h3>
              </div>
              <div className="space-y-4">
                {managerUpdatedReports.filter(r => (r.salesCount || 0) > 0 || r.sales > 0).length === 0 ? (
                  <p className="text-center py-8 text-sm text-muted-foreground">No sales activity for this period</p>
                ) : (
                  managerUpdatedReports.filter(r => (r.salesCount || 0) > 0 || r.sales > 0).slice(0, 10).map((report) => (
                    <div key={report._id} className="p-3 rounded-lg border bg-emerald-50/30">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">{report.employee.firstName} {report.employee.lastName}</span>
                        <span className="text-xs text-muted-foreground">{new Date(report.date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="space-x-4">
                          <span className="text-sm">Sales: <span className="font-bold">{report.salesCount || 0}</span></span>
                          <span className="text-sm">Amount: <span className="font-bold text-emerald-600">${report.sales.toLocaleString()}</span></span>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => handleOpenUpdate(report)}>Update</Button>
                      </div>
                      {report.salesDetails && (
                        <p className="mt-2 text-xs text-muted-foreground italic border-t pt-1">
                          {report.salesDetails}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </>
      )}

      {/* Individual Report Form */}
      {!isManager && (
        <Card className={cn(
          "p-6 transition-all duration-300",
          todayReport ? "border-green-500/30 bg-green-500/5" : "border-amber-500/30 bg-amber-500/5"
        )}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-colors",
                todayReport ? "bg-green-500 text-white" : "bg-primary text-white"
              )}>
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">
                  {todayReport ? "Your Today's Report" : "Submit Your Report"}
                </h2>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
                  <Calendar className="w-4 h-4" />
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </div>
              </div>
            </div>

            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
              <div className="space-y-1.5 text-center sm:text-left">
                <Label htmlFor="headset" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Headset</Label>
                <Input
                  id="headset"
                  type="number"
                  placeholder="0"
                  className="text-lg font-semibold h-12"
                  value={headset}
                  onChange={(e) => setHeadset(e.target.value)}
                />
              </div>
              <div className="space-y-1.5 text-center sm:text-left">
                <Label htmlFor="sales" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Sales ($)</Label>
                <Input
                  id="sales"
                  type="number"
                  placeholder="0"
                  className="text-lg font-semibold h-12"
                  value={sales}
                  onChange={(e) => setSales(e.target.value)}
                />
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={submitting}
              size="lg"
              className={cn(
                "md:h-24 md:w-40 flex-col gap-2 rounded-2xl transition-all duration-300",
                todayReport ? "bg-green-600 hover:bg-green-700" : "bg-primary hover:bg-primary/90"
              )}
            >
              {submitting ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-6 h-6" />
                  <span className="font-bold">{todayReport ? "Update" : "Submit"}</span>
                </>
              )}
            </Button>
          </div>
        </Card>
      )}

      {/* Shared Update Dialog */}
      <Dialog open={isUpdateModalOpen} onOpenChange={setIsUpdateModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Report: {updatingEmployee?.firstName} {updatingEmployee?.lastName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Headset Count</Label>
              <Input
                type="number"
                value={updatingHeadset}
                onChange={(e) => setUpdatingHeadset(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>No. of Sales</Label>
                <Input
                  type="number"
                  value={updatingSalesCount}
                  onChange={(e) => setUpdatingSalesCount(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Sales Amount</Label>
                <Input
                  type="number"
                  value={updatingSalesAmount}
                  onChange={(e) => setUpdatingSalesAmount(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Sales Details</Label>
              <Input
                value={updatingSalesDetails}
                onChange={(e) => setUpdatingSalesDetails(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUpdateModalOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateSubmit} disabled={updatingSubmitting}>
              {updatingSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Report;
