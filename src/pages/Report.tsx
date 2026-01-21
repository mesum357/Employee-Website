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

  // Check if user is a manager
  const isManager = useMemo(() => {
    const dept = user?.employee?.department;
    if (!dept) return false;
    const deptName = typeof dept === 'object' ? dept.name : dept;
    return deptName?.toLowerCase() === 'manager';
  }, [user?.employee?.department]);

  useEffect(() => {
    fetchTodayReport();
    if (isManager) {
      fetchEmployees();
      fetchManagerUpdatedReports();
    }
  }, [isManager]);

  const fetchManagerUpdatedReports = async () => {
    try {
      setLoadingManagerReports(true);
      const res = await reportAPI.getManagerUpdatedReports({ limit: 30 });
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
      const excludedDepartments = ['hr', 'admin', 'boss', 'manager'];
      const filteredEmployees = empList.filter((emp: Employee) => {
        const deptName = emp.department?.name?.toLowerCase() || '';
        return !excludedDepartments.includes(deptName);
      });

      setEmployees(filteredEmployees);
    } catch (error: any) {
      console.error("Error fetching employees:", error);
    } finally {
      setLoadingEmployees(false);
    }
  };

  const fetchEmployeeTodayReport = async (employeeId: string) => {
    try {
      const res = await reportAPI.getEmployeeTodayReport(employeeId);
      const report = res.data.data.report;
      if (report) {
        setEmployeeTodayReport(report);
        setEmployeeHeadset(report.headset?.toString() || "0");
        setEmployeeSales(report.sales?.toString() || "0");
      } else {
        setEmployeeTodayReport(null);
        setEmployeeHeadset("0");
        setEmployeeSales("0");
      }
    } catch (error: any) {
      console.error("Error fetching employee's report:", error);
      setEmployeeTodayReport(null);
      setEmployeeHeadset("0");
      setEmployeeSales("0");
    }
  };

  const handleEmployeeSelect = (employeeId: string) => {
    setSelectedEmployee(employeeId);
    if (employeeId) {
      fetchEmployeeTodayReport(employeeId);
    } else {
      setEmployeeTodayReport(null);
      setEmployeeHeadset("0");
      setEmployeeSales("0");
    }
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
        sales: salesValue
      });

      toast.success(res.data.message || "Report submitted successfully!", {
        description: `Date: ${new Date().toLocaleDateString()}`,
      });

      // Refresh data
      await fetchEmployeeTodayReport(selectedEmployee);
      await fetchManagerUpdatedReports();
    } catch (error: any) {
      console.error("Error submitting employee report:", error);
      toast.error(error.response?.data?.message || "Failed to submit report");
    } finally {
      setEmployeeSubmitting(false);
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const selectedEmployeeName = useMemo(() => {
    if (!selectedEmployee) return "";
    const emp = employees.find(e => e._id === selectedEmployee);
    return emp ? `${emp.firstName} ${emp.lastName}` : "";
  }, [selectedEmployee, employees]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Daily Report</h1>
        <p className="text-muted-foreground mt-1">
          {isManager ? "Manage your reports and update employee reports" : "Submit your daily headset number and sales report"}
        </p>
      </div>

      {/* Manager Section - Update Employee Reports */}
      {isManager && (
        <Card className="p-6 border-primary/20 bg-primary/5">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Users className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                Update Employee Report
              </h2>
              <p className="text-sm text-muted-foreground">
                Select an employee and update their headset/sales for today
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Employee Selection */}
            <div className="space-y-2">
              <Label className="text-base font-medium flex items-center gap-2">
                <Users className="w-5 h-5" />
                Select Employee
              </Label>
              <Select value={selectedEmployee} onValueChange={handleEmployeeSelect}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={loadingEmployees ? "Loading employees..." : "Select an employee"} />
                </SelectTrigger>
                <SelectContent position="popper" className="z-[200]">
                  {employees.map((emp) => (
                    <SelectItem key={emp._id} value={emp._id}>
                      {emp.firstName} {emp.lastName} ({emp.employeeId})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedEmployee && (
              <>
                {/* Employee Headset Input */}
                <div className="space-y-2">
                  <Label htmlFor="employeeHeadset" className="text-base font-medium flex items-center gap-2">
                    <Headphones className="w-5 h-5" />
                    {selectedEmployeeName}'s Headset Number
                  </Label>
                  <Input
                    id="employeeHeadset"
                    type="number"
                    placeholder="Enter headset number"
                    value={employeeHeadset}
                    onChange={(e) => setEmployeeHeadset(e.target.value)}
                    min="0"
                    step="1"
                  />
                </div>

                {/* Employee Sales Input */}
                <div className="space-y-2">
                  <Label htmlFor="employeeSales" className="text-base font-medium flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    {selectedEmployeeName}'s Sales
                  </Label>
                  <Input
                    id="employeeSales"
                    type="number"
                    placeholder="Enter sales amount"
                    value={employeeSales}
                    onChange={(e) => setEmployeeSales(e.target.value)}
                    min="0"
                    step="0.01"
                  />
                </div>

                <Button
                  onClick={handleEmployeeSubmit}
                  disabled={employeeSubmitting}
                  className="w-full"
                  size="lg"
                >
                  {employeeSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {employeeTodayReport ? "Updating..." : "Submitting..."}
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      {employeeTodayReport ? `Update ${selectedEmployeeName}'s Report` : `Submit ${selectedEmployeeName}'s Report`}
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </Card>
      )}

      {/* Manager Updated Reports History */}
      {isManager && (
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                Employee Reports Updated by You
              </h2>
              <p className="text-sm text-muted-foreground">
                View reports you've created or updated for employees
              </p>
            </div>
          </div>

          {loadingManagerReports ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : managerUpdatedReports.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">No employee reports updated yet</p>
              <p className="text-xs mt-1">Start updating employee reports to see them here</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {managerUpdatedReports.map((report) => (
                <div
                  key={report._id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border bg-card hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-sm">
                        {report.employee?.firstName} {report.employee?.lastName}
                      </p>
                      <span className="text-xs text-muted-foreground">
                        ({report.employee?.employeeId})
                      </span>
                      {new Date(report.date).toDateString() === new Date().toDateString() && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                          Today
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      {formatDate(report.date)}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Headphones className="w-4 h-4" />
                        <span>{report.headset || 0}</span>
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
      )}

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
          {/* Headset Input */}
          <div className="space-y-2">
            <Label htmlFor="headset" className="text-base font-medium flex items-center gap-2">
              <Headphones className="w-5 h-5" />
              Headset Number
            </Label>
            <Input
              id="headset"
              type="number"
              placeholder="Enter headset number"
              value={headset}
              onChange={(e) => setHeadset(e.target.value)}
              min="0"
              step="1"
            />
            <p className="text-xs text-muted-foreground">
              Enter the headset number you used today
            </p>
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
    </div>
  );
};

export default Report;
