import { useState } from "react";
import { 
  Clock, 
  Calendar, 
  TrendingUp,
  Users,
  ArrowUpRight,
  Megaphone,
  Ticket,
  Mail,
  DollarSign,
  Send,
  Plus,
  Copy,
  Check,
  ArrowRightLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const kpiCards = [
  {
    title: "Today's Status",
    value: "Clocked In",
    subtitle: "Since 9:00 AM",
    icon: Clock,
    color: "text-success",
    bgColor: "bg-success-light",
  },
  {
    title: "Total Transfer",
    value: "$45,230",
    subtitle: "This month",
    icon: ArrowRightLeft,
    color: "text-primary",
    bgColor: "bg-primary-light",
  },
  {
    title: "Total Sale",
    value: "$128,450",
    subtitle: "12 deals closed",
    icon: DollarSign,
    color: "text-warning",
    bgColor: "bg-warning-light",
  },
  {
    title: "This Month",
    value: "98%",
    subtitle: "Attendance rate",
    icon: TrendingUp,
    color: "text-accent",
    bgColor: "bg-accent-light",
  },
];

const recentNotices = [
  {
    title: "Office Closure Notice",
    author: "HR Department",
    date: "Today",
    excerpt: "The office will be closed on December 25th for Christmas holidays...",
    pinned: true,
  },
  {
    title: "New Health Benefits Update",
    author: "HR Department",
    date: "Yesterday",
    excerpt: "We're excited to announce new health benefits starting January 2024...",
    pinned: false,
  },
  {
    title: "Q4 Town Hall Meeting",
    author: "Management",
    date: "2 days ago",
    excerpt: "Join us for the quarterly town hall meeting to discuss company updates...",
    pinned: false,
  },
];

const upcomingEvents = [
  { date: "Dec 10", event: "Team Meeting", time: "10:00 AM" },
  { date: "Dec 12", event: "Project Deadline", time: "5:00 PM" },
  { date: "Dec 15", event: "Holiday Party", time: "6:00 PM" },
];

const ticketCategories = [
  "IT Support",
  "HR Inquiry",
  "Payroll Issue",
  "Leave Request",
  "Facilities",
  "Equipment Request",
  "Access & Permissions",
  "Other",
];

const priorityLevels = [
  { value: "low", label: "Low", color: "bg-muted text-muted-foreground" },
  { value: "medium", label: "Medium", color: "bg-warning-light text-warning" },
  { value: "high", label: "High", color: "bg-destructive-light text-destructive" },
  { value: "urgent", label: "Urgent", color: "bg-destructive text-destructive-foreground" },
];

const existingTickets = [
  { id: "TKT-001", subject: "VPN Access Issue", category: "IT Support", priority: "high", status: "In Progress", date: "Dec 8, 2024" },
  { id: "TKT-002", subject: "Salary Slip Correction", category: "Payroll Issue", priority: "medium", status: "Open", date: "Dec 7, 2024" },
  { id: "TKT-003", subject: "New Laptop Request", category: "Equipment Request", priority: "low", status: "Resolved", date: "Dec 5, 2024" },
];

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  
  // Ticket form state
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketCategory, setTicketCategory] = useState("");
  const [ticketPriority, setTicketPriority] = useState("");
  const [ticketDescription, setTicketDescription] = useState("");
  
  // Email generator state
  const [customerName, setCustomerName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [priceValue, setPriceValue] = useState("");
  const [generatedEmail, setGeneratedEmail] = useState("");
  const [copied, setCopied] = useState(false);

  const handleCreateTicket = () => {
    if (!ticketSubject || !ticketCategory || !ticketPriority || !ticketDescription) {
      toast.error("Please fill in all fields");
      return;
    }
    toast.success("Ticket created successfully!", {
      description: `Ticket ID: TKT-${String(Math.floor(Math.random() * 900) + 100).padStart(3, '0')}`,
    });
    setTicketSubject("");
    setTicketCategory("");
    setTicketPriority("");
    setTicketDescription("");
  };

  const handleGenerateEmail = () => {
    if (!customerName || !businessName || !priceValue) {
      toast.error("Please fill in all fields");
      return;
    }
    
    const email = `Subject: Increase ${businessName} Bookings with a $${priceValue} Digital Package

Dear ${customerName},

I hope this email finds you well.

My name is [Your Name] and I am reaching out from MMH Corporate. We specialize in providing service-based businesses like ${businessName} with effective, affordable technology solutions designed to boost customer traffic and streamline operations.

We recognize that a seamless customer experience drives repeat business. We have designed a powerful, introductory tech package to help you achieve this, which includes:

• Online Booking Integration: Allow customers to pre-pay and schedule washes through your website, drastically reducing walk-away customers.

• Digital Presence Upgrade: Ensure your website clearly promotes your services and looks professional on all devices.

• Basic Digital Marketing Consultation: A strategy session to help you effectively reach more local customers.

We are offering this complete foundational package for just $${priceValue}. This is a high-value investment that delivers immediate improvements in customer convenience and operational efficiency.

Would you be open to a quick 10-minute call next week to review exactly what the $${priceValue} package includes and how it can start benefiting ${businessName} immediately?

Best regards,

[Your Name]
MMH Corporate
[Phone Number]
[Website URL]`;

    setGeneratedEmail(email);
    toast.success("Email generated successfully!");
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(generatedEmail);
    setCopied(true);
    toast.success("Email copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Open":
        return "bg-warning-light text-warning";
      case "In Progress":
        return "bg-primary-light text-primary";
      case "Resolved":
        return "bg-success-light text-success";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-h2 text-foreground">Good Morning, John!</h1>
            <p className="text-muted-foreground mt-1">Here's what's happening today.</p>
          </div>
          <Button size="lg" className="shadow-glow">
            <Clock className="w-5 h-5 mr-2" />
            Quick Clock Out
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiCards.map((card, index) => (
            <div 
              key={card.title} 
              className="kpi-card animate-fade-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center justify-between">
                <div className={`w-12 h-12 rounded-2xl ${card.bgColor} flex items-center justify-center`}>
                  <card.icon className={`w-6 h-6 ${card.color}`} />
                </div>
                <ArrowUpRight className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="mt-4">
                <p className="text-sm text-muted-foreground">{card.title}</p>
                <p className="text-h3 text-foreground mt-1">{card.value}</p>
                <p className="text-caption mt-1">{card.subtitle}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs Section */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full max-w-xl bg-secondary/50 p-1 rounded-2xl">
            <TabsTrigger value="overview" className="flex-1 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm">
              Overview
            </TabsTrigger>
            <TabsTrigger value="tickets" className="flex-1 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Ticket className="w-4 h-4 mr-2" />
              Tickets
            </TabsTrigger>
            <TabsTrigger value="email" className="flex-1 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Mail className="w-4 h-4 mr-2" />
              Email Generator
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Notices */}
              <div className="lg:col-span-2 dashboard-card">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary-light flex items-center justify-center">
                      <Megaphone className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="text-h4 text-foreground">Recent Notices</h3>
                  </div>
                  <Button variant="ghost" size="sm">
                    View All
                    <ArrowUpRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
                <div className="space-y-4">
                  {recentNotices.map((notice) => (
                    <div 
                      key={notice.title}
                      className="p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors cursor-pointer group"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-foreground group-hover:text-primary transition-colors">
                              {notice.title}
                            </h4>
                            {notice.pinned && (
                              <span className="px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded-full">
                                Pinned
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                            {notice.excerpt}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs text-muted-foreground">{notice.date}</p>
                          <p className="text-xs text-muted-foreground/70 mt-1">{notice.author}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Upcoming Events */}
              <div className="dashboard-card">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-accent-light flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-accent" />
                  </div>
                  <h3 className="text-h4 text-foreground">Upcoming Events</h3>
                </div>
                <div className="space-y-4">
                  {upcomingEvents.map((event) => (
                    <div 
                      key={event.event}
                      className="flex items-center gap-4 p-3 rounded-xl hover:bg-secondary/50 transition-colors"
                    >
                      <div className="w-14 h-14 rounded-xl bg-primary-light flex flex-col items-center justify-center flex-shrink-0">
                        <span className="text-xs text-primary font-medium">{event.date.split(' ')[0]}</span>
                        <span className="text-lg font-bold text-primary">{event.date.split(' ')[1]}</span>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{event.event}</p>
                        <p className="text-sm text-muted-foreground">{event.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="dashboard-card mt-6">
              <h3 className="text-h4 text-foreground mb-4">Quick Actions</h3>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline">
                  <Calendar className="w-4 h-4 mr-2" />
                  Request Leave
                </Button>
                <Button variant="outline">
                  <Clock className="w-4 h-4 mr-2" />
                  View Attendance
                </Button>
                <Button variant="outline">
                  <Users className="w-4 h-4 mr-2" />
                  Team Directory
                </Button>
                <Button variant="outline" onClick={() => setActiveTab("tickets")}>
                  <Ticket className="w-4 h-4 mr-2" />
                  Create Ticket
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Tickets Tab */}
          <TabsContent value="tickets" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Create Ticket Form */}
              <div className="dashboard-card">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-primary-light flex items-center justify-center">
                    <Plus className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-h4 text-foreground">Create New Ticket</h3>
                    <p className="text-sm text-muted-foreground">Submit a request or report an issue</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Subject</label>
                    <Input 
                      placeholder="Brief description of your issue..."
                      value={ticketSubject}
                      onChange={(e) => setTicketSubject(e.target.value)}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">Category</label>
                      <Select value={ticketCategory} onValueChange={setTicketCategory}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {ticketCategories.map((cat) => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">Priority</label>
                      <Select value={ticketPriority} onValueChange={setTicketPriority}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                          {priorityLevels.map((level) => (
                            <SelectItem key={level.value} value={level.value}>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${level.color}`}>
                                {level.label}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Description</label>
                    <Textarea 
                      placeholder="Provide detailed information about your request or issue..."
                      className="min-h-[120px] resize-none"
                      value={ticketDescription}
                      onChange={(e) => setTicketDescription(e.target.value)}
                    />
                  </div>
                  
                  <Button className="w-full shadow-glow" onClick={handleCreateTicket}>
                    <Send className="w-4 h-4 mr-2" />
                    Submit Ticket
                  </Button>
                </div>
              </div>

              {/* Recent Tickets */}
              <div className="dashboard-card">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-accent-light flex items-center justify-center">
                      <Ticket className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <h3 className="text-h4 text-foreground">My Tickets</h3>
                      <p className="text-sm text-muted-foreground">Track your submitted requests</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {existingTickets.map((ticket) => (
                    <div 
                      key={ticket.id}
                      className="p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-all cursor-pointer border border-transparent hover:border-primary/20"
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-muted-foreground">{ticket.id}</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(ticket.status)}`}>
                              {ticket.status}
                            </span>
                          </div>
                          <h4 className="font-medium text-foreground mt-1">{ticket.subject}</h4>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          priorityLevels.find(p => p.value === ticket.priority)?.color || ''
                        }`}>
                          {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{ticket.category}</span>
                        <span>{ticket.date}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <Button variant="outline" className="w-full mt-4">
                  View All Tickets
                  <ArrowUpRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Email Generator Tab */}
          <TabsContent value="email" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Email Form */}
              <div className="dashboard-card">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-primary-light flex items-center justify-center">
                    <Mail className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-h4 text-foreground">Quick Email Generator</h3>
                    <p className="text-sm text-muted-foreground">Generate professional outreach emails instantly</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Customer Name (Manager/Owner)
                    </label>
                    <Input 
                      placeholder="e.g., John Smith"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Customer Business Name
                    </label>
                    <Input 
                      placeholder="e.g., ABC Car Wash"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Package Price Value ($)
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input 
                        placeholder="5000"
                        className="pl-9"
                        value={priceValue}
                        onChange={(e) => setPriceValue(e.target.value.replace(/[^0-9]/g, ''))}
                      />
                    </div>
                  </div>

                  <Button className="w-full shadow-glow" onClick={handleGenerateEmail}>
                    <Send className="w-4 h-4 mr-2" />
                    Generate Email
                  </Button>
                </div>

                {/* Tips */}
                <div className="mt-6 p-4 rounded-xl bg-accent-light/50 border border-accent/20">
                  <h4 className="text-sm font-medium text-accent mb-2">💡 Pro Tips</h4>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Replace [Your Name] with your actual name</li>
                    <li>• Add your phone number and website URL</li>
                    <li>• Personalize the email based on the business type</li>
                  </ul>
                </div>
              </div>

              {/* Generated Email Preview */}
              <div className="dashboard-card">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-success-light flex items-center justify-center">
                      <Send className="w-5 h-5 text-success" />
                    </div>
                    <div>
                      <h3 className="text-h4 text-foreground">Email Preview</h3>
                      <p className="text-sm text-muted-foreground">Your generated email will appear here</p>
                    </div>
                  </div>
                  {generatedEmail && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleCopyEmail}
                      className="flex items-center gap-2"
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4 text-success" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copy
                        </>
                      )}
                    </Button>
                  )}
                </div>

                {generatedEmail ? (
                  <div className="bg-secondary/30 rounded-xl p-4 max-h-[450px] overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-sm text-foreground font-sans leading-relaxed">
                      {generatedEmail}
                    </pre>
                  </div>
                ) : (
                  <div className="h-[300px] flex flex-col items-center justify-center text-center bg-secondary/30 rounded-xl">
                    <Mail className="w-12 h-12 text-muted-foreground/30 mb-3" />
                    <p className="text-muted-foreground">Fill in the details and click "Generate Email"</p>
                    <p className="text-xs text-muted-foreground/70 mt-1">Your professional email will appear here</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
  );
};

export default Dashboard;
