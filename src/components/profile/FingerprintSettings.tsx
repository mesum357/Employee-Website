import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { 
  Fingerprint, 
  Trash2, 
  Plus, 
  Loader2, 
  AlertCircle,
  CheckCircle,
  Calendar,
  Clock
} from "lucide-react";
import { authAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { startRegistration } from "@simplewebauthn/browser";

interface Credential {
  credentialId: string;
  deviceName: string;
  registeredAt: string;
  lastUsed?: string;
}

export const FingerprintSettings = () => {
  const { toast } = useToast();
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [deviceName, setDeviceName] = useState("");
  const [showRegisterForm, setShowRegisterForm] = useState(false);

  useEffect(() => {
    fetchCredentials();
  }, []);

  const fetchCredentials = async () => {
    try {
      setLoading(true);
      const response = await authAPI.getWebAuthnCredentials();
      setCredentials(response.data.data.credentials || []);
    } catch (error: any) {
      console.error('Error fetching credentials:', error);
      if (error.response?.status !== 404) {
        toast({
          title: "Error",
          description: "Failed to load fingerprint credentials",
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterFingerprint = async () => {
    if (!deviceName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a device name",
        variant: "destructive"
      });
      return;
    }

    try {
      setRegistering(true);

      // Step 1: Start registration
      const startResponse = await authAPI.webauthnRegisterStart();
      
      console.log('Registration start response:', startResponse);
      
      if (!startResponse.data.success || !startResponse.data.data) {
        console.error('Invalid response structure:', startResponse.data);
        throw new Error('Failed to get registration options from server');
      }

      const options = startResponse.data.data;

      // Validate options before using
      if (!options || !options.challenge) {
        console.error('Invalid options structure:', options);
        throw new Error('Invalid registration options received from server - missing challenge');
      }

      console.log('Options validated, starting registration...');
      console.log('Registration options:', JSON.stringify(options, null, 2));

      // Step 2: Use browser API to create credential
      // This will trigger the browser's biometric prompt (fingerprint/Touch ID/Windows Hello)
      // SimpleWebAuthn v13+ expects: { optionsJSON: options }
      try {
        const credential = await startRegistration({ optionsJSON: options });
        
        if (!credential || !credential.id) {
          throw new Error('No credential received from browser');
        }
        
        console.log('Credential created successfully:', {
          id: credential.id,
          type: credential.type,
          rawId: credential.rawId
        });
        
        // Step 3: Complete registration
        const completeResponse = await authAPI.webauthnRegisterComplete(deviceName, credential);
        
        if (completeResponse.data.success) {
          toast({
            title: "Success",
            description: "Fingerprint registered successfully!",
          });
          setDeviceName("");
          setShowRegisterForm(false);
          await fetchCredentials();
        }
      } catch (regError: any) {
        // Re-throw registration errors to be handled by outer catch
        throw regError;
      }
    } catch (error: any) {
      console.error('Error registering fingerprint:', error);
      let errorMessage = "Failed to register fingerprint";
      
      if (error.name === 'NotAllowedError') {
        errorMessage = "Fingerprint registration was cancelled or not supported";
      } else if (error.name === 'InvalidStateError') {
        errorMessage = "Fingerprint already registered on this device";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      // Log full error details for debugging
      if (error.response?.data) {
        console.error('Backend error response:', error.response.data);
      }

      toast({
        title: "Registration Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setRegistering(false);
    }
  };

  const handleDeleteCredential = async (credentialId: string) => {
    if (!confirm("Are you sure you want to remove this fingerprint?")) {
      return;
    }

    try {
      await authAPI.deleteWebAuthnCredential(credentialId);
      toast({
        title: "Success",
        description: "Fingerprint removed successfully",
      });
      await fetchCredentials();
    } catch (error: any) {
      console.error('Error deleting credential:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to remove fingerprint",
        variant: "destructive"
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Check if WebAuthn is supported
  const isWebAuthnSupported = () => {
    return typeof window !== 'undefined' && 
           'PublicKeyCredential' in window &&
           typeof window.PublicKeyCredential === 'function';
  };

  if (!isWebAuthnSupported()) {
    return (
      <div className="bg-warning/10 border border-warning/20 rounded-lg p-4 flex items-center gap-3">
        <AlertCircle className="w-5 h-5 text-warning" />
        <p className="text-sm text-muted-foreground">
          Fingerprint authentication is not supported in your browser. Please use a modern browser that supports WebAuthn.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            Register your fingerprint for quick and secure login. You can register multiple fingerprints.
          </p>
        </div>
        <Button
          onClick={() => setShowRegisterForm(!showRegisterForm)}
          disabled={registering}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          {showRegisterForm ? "Cancel" : "Add Fingerprint"}
        </Button>
      </div>

      {showRegisterForm && (
        <Card className="p-4 bg-secondary/50 border-border">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Device Name
              </label>
              <Input
                placeholder="e.g., My Phone, Work Laptop"
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
                disabled={registering}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Give this fingerprint a name to identify it later
              </p>
            </div>
            <Button
              onClick={handleRegisterFingerprint}
              disabled={registering || !deviceName.trim()}
              className="w-full gap-2"
            >
              {registering ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Registering...
                </>
              ) : (
                <>
                  <Fingerprint className="w-4 h-4" />
                  Register Fingerprint
                </>
              )}
            </Button>
          </div>
        </Card>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : credentials.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Fingerprint className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No fingerprints registered yet</p>
          <p className="text-sm mt-1">Add a fingerprint to enable quick login</p>
        </div>
      ) : (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-foreground">
            Registered Fingerprints ({credentials.length})
          </h4>
          {credentials.map((credential) => (
            <Card
              key={credential.credentialId}
              className="p-4 flex items-center justify-between hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Fingerprint className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    {credential.deviceName || "Fingerprint"}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Registered {formatDate(credential.registeredAt)}
                    </span>
                    {credential.lastUsed && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Last used {formatDate(credential.lastUsed)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDeleteCredential(credential.credentialId)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

