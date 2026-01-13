import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { employeeAPI } from "@/lib/api";
import { 
  User,
  Loader2,
  Save,
  AlertCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Settings = () => {
  const { user, fetchUser } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  useEffect(() => {
    if (user?.employee) {
      setFirstName(user.employee.firstName || "");
      setLastName(user.employee.lastName || "");
      setLoading(false);
    }
  }, [user]);

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      toast({
        title: "Validation Error",
        description: "First name and last name cannot be empty",
        variant: "destructive"
      });
      return;
    }

    if (!user?.employee?.id) {
      toast({
        title: "Error",
        description: "Employee profile not found",
        variant: "destructive"
      });
      return;
    }

    try {
      setSaving(true);
      setError(null);
      
      await employeeAPI.updateProfile(user.employee.id, {
        firstName: firstName.trim(),
        lastName: lastName.trim()
      });
      
      // Refresh user context to update the name in the sidebar
      await fetchUser();
      
      toast({
        title: "Success",
        description: "Name updated successfully"
      });
    } catch (err: any) {
      console.error('Error updating name:', err);
      setError(err.response?.data?.message || 'Failed to update name');
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to update name",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-h2 text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account settings</p>
      </div>

      {/* Change Name Card */}
      <Card className="dashboard-card">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <User className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-h5 text-foreground">Change Name</h2>
            <p className="text-caption text-muted-foreground">
              Update your first and last name
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center gap-2 text-destructive">
            <AlertCircle className="w-5 h-5" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Enter your first name"
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Enter your last name"
                disabled={saving}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              onClick={handleSave}
              disabled={saving || !firstName.trim() || !lastName.trim()}
              className="gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Settings;
