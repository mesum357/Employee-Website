import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { employeeAPI } from "@/lib/api";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building,
  Calendar,
  FileText,
  Camera,
  Edit,
  Download,
  Upload,
  Briefcase,
  Heart,
  Loader2,
  AlertCircle,
  Save,
  X,
  Plus
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { FingerprintSettings } from "@/components/profile/FingerprintSettings";
import profileBg from "@/assets/bg.png";

interface EmployeeProfile {
  _id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  department?: {
    _id: string;
    name: string;
  };
  designation?: string;
  dateOfJoining?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  emergencyContact?: {
    name?: string;
    relation?: string;
    phone?: string;
  };
  avatar?: string;
  skills?: string[];
  manager?: {
    firstName?: string;
    lastName?: string;
    employeeId?: string;
    designation?: string;
  };
  leaveBalance?: {
    annual?: number;
    sick?: number;
    casual?: number;
  };
  documents?: Array<{
    name: string;
    url: string;
    uploadedAt: string;
  }>;
}

const Profile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<EmployeeProfile | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    phone: "",
    address: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "Pakistan"
    },
    emergencyContact: {
      name: "",
      relation: "",
      phone: ""
    },
    skills: [] as string[]
  });
  const [newSkill, setNewSkill] = useState("");

  // Document upload state
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [docName, setDocName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Fetch profile data
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await employeeAPI.getProfile();
      const employeeData = response.data.data.user.employee;

      if (employeeData) {
        setProfile(employeeData);
        setFormData({
          phone: employeeData.phone || "",
          address: {
            street: employeeData.address?.street || "",
            city: employeeData.address?.city || "",
            state: employeeData.address?.state || "",
            zipCode: employeeData.address?.zipCode || "",
            country: employeeData.address?.country || "Pakistan"
          },
          emergencyContact: {
            name: employeeData.emergencyContact?.name || "",
            relation: employeeData.emergencyContact?.relation || "",
            phone: employeeData.emergencyContact?.phone || ""
          },
          skills: employeeData.skills || []
        });
      }
    } catch (err: any) {
      console.error('Error fetching profile:', err);
      setError(err.response?.data?.message || 'Failed to load profile');
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };



  const handleSave = async () => {
    if (!profile) return;

    try {
      setSaving(true);
      setError(null);

      await employeeAPI.updateProfile(profile._id, {
        phone: formData.phone,
        address: formData.address,
        emergencyContact: formData.emergencyContact,
        skills: formData.skills
      });

      // Refresh profile data
      await fetchProfile();

      setIsEditing(false);
      toast({
        title: "Success",
        description: "Profile updated successfully"
      });
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.response?.data?.message || 'Failed to update profile');
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to update profile",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        phone: profile.phone || "",
        address: {
          street: profile.address?.street || "",
          city: profile.address?.city || "",
          state: profile.address?.state || "",
          zipCode: profile.address?.zipCode || "",
          country: profile.address?.country || "Pakistan"
        },
        emergencyContact: {
          name: profile.emergencyContact?.name || "",
          relation: profile.emergencyContact?.relation || "",
          phone: profile.emergencyContact?.phone || ""
        },
        skills: profile.skills || []
      });
    }
    setIsEditing(false);
    setError(null);
  };

  const addSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData({
        ...formData,
        skills: [...formData.skills, newSkill.trim()]
      });
      setNewSkill("");
    }
  };

  const removeSkill = (skill: string) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter(s => s !== skill)
    });
  };

  const handleDocumentUpload = async () => {
    if (!profile || !selectedFile) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('name', docName || selectedFile.name);

      await employeeAPI.uploadDocument(profile._id, formData);

      toast({
        title: "Success",
        description: "Document uploaded successfully"
      });

      setUploadDialogOpen(false);
      setDocName("");
      setSelectedFile(null);

      // Refresh profile to show new document
      await fetchProfile();
    } catch (err: any) {
      console.error('Error uploading document:', err);
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to upload document",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const getAvatarInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getFullAddress = () => {
    if (!profile?.address) return "N/A";
    const addr = profile.address;
    const parts = [
      addr.street,
      addr.city,
      addr.state,
      addr.zipCode,
      addr.country
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : "N/A";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto text-destructive mb-4" />
          <p className="text-muted-foreground">{error || "Profile not found"}</p>
        </div>
      </div>
    );
  }

  const managerName = profile.manager
    ? `${profile.manager.firstName || ''} ${profile.manager.lastName || ''}`.trim()
    : "N/A";



  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card className="dashboard-card overflow-hidden">
        <div
          className="h-32 bg-cover bg-center"
          style={{ backgroundImage: `url(${profileBg})` }}
        />
        <div className="px-6 pb-6">
          <div className="flex flex-col md:flex-row md:items-end gap-4 -mt-16">
            <div className="relative">
              <div className="w-32 h-32 rounded-2xl bg-card border-4 border-card flex items-center justify-center shadow-lg">
                {profile.avatar ? (
                  <img
                    src={profile.avatar}
                    alt={`${profile.firstName} ${profile.lastName}`}
                    className="w-full h-full object-cover rounded-2xl"
                  />
                ) : (
                  <span className="text-4xl font-bold text-primary">
                    {getAvatarInitials(profile.firstName, profile.lastName)}
                  </span>
                )}
              </div>
              {isEditing && (
                <button className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors">
                  <Camera className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h1 className="text-h2 text-foreground">
                    {profile.firstName} {profile.lastName}
                  </h1>
                  <p className="text-muted-foreground">{profile.designation || "Employee"}</p>
                  <div className="flex items-center gap-4 mt-2">
                    {profile.department && (
                      <Badge variant="secondary">{profile.department.name}</Badge>
                    )}
                    <span className="text-caption flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {profile.address?.city || "N/A"}
                      {profile.address?.country && `, ${profile.address.country}`}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  {isEditing ? (
                    <>
                      <Button
                        variant="outline"
                        onClick={handleCancel}
                        disabled={saving}
                        className="gap-2"
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="gap-2"
                      >
                        {saving ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        Save Changes
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="outline"
                      className="gap-2"
                      onClick={() => setIsEditing(true)}
                    >
                      <Edit className="w-4 h-4" />
                      Edit Profile
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {error && (
        <Card className="dashboard-card bg-destructive/10 border-destructive/20">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="w-5 h-5" />
            <p>{error}</p>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="about" className="space-y-6">
            <TabsList>
              <TabsTrigger value="about">About</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="about" className="space-y-6">
              <Card className="dashboard-card">
                <h3 className="text-h5 text-foreground mb-4">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50">
                      <Mail className="w-5 h-5 text-muted-foreground" />
                      <span className="text-foreground">{profile.email}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50">
                      <Phone className="w-5 h-5 text-muted-foreground" />
                      {isEditing ? (
                        <Input
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="border-0 bg-transparent p-0 h-auto"
                          placeholder="Phone number"
                        />
                      ) : (
                        <span className="text-foreground">{profile.phone || "N/A"}</span>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Address</Label>
                    {isEditing ? (
                      <div className="space-y-3 p-3 rounded-xl bg-secondary/50">
                        <Input
                          placeholder="Street Address"
                          value={formData.address.street}
                          onChange={(e) => setFormData({
                            ...formData,
                            address: { ...formData.address, street: e.target.value }
                          })}
                        />
                        <div className="grid grid-cols-2 gap-3">
                          <Input
                            placeholder="City"
                            value={formData.address.city}
                            onChange={(e) => setFormData({
                              ...formData,
                              address: { ...formData.address, city: e.target.value }
                            })}
                          />
                          <Input
                            placeholder="State"
                            value={formData.address.state}
                            onChange={(e) => setFormData({
                              ...formData,
                              address: { ...formData.address, state: e.target.value }
                            })}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <Input
                            placeholder="Zip Code"
                            value={formData.address.zipCode}
                            onChange={(e) => setFormData({
                              ...formData,
                              address: { ...formData.address, zipCode: e.target.value }
                            })}
                          />
                          <Input
                            placeholder="Country"
                            value={formData.address.country}
                            onChange={(e) => setFormData({
                              ...formData,
                              address: { ...formData.address, country: e.target.value }
                            })}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50">
                        <MapPin className="w-5 h-5 text-muted-foreground" />
                        <span className="text-foreground">{getFullAddress()}</span>
                      </div>
                    )}
                  </div>
                </div>
              </Card>

              <Card className="dashboard-card">
                <h3 className="text-h5 text-foreground mb-4">Emergency Contact</h3>
                {isEditing ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input
                        value={formData.emergencyContact.name}
                        onChange={(e) => setFormData({
                          ...formData,
                          emergencyContact: { ...formData.emergencyContact, name: e.target.value }
                        })}
                        placeholder="Emergency contact name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Relation</Label>
                      <Input
                        value={formData.emergencyContact.relation}
                        onChange={(e) => setFormData({
                          ...formData,
                          emergencyContact: { ...formData.emergencyContact, relation: e.target.value }
                        })}
                        placeholder="e.g., Spouse, Parent"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>Phone</Label>
                      <Input
                        value={formData.emergencyContact.phone}
                        onChange={(e) => setFormData({
                          ...formData,
                          emergencyContact: { ...formData.emergencyContact, phone: e.target.value }
                        })}
                        placeholder="Emergency contact phone"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50">
                      <User className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="text-foreground font-medium">
                          {profile.emergencyContact?.name || "N/A"}
                        </p>
                        <p className="text-caption text-muted-foreground">
                          {profile.emergencyContact?.relation || ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50">
                      <Phone className="w-5 h-5 text-muted-foreground" />
                      <span className="text-foreground">
                        {profile.emergencyContact?.phone || "N/A"}
                      </span>
                    </div>
                  </div>
                )}
              </Card>

              <Card className="dashboard-card">
                <h3 className="text-h5 text-foreground mb-4">Skills & Expertise</h3>
                <div className="flex flex-wrap gap-2 mb-3">
                  {formData.skills.map((skill) => (
                    <Badge key={skill} variant="outline" className="py-2 px-4">
                      {skill}
                      {isEditing && (
                        <button
                          onClick={() => removeSkill(skill)}
                          className="ml-2 hover:text-destructive"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </Badge>
                  ))}
                </div>
                {isEditing && (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a skill"
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addSkill();
                        }
                      }}
                      className="flex-1"
                    />
                    <Button variant="outline" size="sm" onClick={addSkill}>
                      <Edit className="w-3 h-3 mr-1" />
                      Add
                    </Button>
                  </div>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="documents">
              <Card className="dashboard-card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-h5 text-foreground">My Documents</h3>
                  <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="gap-2">
                        <Upload className="w-4 h-4" />
                        Upload
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Upload Document</DialogTitle>
                        <DialogDescription>
                          Add a new document to your profile. Allowed formats: PDF and images.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="docName">Document Name</Label>
                          <Input
                            id="docName"
                            placeholder="e.g., CNIC, Degree"
                            value={docName}
                            onChange={(e) => setDocName(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="file">File</Label>
                          <Input
                            id="file"
                            type="file"
                            accept=".pdf,image/*"
                            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setUploadDialogOpen(false)}
                          disabled={uploading}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleDocumentUpload}
                          disabled={uploading || !selectedFile}
                        >
                          {uploading ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4 mr-2" />
                              Upload
                            </>
                          )}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
                {profile.documents && profile.documents.length > 0 ? (
                  <div className="space-y-3">
                    {profile.documents.map((doc, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                            <FileText className="w-5 h-5 text-destructive" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{doc.name}</p>
                            <p className="text-caption">
                              {new Date(doc.uploadedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => window.open(doc.url, '_blank')}>
                          <Download className="w-5 h-5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No documents uploaded yet</p>
                  </div>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="settings">
              <Card className="dashboard-card">
                <h3 className="text-h5 text-foreground mb-4">Fingerprint Authentication</h3>
                <FingerprintSettings />
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="dashboard-card">
            <h3 className="text-h6 text-foreground mb-4">Quick Info</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Employee ID</span>
                <span className="font-medium text-foreground">{profile.employeeId}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Join Date</span>
                <span className="font-medium text-foreground">
                  {formatDate(profile.dateOfJoining)}
                </span>
              </div>
              {profile.department && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Department</span>
                  <Badge variant="secondary">{profile.department.name}</Badge>
                </div>
              )}
            </div>
          </Card>



          {managerName !== "N/A" && (
            <Card className="dashboard-card">
              <h3 className="text-h6 text-foreground mb-4">Manager</h3>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-medium text-primary">
                    {getAvatarInitials(
                      profile.manager?.firstName || "",
                      profile.manager?.lastName || ""
                    )}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-foreground">{managerName}</p>
                  <p className="text-caption">
                    {profile.manager?.designation || "Manager"}
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
