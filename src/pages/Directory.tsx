import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  Grid3X3, 
  List, 
  Mail, 
  Phone, 
  MessageSquare,
  MapPin,
  Building,
  Calendar,
  Award,
  FileText,
  Activity
} from "lucide-react";
import { cn } from "@/lib/utils";

const employees = [
  {
    id: 1,
    name: "John Doe",
    avatar: "JD",
    role: "Software Engineer",
    department: "Engineering",
    location: "New York",
    email: "john.doe@crossdigi.com",
    phone: "+1 234 567 890",
    manager: "Sarah Wilson",
    joinDate: "2022-03-15",
    skills: ["React", "TypeScript", "Node.js", "AWS"],
    status: "active",
  },
  {
    id: 2,
    name: "Sarah Wilson",
    avatar: "SW",
    role: "Engineering Manager",
    department: "Engineering",
    location: "San Francisco",
    email: "sarah.wilson@crossdigi.com",
    phone: "+1 234 567 891",
    manager: "Mike Chen",
    joinDate: "2020-06-20",
    skills: ["Leadership", "Agile", "System Design"],
    status: "active",
  },
  {
    id: 3,
    name: "Mike Chen",
    avatar: "MC",
    role: "CTO",
    department: "Executive",
    location: "San Francisco",
    email: "mike.chen@crossdigi.com",
    phone: "+1 234 567 892",
    manager: "N/A",
    joinDate: "2019-01-10",
    skills: ["Strategy", "Technology", "Leadership"],
    status: "active",
  },
  {
    id: 4,
    name: "Emma Davis",
    avatar: "ED",
    role: "Product Designer",
    department: "Design",
    location: "London",
    email: "emma.davis@crossdigi.com",
    phone: "+44 20 1234 5678",
    manager: "Sarah Wilson",
    joinDate: "2021-09-05",
    skills: ["Figma", "UI/UX", "Prototyping"],
    status: "active",
  },
  {
    id: 5,
    name: "Alex Johnson",
    avatar: "AJ",
    role: "HR Specialist",
    department: "Human Resources",
    location: "New York",
    email: "alex.johnson@crossdigi.com",
    phone: "+1 234 567 893",
    manager: "Lisa Brown",
    joinDate: "2022-11-01",
    skills: ["Recruitment", "Employee Relations", "Payroll"],
    status: "active",
  },
  {
    id: 6,
    name: "Lisa Brown",
    avatar: "LB",
    role: "HR Director",
    department: "Human Resources",
    location: "New York",
    email: "lisa.brown@crossdigi.com",
    phone: "+1 234 567 894",
    manager: "Mike Chen",
    joinDate: "2019-05-15",
    skills: ["HR Strategy", "Compliance", "Leadership"],
    status: "active",
  },
  {
    id: 7,
    name: "David Kim",
    avatar: "DK",
    role: "DevOps Engineer",
    department: "Engineering",
    location: "Seattle",
    email: "david.kim@crossdigi.com",
    phone: "+1 234 567 895",
    manager: "Sarah Wilson",
    joinDate: "2023-01-20",
    skills: ["Docker", "Kubernetes", "CI/CD", "Terraform"],
    status: "away",
  },
  {
    id: 8,
    name: "Rachel Green",
    avatar: "RG",
    role: "Marketing Manager",
    department: "Marketing",
    location: "London",
    email: "rachel.green@crossdigi.com",
    phone: "+44 20 1234 5679",
    manager: "Mike Chen",
    joinDate: "2021-03-10",
    skills: ["Digital Marketing", "SEO", "Content Strategy"],
    status: "active",
  },
];

const departments = ["All", "Engineering", "Design", "Human Resources", "Marketing", "Executive"];
const locations = ["All", "New York", "San Francisco", "London", "Seattle"];

const Directory = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedDepartment, setSelectedDepartment] = useState("All");
  const [selectedLocation, setSelectedLocation] = useState("All");
  const [selectedEmployee, setSelectedEmployee] = useState<typeof employees[0] | null>(null);

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch = emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         emp.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         emp.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = selectedDepartment === "All" || emp.department === selectedDepartment;
    const matchesLocation = selectedLocation === "All" || emp.location === selectedLocation;
    return matchesSearch && matchesDept && matchesLocation;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-success";
      case "away": return "bg-warning";
      case "offline": return "bg-muted-foreground";
      default: return "bg-muted-foreground";
    }
  };

  return (
    <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-h2 text-foreground">Employee Directory</h1>
          <p className="text-muted-foreground mt-1">Find and connect with your colleagues</p>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input 
              placeholder="Search by name, role, or email..." 
              className="pl-12"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-3">
            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map(dept => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent>
                {locations.map(loc => (
                  <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex border rounded-lg overflow-hidden">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="icon"
                onClick={() => setViewMode("grid")}
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="icon"
                onClick={() => setViewMode("list")}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Employee Grid/List */}
        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredEmployees.map((employee, index) => (
              <Card 
                key={employee.id}
                className={cn(
                  "dashboard-card cursor-pointer animate-fade-up",
                  `delay-${(index % 4 + 1) * 100}`
                )}
                onClick={() => setSelectedEmployee(employee)}
              >
                <div className="text-center">
                  <div className="relative inline-block">
                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                      <span className="text-2xl font-medium text-primary">{employee.avatar}</span>
                    </div>
                    <div className={cn(
                      "absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-card",
                      getStatusColor(employee.status)
                    )} />
                  </div>
                  <h3 className="text-h6 text-foreground mt-4">{employee.name}</h3>
                  <p className="text-small text-muted-foreground">{employee.role}</p>
                  <Badge variant="secondary" className="mt-2">{employee.department}</Badge>
                  <p className="text-caption mt-2 flex items-center justify-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {employee.location}
                  </p>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Mail className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <Phone className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <MessageSquare className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="dashboard-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4 text-small font-medium text-muted-foreground">Employee</th>
                    <th className="text-left p-4 text-small font-medium text-muted-foreground">Role</th>
                    <th className="text-left p-4 text-small font-medium text-muted-foreground">Department</th>
                    <th className="text-left p-4 text-small font-medium text-muted-foreground">Location</th>
                    <th className="text-left p-4 text-small font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.map((employee) => (
                    <tr 
                      key={employee.id} 
                      className="border-b border-border/50 hover:bg-secondary/30 cursor-pointer transition-colors"
                      onClick={() => setSelectedEmployee(employee)}
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-sm font-medium text-primary">{employee.avatar}</span>
                            </div>
                            <div className={cn(
                              "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-card",
                              getStatusColor(employee.status)
                            )} />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{employee.name}</p>
                            <p className="text-caption">{employee.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-small text-foreground">{employee.role}</td>
                      <td className="p-4">
                        <Badge variant="secondary">{employee.department}</Badge>
                      </td>
                      <td className="p-4 text-small text-muted-foreground">{employee.location}</td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                            <Mail className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                            <MessageSquare className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Employee Profile Sheet */}
        <Sheet open={!!selectedEmployee} onOpenChange={() => setSelectedEmployee(null)}>
          <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
            {selectedEmployee && (
              <>
                <SheetHeader>
                  <div className="text-center">
                    <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                      <span className="text-3xl font-medium text-primary">{selectedEmployee.avatar}</span>
                    </div>
                    <SheetTitle className="mt-4">{selectedEmployee.name}</SheetTitle>
                    <p className="text-muted-foreground">{selectedEmployee.role}</p>
                    <Badge variant="secondary" className="mt-2">{selectedEmployee.department}</Badge>
                  </div>
                </SheetHeader>

                <Tabs defaultValue="info" className="mt-6">
                  <TabsList className="w-full">
                    <TabsTrigger value="info" className="flex-1">Info</TabsTrigger>
                    <TabsTrigger value="skills" className="flex-1">Skills</TabsTrigger>
                    <TabsTrigger value="activity" className="flex-1">Activity</TabsTrigger>
                  </TabsList>

                  <TabsContent value="info" className="space-y-4 mt-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50">
                        <Mail className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="text-caption">Email</p>
                          <p className="text-small text-foreground">{selectedEmployee.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50">
                        <Phone className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="text-caption">Phone</p>
                          <p className="text-small text-foreground">{selectedEmployee.phone}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50">
                        <MapPin className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="text-caption">Location</p>
                          <p className="text-small text-foreground">{selectedEmployee.location}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50">
                        <Building className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="text-caption">Manager</p>
                          <p className="text-small text-foreground">{selectedEmployee.manager}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50">
                        <Calendar className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="text-caption">Join Date</p>
                          <p className="text-small text-foreground">{selectedEmployee.joinDate}</p>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="skills" className="mt-4">
                    <div className="flex flex-wrap gap-2">
                      {selectedEmployee.skills.map((skill, i) => (
                        <Badge key={i} variant="outline" className="py-2 px-4">
                          <Award className="w-3 h-3 mr-2" />
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="activity" className="mt-4">
                    <div className="space-y-4">
                      {[
                        { action: "Completed Q1 Review", date: "2 days ago" },
                        { action: "Submitted leave request", date: "1 week ago" },
                        { action: "Updated profile skills", date: "2 weeks ago" },
                        { action: "Joined Engineering team channel", date: "1 month ago" },
                      ].map((activity, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30">
                          <Activity className="w-4 h-4 text-muted-foreground" />
                          <div className="flex-1">
                            <p className="text-small text-foreground">{activity.action}</p>
                            <p className="text-caption">{activity.date}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="flex gap-3 mt-6">
                  <Button variant="outline" className="flex-1 gap-2">
                    <Mail className="w-4 h-4" />
                    Email
                  </Button>
                  <Button className="flex-1 gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Message
                  </Button>
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>
      </div>
  );
};

export default Directory;