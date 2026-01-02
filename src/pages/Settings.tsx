import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Users, 
  Shield, 
  FileText, 
  Link2, 
  Palette,
  Lock,
  Plus,
  Search,
  MoreVertical,
  Trash2,
  Edit,
  Check,
  X,
  Upload,
  Key,
  Globe,
  Bell,
  Mail
} from "lucide-react";
import { cn } from "@/lib/utils";

const users = [
  { id: 1, name: "John Doe", email: "john.doe@crossdigi.com", role: "Employee", department: "Engineering", status: "active" },
  { id: 2, name: "Sarah Wilson", email: "sarah.wilson@crossdigi.com", role: "Manager", department: "Engineering", status: "active" },
  { id: 3, name: "Mike Chen", email: "mike.chen@crossdigi.com", role: "Admin", department: "Executive", status: "active" },
  { id: 4, name: "Emma Davis", email: "emma.davis@crossdigi.com", role: "Employee", department: "Design", status: "inactive" },
  { id: 5, name: "Alex Johnson", email: "alex.johnson@crossdigi.com", role: "HR", department: "Human Resources", status: "active" },
];

const roles = [
  { name: "Admin", permissions: ["all"], users: 2 },
  { name: "HR", permissions: ["users", "leaves", "reports"], users: 3 },
  { name: "Manager", permissions: ["team", "leaves", "reports"], users: 8 },
  { name: "Employee", permissions: ["self"], users: 143 },
];

const permissionMatrix = [
  { feature: "User Management", admin: true, hr: true, manager: false, employee: false },
  { feature: "Leave Approval", admin: true, hr: true, manager: true, employee: false },
  { feature: "View Reports", admin: true, hr: true, manager: true, employee: false },
  { feature: "Edit Settings", admin: true, hr: false, manager: false, employee: false },
  { feature: "Manage Roles", admin: true, hr: false, manager: false, employee: false },
  { feature: "View Directory", admin: true, hr: true, manager: true, employee: true },
  { feature: "Send Notices", admin: true, hr: true, manager: true, employee: false },
];

const auditLogs = [
  { id: 1, action: "User Created", user: "Mike Chen", target: "New Employee", time: "2 hours ago", ip: "192.168.1.100" },
  { id: 2, action: "Role Changed", user: "Sarah Wilson", target: "Alex Johnson → HR", time: "5 hours ago", ip: "192.168.1.101" },
  { id: 3, action: "Settings Updated", user: "Mike Chen", target: "Security Settings", time: "1 day ago", ip: "192.168.1.100" },
  { id: 4, action: "Leave Approved", user: "Sarah Wilson", target: "John Doe", time: "1 day ago", ip: "192.168.1.101" },
  { id: 5, action: "Report Generated", user: "Alex Johnson", target: "Q1 Attendance", time: "2 days ago", ip: "192.168.1.102" },
];

const integrations = [
  { name: "Google SSO", description: "Single sign-on with Google Workspace", connected: true, icon: Globe },
  { name: "Slack", description: "Notifications and updates", connected: true, icon: Bell },
  { name: "Payroll System", description: "Export attendance data", connected: false, icon: FileText },
  { name: "Email Service", description: "Automated email notifications", connected: true, icon: Mail },
];

const Settings = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState("users");

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-h2 text-foreground">Admin Settings</h1>
          <p className="text-muted-foreground mt-1">Manage users, roles, and system configuration</p>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="bg-secondary/50">
            <TabsTrigger value="users" className="gap-2">
              <Users className="w-4 h-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="roles" className="gap-2">
              <Shield className="w-4 h-4" />
              Roles & Permissions
            </TabsTrigger>
            <TabsTrigger value="audit" className="gap-2">
              <FileText className="w-4 h-4" />
              Audit Logs
            </TabsTrigger>
            <TabsTrigger value="integrations" className="gap-2">
              <Link2 className="w-4 h-4" />
              Integrations
            </TabsTrigger>
            <TabsTrigger value="branding" className="gap-2">
              <Palette className="w-4 h-4" />
              Branding
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Lock className="w-4 h-4" />
              Security
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="relative w-80">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Search users..." 
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add User
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New User</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>First Name</Label>
                        <Input placeholder="John" />
                      </div>
                      <div className="space-y-2">
                        <Label>Last Name</Label>
                        <Input placeholder="Doe" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input type="email" placeholder="john.doe@crossdigi.com" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Role</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            {roles.map(role => (
                              <SelectItem key={role.name} value={role.name.toLowerCase()}>{role.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Department</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="engineering">Engineering</SelectItem>
                            <SelectItem value="design">Design</SelectItem>
                            <SelectItem value="hr">Human Resources</SelectItem>
                            <SelectItem value="marketing">Marketing</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  <DialogFooter className="mt-6">
                    <Button variant="outline">Cancel</Button>
                    <Button>Create User</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <Card className="dashboard-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-medium text-primary">
                              {user.name.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{user.name}</p>
                            <p className="text-caption">{user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.role === "Admin" ? "default" : "secondary"}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{user.department}</TableCell>
                      <TableCell>
                        <Badge className={user.status === "active" ? "badge-success" : "badge-destructive"}>
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* Roles Tab */}
          <TabsContent value="roles" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {roles.map((role) => (
                <Card key={role.name} className="dashboard-card">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-primary" />
                    </div>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </div>
                  <h3 className="text-h6 text-foreground">{role.name}</h3>
                  <p className="text-caption mt-1">{role.users} users</p>
                  <div className="flex flex-wrap gap-1 mt-3">
                    {role.permissions.slice(0, 3).map((perm) => (
                      <Badge key={perm} variant="outline" className="text-xs">
                        {perm}
                      </Badge>
                    ))}
                  </div>
                </Card>
              ))}
            </div>

            <Card className="dashboard-card">
              <h3 className="text-h5 text-foreground mb-4">Permission Matrix</h3>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Feature</TableHead>
                      <TableHead className="text-center">Admin</TableHead>
                      <TableHead className="text-center">HR</TableHead>
                      <TableHead className="text-center">Manager</TableHead>
                      <TableHead className="text-center">Employee</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {permissionMatrix.map((row) => (
                      <TableRow key={row.feature}>
                        <TableCell className="font-medium">{row.feature}</TableCell>
                        <TableCell className="text-center">
                          {row.admin ? <Check className="w-5 h-5 text-success mx-auto" /> : <X className="w-5 h-5 text-muted-foreground mx-auto" />}
                        </TableCell>
                        <TableCell className="text-center">
                          {row.hr ? <Check className="w-5 h-5 text-success mx-auto" /> : <X className="w-5 h-5 text-muted-foreground mx-auto" />}
                        </TableCell>
                        <TableCell className="text-center">
                          {row.manager ? <Check className="w-5 h-5 text-success mx-auto" /> : <X className="w-5 h-5 text-muted-foreground mx-auto" />}
                        </TableCell>
                        <TableCell className="text-center">
                          {row.employee ? <Check className="w-5 h-5 text-success mx-auto" /> : <X className="w-5 h-5 text-muted-foreground mx-auto" />}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>

          {/* Audit Logs Tab */}
          <TabsContent value="audit">
            <Card className="dashboard-card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-h5 text-foreground">Recent Activity</h3>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Search logs..." className="pl-10" />
                </div>
              </div>
              <div className="space-y-3">
                {auditLogs.map((log) => (
                  <div 
                    key={log.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{log.action}</p>
                        <p className="text-caption">
                          by {log.user} • {log.target}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-small text-muted-foreground">{log.time}</p>
                      <p className="text-caption">{log.ip}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* Integrations Tab */}
          <TabsContent value="integrations">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {integrations.map((integration) => (
                <Card key={integration.name} className="dashboard-card">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <integration.icon className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-h6 text-foreground">{integration.name}</h3>
                        <p className="text-caption">{integration.description}</p>
                      </div>
                    </div>
                    <Switch checked={integration.connected} />
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Branding Tab */}
          <TabsContent value="branding">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="dashboard-card">
                <h3 className="text-h5 text-foreground mb-4">Company Logo</h3>
                <div className="border-2 border-dashed rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
                  <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-small text-muted-foreground">Drop logo here or click to upload</p>
                  <p className="text-caption mt-1">PNG, SVG up to 2MB</p>
                </div>
              </Card>

              <Card className="dashboard-card">
                <h3 className="text-h5 text-foreground mb-4">Primary Color</h3>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-primary" />
                  <Input defaultValue="#2563EB" className="max-w-[200px]" />
                </div>
                <div className="flex gap-2 mt-4">
                  {["#2563EB", "#0EA5E9", "#10B981", "#8B5CF6", "#F59E0B", "#EF4444"].map((color) => (
                    <button
                      key={color}
                      className="w-10 h-10 rounded-lg border-2 border-transparent hover:border-foreground/20 transition-colors"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <div className="space-y-4">
              <Card className="dashboard-card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Key className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-h6 text-foreground">Two-Factor Authentication</h3>
                      <p className="text-caption">Require 2FA for all admin accounts</p>
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>
              </Card>

              <Card className="dashboard-card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Lock className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-h6 text-foreground">Password Policy</h3>
                      <p className="text-caption">Minimum 12 characters with special characters</p>
                    </div>
                  </div>
                  <Select defaultValue="strong">
                    <SelectTrigger className="w-[150px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Basic</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="strong">Strong</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </Card>

              <Card className="dashboard-card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                      <Globe className="w-6 h-6 text-warning" />
                    </div>
                    <div>
                      <h3 className="text-h6 text-foreground">Session Timeout</h3>
                      <p className="text-caption">Auto-logout after inactivity</p>
                    </div>
                  </div>
                  <Select defaultValue="30">
                    <SelectTrigger className="w-[150px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="240">4 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
  );
};

export default Settings;