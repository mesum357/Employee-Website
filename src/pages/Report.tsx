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
  Filter,
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
  sales: number;
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
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [employeeHeadset, setEmployeeHeadset] = useState("");
  const [employeeSales, setEmployeeSales] = useState("");
  const [employeeSubmitting, setEmployeeSubmitting] = useState(false);
  const [employeeTodayReport, setEmployeeTodayReport] = useState<Report | null>(null);
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
  const [updatingSales, setUpdatingSales] = useState("");
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
      // Now checking designation instead of department name where applicable
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

  const fetchEmployeeReportByDate = async (employeeId: string, date: string) => {
    try {
      const res = await reportAPI.getEmployeeTodayReport(employeeId, date);
      const report = res.data.data.report;
      if (report) {
        setEmployeeTodayReport(report);
        setEmployeeHeadset(report.headset?.toString() || "0");
        setEmployeeSales(report.sales?.toString() || "10");
      } else {
        setEmployeeTodayReport(null);
        setEmployeeHeadset("0");
        setEmployeeSales("10");
      }
    } catch (error: any) {
      console.error("Error fetching employee's report:", error);
      setEmployeeTodayReport(null);
      setEmployeeHeadset("0");
      setEmployeeSales("10");
    }
  };

  const handleEmployeeSelect = (employeeId: string) => {
    setSelectedEmployee(employeeId);
    // Don't auto-fetch for sidebar form anymore as it's "Add only"
    setEmployeeHeadset("0");
    setEmployeeSales("10");
  };

  const handleOpenUpdate = async (employeeId: string) => {
    const emp = employees.find(e => e._id === employeeId);
    setUpdatingEmployee(emp);

    try {
      const res = await reportAPI.getEmployeeTodayReport(employeeId, employeeReportDate);
      const report = res.data.data.report;
      if (report) {
        setUpdatingReport(report);
        setUpdatingHeadset(report.headset?.toString() || "0");
        setUpdatingSales(report.sales?.toString() || "10");
      } else {
        setUpdatingReport(null);
        setUpdatingHeadset("0");
        setUpdatingSales("10");
      }
      setIsUpdateModalOpen(true);
    } catch (error) {
      console.error("Error fetching report for update:", error);
      toast.error("Failed to load report data");
    }
  };

  const handleDateChange = (newDate: string) => {
    setEmployeeReportDate(newDate);
    // Sidebar form stays "Add only", no auto-fetch
  };

  const handleEmployeeSubmit = async () => {
    if (!selectedEmployee) {
      toast.error("Please select an employee first");
      return;
    }

    const headsetValue = parseFloat(employeeHeadset) || 0;
    const salesValue = parseFloat(employeeSales) || 0;

    if (headsetValue < 0) {
      toast.error("Headset number cannot be negative");
      return;
    }

    if (salesValue < 0) {
      toast.error("Sales amount cannot be negative");
      return;
    }

    setEmployeeSubmitting(true);
    try {
      const res = await reportAPI.updateEmployeeReport(selectedEmployee, {
        headset: headsetValue,
        sales: salesValue,
        date: employeeReportDate
      });

      toast.success(res.data.message || "Report added successfully!", {
        description: `Date: ${new Date(employeeReportDate).toLocaleDateString()}`,
      });

      // Clear form after add
      setSelectedEmployee("");
      setEmployeeHeadset("0");
      setEmployeeSales("10");

      await fetchManagerUpdatedReports();
    } catch (error: any) {
      console.error("Error adding employee report:", error);
      toast.error(error.response?.data?.message || "Failed to add report");
    } finally {
      setEmployeeSubmitting(false);
    }
  };

  const handleUpdateSubmit = async () => {
    if (!updatingEmployee) return;

    const headsetValue = parseFloat(updatingHeadset) || 0;
    const salesValue = parseFloat(updatingSales) || 0;

    setUpdatingSubmitting(true);
    try {
      const res = await reportAPI.updateEmployeeReport(updatingEmployee._id, {
        headset: headsetValue,
        sales: salesValue,
        date: employeeReportDate
      });

      toast.success(res.data.message || "Report updated successfully!", {
        description: `Date: ${new Date(employeeReportDate).toLocaleDateString()}`,
      });

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
        setSales(report.sales?.toString() || "10");
      } else {
        setHeadset("0");
        setSales("10");
      }
    } catch (error: any) {
      console.error("Error fetching today's report:", error);
      setHeadset("0");
      setSales("10");
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

      toast.success(todayReport ? "Report updated successfully!" : "Report submitted successfully!", {
        description: `Date: ${new Date().toLocaleDateString()}`,
      });

      // Refresh data
      await fetchTodayReport();
    } catch (error: any) {
      console.error("Error submitting report:", error);
      toast.error(error.response?.data?.message || "Failed to submit report");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedEmployeeName = useMemo(() => {
    if (!selectedEmployee) return "";
    const emp = employees.find(e => e._id === selectedEmployee);
    return emp ? `${emp.firstName} ${emp.lastName}` : "";
  }, [selectedEmployee, employees]);

  // Aggregate reports by employee for the selected period
  const aggregatedData = useMemo(() => {
    const data: Record<string, {
      name: string;
      id: string;
      headset: number;
      sales: number;
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
          count: 0,
          firstName: report.employee.firstName,
          lastName: report.employee.lastName
        };
      }

      data[empId].headset += report.headset || 0;
      data[empId].sales += report.sales || 0;
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

      {/* Manager Section - Update Employee Reports */}
      {isManager && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Card className="p-6 border-primary/20 bg-primary/5 xl:col-span-1">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <Users className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  Add Report
                </h2>
                <p className="text-xs text-muted-foreground">
                  Date: {new Date(employeeReportDate).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Select Employee</Label>
                <Select value={selectedEmployee} onValueChange={handleEmployeeSelect}>
                  <SelectTrigger className="w-full bg-white dark:bg-zinc-900 border-primary/20">
                    <SelectValue placeholder={loadingEmployees ? "Loading..." : "Select an employee"} />
                  </SelectTrigger>
                  <SelectContent position="popper" className="z-[200]">
                    {employees.map((emp) => (
                      <SelectItem key={emp._id} value={emp._id}>
                        {emp.firstName} {emp.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reportDate" className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  Select Date
                </Label>
                <Input
                  id="reportDate"
                  type="date"
                  className="bg-white dark:bg-zinc-900 border-primary/20"
                  value={employeeReportDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                />
              </div>

              {selectedEmployee && (
                <div className="space-y-5 animate-slide-up">
                  <div className="space-y-2">
                    <Label htmlFor="employeeHeadset" className="flex items-center gap-2">
                      <Headphones className="w-4 h-4 text-primary" />
                      Headset Number
                    </Label>
                    <Input
                      id="employeeHeadset"
                      type="number"
                      className="bg-white dark:bg-zinc-900"
                      value={employeeHeadset}
                      onChange={(e) => setEmployeeHeadset(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="employeeSales" className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-primary" />
                      Sales
                    </Label>
                    <Input
                      id="employeeSales"
                      type="number"
                      className="bg-white dark:bg-zinc-900"
                      value={employeeSales}
                      onChange={(e) => setEmployeeSales(e.target.value)}
                    />
                  </div>

                  <Button
                    onClick={handleEmployeeSubmit}
                    disabled={employeeSubmitting}
                    className="w-full shadow-lg shadow-primary/20"
                  >
                    {employeeSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                    Add Report
                  </Button>
                </div>
              )}
            </div>
          </Card>

          <Dialog open={isUpdateModalOpen} onOpenChange={setIsUpdateModalOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  Update Report for {updatingEmployee?.firstName} {updatingEmployee?.lastName}
                </DialogTitle>
                <p className="text-xs text-muted-foreground">
                  Date: {new Date(employeeReportDate).toLocaleDateString()}
                </p>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="updateHeadset" className="flex items-center gap-2">
                    <Headphones className="w-4 h-4 text-primary" />
                    Headset Number
                  </Label>
                  <Input
                    id="updateHeadset"
                    type="number"
                    value={updatingHeadset}
                    onChange={(e) => setUpdatingHeadset(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="updateSales" className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-primary" />
                    Sales
                  </Label>
                  <Input
                    id="updateSales"
                    type="number"
                    value={updatingSales}
                    onChange={(e) => setUpdatingSales(e.target.value)}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsUpdateModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateSubmit} disabled={updatingSubmitting}>
                  {updatingSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Aggregated Overview */}
          <div className="xl:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Headsets Section */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                      <Headphones className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Headsets Progress</h3>
                      <p className="text-xs text-muted-foreground capitalize">{period} overview</p>
                    </div>
                  </div>
                </div>

                {loadingManagerReports ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                  </div>
                ) : aggregatedData.length === 0 ? (
                  <p className="text-center py-12 text-sm text-muted-foreground">No data for this period</p>
                ) : (
                  <div className="space-y-4">
                    {aggregatedData.map((data, idx) => (
                      <div key={data.id} className="relative group">
                        <div className="flex items-center justify-between mb-1.5 px-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-muted-foreground">#{idx + 1}</span>
                            <span className="text-sm font-medium">{data.name}</span>
                          </div>
                          <span className="text-sm font-bold text-blue-600 font-mono">{data.headset}</span>
                        </div>
                        <div
                          className="h-2 w-full bg-blue-100 dark:bg-blue-900/20 rounded-full overflow-hidden cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-800/40 transition-colors"
                          onClick={() => handleOpenUpdate(data.id)}
                          title={`Click to update report for ${data.name}`}
                        >
                          <div
                            className="h-full bg-blue-500 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min((data.headset / Math.max(...aggregatedData.map(d => d.headset || 1))) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Sales Section */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Sales Progress</h3>
                      <p className="text-xs text-muted-foreground capitalize">{period} overview</p>
                    </div>
                  </div>
                </div>

                {loadingManagerReports ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                  </div>
                ) : aggregatedData.length === 0 ? (
                  <p className="text-center py-12 text-sm text-muted-foreground">No data for this period</p>
                ) : (
                  <div className="space-y-4">
                    {aggregatedData.map((data, idx) => (
                      <div key={data.id} className="relative group">
                        <div className="flex items-center justify-between mb-1.5 px-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-muted-foreground">#{idx + 1}</span>
                            <span className="text-sm font-medium">{data.name}</span>
                          </div>
                          <div className="flex items-center text-emerald-600">
                            <ArrowUpRight className="w-3 h-3 mr-0.5" />
                            <span className="text-sm font-bold font-mono">${data.sales.toLocaleString()}</span>
                          </div>
                        </div>
                        <div
                          className="h-2 w-full bg-emerald-100 dark:bg-emerald-900/20 rounded-full overflow-hidden cursor-pointer hover:bg-emerald-200 dark:hover:bg-emerald-800/40 transition-colors"
                          onClick={() => handleOpenUpdate(data.id)}
                          title={`Click to update report for ${data.name}`}
                        >
                          <div
                            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min((data.sales / Math.max(...aggregatedData.map(d => d.sales || 1))) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* Individual Report Form - Hidden for managers as they don't submit their own report */}
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
                  placeholder="10"
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
    </div>
  );
};

export default Report;
