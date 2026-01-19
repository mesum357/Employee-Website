import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Eye, EyeOff, Mail, Lock, User, Phone, Building,
  Briefcase, CheckCircle2, AlertCircle, Loader2, Clock,
  Fingerprint
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import authBg from "@/assets/auth-bg.jpg";
import api from "@/lib/api";
import { useEffect } from "react";

type AuthMode = "login" | "signup" | "check-status";

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login, loginWithFingerprint } = useAuth();
  const [fingerprintLoading, setFingerprintLoading] = useState(false);
  const [mode, setMode] = useState<AuthMode>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [departments, setDepartments] = useState<{ _id: string, name: string }[]>([]);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [statusCheck, setStatusCheck] = useState<{
    status: string;
    rejectionReason?: string;
    registeredAt?: string;
  } | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    phone: "",
    department: "",
    designation: "",
    gender: "",
    dateOfBirth: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await api.get('/departments');
        if (response.data.success) {
          setDepartments(response.data.data.departments);
        }
      } catch (error) {
        console.error("Error fetching departments:", error);
      }
    };

    fetchDepartments();
  }, []);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (mode === "signup") {
      if (!formData.firstName) newErrors.firstName = "First name is required";
      if (!formData.lastName) newErrors.lastName = "Last name is required";
      if (!formData.phone) newErrors.phone = "Phone number is required";
      if (!formData.department) newErrors.department = "Department is required";
      if (!formData.designation) newErrors.designation = "Designation is required";

      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);

    const result = await login(formData.email, formData.password);

    if (result.success) {
      toast({
        title: "Welcome back!",
        description: "Login successful",
      });
      navigate('/dashboard');
    } else {
      if (result.code === 'PENDING_VERIFICATION') {
        toast({
          title: "Account Pending",
          description: "Your account is awaiting admin approval.",
          variant: "destructive",
        });
      } else if (result.code === 'REJECTED') {
        toast({
          title: "Account Rejected",
          description: result.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Login Failed",
          description: result.message,
          variant: "destructive",
        });
      }
    }

    setIsLoading(false);
  };

  const handleFingerprintLogin = async () => {
    setFingerprintLoading(true);

    try {
      // Usernameless authentication - no email required
      const result = await loginWithFingerprint();

      if (result.success) {
        toast({
          title: "Welcome back!",
          description: "Fingerprint login successful",
        });
        navigate('/dashboard');
      } else {
        toast({
          title: "Fingerprint Login Failed",
          description: result.message || "Failed to authenticate with fingerprint",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "An error occurred during fingerprint login",
        variant: "destructive",
      });
    } finally {
      setFingerprintLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await api.post('/auth/register', {
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        department: formData.department,
        designation: formData.designation,
        gender: formData.gender || undefined,
        dateOfBirth: formData.dateOfBirth || undefined,
      });

      setRegistrationSuccess(true);
      toast({
        title: "Registration Successful!",
        description: "Your account has been sent for verification.",
      });
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error.response?.data?.message || 'Something went wrong',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email) {
      setErrors({ email: "Email is required" });
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.get(`/auth/check-status/${formData.email}`);
      setStatusCheck(response.data.data);
    } catch (error: any) {
      toast({
        title: "Not Found",
        description: error.response?.data?.message || 'No registration found',
        variant: "destructive",
      });
      setStatusCheck(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Registration success screen
  if (registrationSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-8">
        <div className="glass-card rounded-3xl p-12 shadow-xl max-w-md w-full text-center animate-fade-up">
          <div className="w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-6">
            <Clock className="w-10 h-10 text-amber-600" />
          </div>
          <h2 className="text-h2 text-foreground mb-4">Registration Submitted!</h2>
          <p className="text-muted-foreground mb-6">
            Your account has been sent for verification. You will receive a notification
            once your account is approved by the administrator.
          </p>
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 mb-6">
            <p className="text-sm text-amber-700 dark:text-amber-400">
              <strong>Note:</strong> This process typically takes 1-2 business days.
              You can check your status using your email address.
            </p>
          </div>
          <div className="space-y-3">
            <Button
              onClick={() => {
                setMode("check-status");
                setRegistrationSuccess(false);
              }}
              className="w-full"
            >
              Check Registration Status
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setMode("login");
                setRegistrationSuccess(false);
                setFormData({
                  email: "",
                  password: "",
                  confirmPassword: "",
                  firstName: "",
                  lastName: "",
                  phone: "",
                  department: "",
                  designation: "",
                  gender: "",
                  dateOfBirth: "",
                });
              }}
              className="w-full"
            >
              Back to Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Welcome Section */}
      <div
        className="hidden lg:flex lg:w-[45%] relative overflow-hidden"
        style={{
          backgroundImage: `url(${authBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-primary/80 to-accent/70" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 text-primary-foreground">
          <div>
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-card/20 backdrop-blur-sm flex items-center justify-center">
                <span className="text-2xl font-bold">CD</span>
              </div>
              <span className="text-2xl font-bold">Cross DIGI</span>
            </div>
          </div>

          <div className="space-y-6 animate-fade-up">
            <h1 className="text-display">
              Welcome to Your<br />
              <span className="text-accent-light">Employee Portal</span>
            </h1>
            <p className="text-lg opacity-90 max-w-md leading-relaxed">
              Streamline your workday with seamless attendance tracking, leave management,
              and team collaboration — all in one place.
            </p>

            {/* Feature highlights */}
            <div className="flex gap-4 pt-4">
              {["Attendance", "Leave", "Team Chat"].map((feature, i) => (
                <div
                  key={feature}
                  className="px-4 py-2 rounded-full bg-card/10 backdrop-blur-sm border border-card/20 text-sm font-medium"
                  style={{ animationDelay: `${(i + 1) * 100}ms` }}
                >
                  {feature}
                </div>
              ))}
            </div>
          </div>

          <div className="text-sm opacity-70">
            © 2024 Cross DIGI. All rights reserved.
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-accent/20 blur-3xl" />
        <div className="absolute top-20 -right-10 w-60 h-60 rounded-full bg-card/10 blur-2xl" />
      </div>

      {/* Right Panel - Form Section */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background overflow-y-auto">
        <div className="w-full max-w-md animate-fade-up">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <span className="text-lg font-bold text-primary-foreground">CD</span>
            </div>
            <span className="text-xl font-bold text-foreground">Cross DIGI</span>
          </div>

          {/* Form Card */}
          <div className="glass-card rounded-3xl p-8 shadow-xl">
            <div className="text-center mb-8">
              <h2 className="text-h2 text-foreground mb-2">
                {mode === "login" ? "Welcome Back" : mode === "signup" ? "Create Account" : "Check Status"}
              </h2>
              <p className="text-muted-foreground">
                {mode === "login"
                  ? "Sign in to access your employee portal"
                  : mode === "signup"
                    ? "Register to join Cross DIGI"
                    : "Check your registration status"}
              </p>
            </div>

            {/* Check Status Mode */}
            {mode === "check-status" && (
              <form onSubmit={handleCheckStatus} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="your@email.com"
                      className={`pl-12 ${errors.email ? 'border-destructive' : ''}`}
                      value={formData.email}
                      onChange={handleInputChange}
                    />
                  </div>
                  {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                </div>

                {statusCheck && (
                  <div className={`rounded-xl p-4 ${statusCheck.status === 'approved' ? 'bg-green-50 dark:bg-green-900/20' :
                    statusCheck.status === 'pending' ? 'bg-amber-50 dark:bg-amber-900/20' :
                      'bg-red-50 dark:bg-red-900/20'
                    }`}>
                    <div className="flex items-center gap-3">
                      {statusCheck.status === 'approved' && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                      {statusCheck.status === 'pending' && <Clock className="w-5 h-5 text-amber-600" />}
                      {statusCheck.status === 'rejected' && <AlertCircle className="w-5 h-5 text-red-600" />}
                      <div>
                        <p className={`font-medium ${statusCheck.status === 'approved' ? 'text-green-700 dark:text-green-400' :
                          statusCheck.status === 'pending' ? 'text-amber-700 dark:text-amber-400' :
                            'text-red-700 dark:text-red-400'
                          }`}>
                          Status: {statusCheck.status.charAt(0).toUpperCase() + statusCheck.status.slice(1)}
                        </p>
                        {statusCheck.rejectionReason && (
                          <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                            Reason: {statusCheck.rejectionReason}
                          </p>
                        )}
                        {statusCheck.status === 'approved' && (
                          <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                            You can now log in to your account!
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Checking...
                    </>
                  ) : (
                    'Check Status'
                  )}
                </Button>
              </form>
            )}

            {/* Login Mode */}
            {mode === "login" && (
              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="john@crossdigi.com"
                      className={`pl-12 ${errors.email ? 'border-destructive' : ''}`}
                      value={formData.email}
                      onChange={handleInputChange}
                    />
                  </div>
                  {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className={`pl-12 pr-12 ${errors.password ? 'border-destructive' : ''}`}
                      value={formData.password}
                      onChange={handleInputChange}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Checkbox id="remember" />
                    <Label htmlFor="remember" className="text-sm cursor-pointer">Remember me</Label>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMode("check-status")}
                    className="text-sm text-primary hover:underline"
                  >
                    Check status
                  </button>
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing In...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>

                {/* Fingerprint Login - Usernameless */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or</span>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  size="lg"
                  onClick={handleFingerprintLogin}
                  disabled={fingerprintLoading || isLoading}
                >
                  {fingerprintLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Authenticating...
                    </>
                  ) : (
                    <>
                      <Fingerprint className="mr-2 h-4 w-4" />
                      Login with Fingerprint
                    </>
                  )}
                </Button>
              </form>
            )}

            {/* Signup Mode */}
            {mode === "signup" && (
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-sm font-medium">First Name</Label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="firstName"
                        name="firstName"
                        placeholder="John"
                        className={`pl-12 ${errors.firstName ? 'border-destructive' : ''}`}
                        value={formData.firstName}
                        onChange={handleInputChange}
                      />
                    </div>
                    {errors.firstName && <p className="text-xs text-destructive">{errors.firstName}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-sm font-medium">Last Name</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      placeholder="Doe"
                      className={errors.lastName ? 'border-destructive' : ''}
                      value={formData.lastName}
                      onChange={handleInputChange}
                    />
                    {errors.lastName && <p className="text-xs text-destructive">{errors.lastName}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="john@crossdigi.com"
                      className={`pl-12 ${errors.email ? 'border-destructive' : ''}`}
                      value={formData.email}
                      onChange={handleInputChange}
                    />
                  </div>
                  {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="+92 300 1234567"
                      className={`pl-12 ${errors.phone ? 'border-destructive' : ''}`}
                      value={formData.phone}
                      onChange={handleInputChange}
                    />
                  </div>
                  {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="department" className="text-sm font-medium">Department</Label>
                    <div className="relative">
                      <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none z-10" />
                      <select
                        id="department"
                        name="department"
                        value={formData.department}
                        onChange={handleInputChange}
                        className={`flex h-11 w-full rounded-xl border-2 border-border bg-background pl-12 pr-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:border-primary/50 transition-all duration-200 appearance-none cursor-pointer ${errors.department ? 'border-destructive' : ''}`}
                      >
                        <option value="">Select...</option>
                        <option value="Manager">Manager</option>
                        <option value="HR">HR</option>
                        <option value="Agent">Agent</option>
                        <option value="Closer">Closer</option>
                        <option value="Developer">Developer</option>
                        <option value="SEO Expert">SEO Expert</option>
                        <option value="Intern">Intern</option>
                      </select>
                    </div>
                    {errors.department && <p className="text-xs text-destructive">{errors.department}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="designation" className="text-sm font-medium">Designation</Label>
                    <div className="relative">
                      <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none z-10" />
                      <select
                        id="designation"
                        name="designation"
                        value={formData.designation}
                        onChange={handleInputChange}
                        className={`flex h-11 w-full rounded-xl border-2 border-border bg-background pl-12 pr-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:border-primary/50 transition-all duration-200 appearance-none cursor-pointer ${errors.designation ? 'border-destructive' : ''}`}
                      >
                        <option value="">Select...</option>
                        <option value="Probation">Probation</option>
                        <option value="Senior">Senior</option>
                        <option value="Junior">Junior</option>
                        <option value="Intern">Intern</option>
                      </select>
                    </div>
                    {errors.designation && <p className="text-xs text-destructive">{errors.designation}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="gender" className="text-sm font-medium">Gender (Optional)</Label>
                    <select
                      id="gender"
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      className="flex h-11 w-full rounded-xl border-2 border-border bg-background px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:border-primary/50 transition-all duration-200 appearance-none cursor-pointer"
                    >
                      <option value="">Select...</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth" className="text-sm font-medium">DOB (Optional)</Label>
                    <Input
                      id="dateOfBirth"
                      name="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className={`pl-12 pr-12 ${errors.password ? 'border-destructive' : ''}`}
                      value={formData.password}
                      onChange={handleInputChange}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className={`pl-12 pr-12 ${errors.confirmPassword ? 'border-destructive' : ''}`}
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </Button>
              </form>
            )}

            <div className="mt-6 text-center">
              <span className="text-muted-foreground text-sm">
                {mode === "login" ? "Don't have an account? " :
                  mode === "signup" ? "Already have an account? " :
                    "Back to "}
              </span>
              <button
                onClick={() => {
                  setMode(mode === "login" ? "signup" : "login");
                  setErrors({});
                  setStatusCheck(null);
                }}
                className="text-primary font-medium hover:underline text-sm"
              >
                {mode === "login" ? "Sign up" : "Sign in"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
