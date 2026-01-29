import { useState, useEffect, useRef } from "react";
import {
  X,
  CheckCircle,
  Clock,
  AlertTriangle,
  Flag,
  Calendar,
  Loader2,
  Send,
  Circle,
  Upload,
  Image as ImageIcon,
  X as XIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { taskAPI } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Task {
  _id: string;
  title: string;
  description: string;
  assignedBy?: { email: string };
  priority: "low" | "medium" | "high" | "urgent";
  status: "pending" | "in-progress" | "under-review" | "completed" | "cancelled" | "on-hold";
  dueDate: string;
  createdAt: string;
  progress?: number;
}

const priorityConfig = {
  low: { label: "Low", color: "bg-muted text-muted-foreground", icon: Circle },
  medium: { label: "Medium", color: "bg-primary/10 text-primary", icon: Circle },
  high: { label: "High", color: "bg-warning/10 text-warning", icon: Flag },
  urgent: { label: "Urgent", color: "bg-destructive/10 text-destructive", icon: AlertTriangle },
};

const statusConfig = {
  pending: { label: "Pending", color: "bg-muted text-muted-foreground" },
  "in-progress": { label: "In Progress", color: "bg-primary/10 text-primary" },
  "under-review": { label: "Under Review", color: "bg-warning/10 text-warning" },
  completed: { label: "Completed", color: "bg-success/10 text-success" },
  cancelled: { label: "Cancelled", color: "bg-destructive/10 text-destructive" },
  "on-hold": { label: "On Hold", color: "bg-muted text-muted-foreground" },
};

export function TasksPopup() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submissionNote, setSubmissionNote] = useState("");
  const [submissionDescription, setSubmissionDescription] = useState("");
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleOpenTasks = () => {
      setIsOpen(true);
      fetchTasks();
    };

    window.addEventListener('openTasks', handleOpenTasks);
    window.addEventListener('refreshTasks', fetchTasks);
    return () => {
      window.removeEventListener('openTasks', handleOpenTasks);
      window.removeEventListener('refreshTasks', fetchTasks);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchTasks();
    }
  }, [isOpen]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await taskAPI.getMy();
      setTasks(response.data.data.tasks || []);
    } catch (error: any) {
      console.error("Error fetching tasks:", error);
      toast({
        title: "Error",
        description: "Failed to load tasks",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      await taskAPI.update(taskId, { status: newStatus });
      toast({
        title: "Success",
        description: "Task status updated",
      });
      await fetchTasks();
    } catch (error: any) {
      console.error("Error updating task:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update task",
        variant: "destructive",
      });
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));

    if (imageFiles.length === 0) {
      toast({
        title: "Error",
        description: "Please select image files only",
        variant: "destructive",
      });
      return;
    }

    // Limit to 5 images
    const newImages = [...selectedImages, ...imageFiles].slice(0, 5);
    setSelectedImages(newImages);

    // Create previews
    const newPreviews = newImages.map(file => URL.createObjectURL(file));
    setImagePreviews(newPreviews);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    const newImages = selectedImages.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setSelectedImages(newImages);
    setImagePreviews(newPreviews);
    // Revoke object URLs to free memory
    URL.revokeObjectURL(imagePreviews[index]);
  };

  const uploadImages = async (taskId: string): Promise<string[]> => {
    const uploadedUrls: string[] = [];

    for (const image of selectedImages) {
      const formData = new FormData();
      formData.append('image', image);

      try {
        const response = await taskAPI.uploadImage(taskId, formData);

        if (response.data.success && response.data.data.attachment) {
          // The URL from backend is already relative (/uploads/tasks/...)
          // We need to construct the full URL
          const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
          const cleanBaseUrl = baseUrl.replace('/api', '');
          const fileUrl = response.data.data.attachment.url.startsWith('http')
            ? response.data.data.attachment.url
            : `${cleanBaseUrl}${response.data.data.attachment.url}`;
          uploadedUrls.push(fileUrl);
        }
      } catch (error: any) {
        console.error("Error uploading image:", error);
        throw new Error(`Failed to upload ${image.name}`);
      }
    }

    return uploadedUrls;
  };

  const handleSubmitTask = async () => {
    if (!selectedTask) return;

    try {
      setSubmitting(true);
      setUploadingImages(true);

      // Upload images first
      const uploadedAttachments: { name: string; url: string }[] = [];
      if (selectedImages.length > 0) {
        try {
          const uploadedUrls = await uploadImages(selectedTask._id);
          selectedImages.forEach((image, index) => {
            uploadedAttachments.push({
              name: image.name,
              url: uploadedUrls[index]
            });
          });
        } catch (error: any) {
          toast({
            title: "Error",
            description: error.message || "Failed to upload images",
            variant: "destructive",
          });
          setUploadingImages(false);
          setSubmitting(false);
          return;
        }
      }

      // Update task with submission description and attachments
      await taskAPI.update(selectedTask._id, {
        status: "under-review",
        progress: 100,
        submissionDescription: submissionDescription || submissionNote,
        attachments: uploadedAttachments
      });

      toast({
        title: "Success",
        description: "Task submitted for review",
      });

      setSelectedTask(null);
      setSubmissionNote("");
      setSubmissionDescription("");
      setSelectedImages([]);
      setImagePreviews([]);
      // Clean up object URLs
      imagePreviews.forEach(url => URL.revokeObjectURL(url));
      await fetchTasks();
    } catch (error: any) {
      console.error("Error submitting task:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to submit task",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
      setUploadingImages(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const isOverdue = (dueDate: string, status: string) => {
    return new Date(dueDate) < new Date() && status !== "completed" && status !== "cancelled";
  };

  const pendingTasks = tasks.filter((t) => t.status === "pending");
  const inProgressTasks = tasks.filter((t) => t.status === "in-progress");
  const underReviewTasks = tasks.filter((t) => t.status === "under-review");
  const completedTasks = tasks.filter((t) => t.status === "completed");

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>My Tasks</DialogTitle>
          <DialogDescription>
            View and manage tasks assigned to you
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="flex-1 overflow-hidden flex flex-col gap-4">
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-card rounded-lg border border-border p-4">
                <div className="text-2xl font-bold">{pendingTasks.length}</div>
                <div className="text-sm text-muted-foreground">Pending</div>
              </div>
              <div className="bg-card rounded-lg border border-border p-4">
                <div className="text-2xl font-bold">{inProgressTasks.length}</div>
                <div className="text-sm text-muted-foreground">In Progress</div>
              </div>
              <div className="bg-card rounded-lg border border-border p-4">
                <div className="text-2xl font-bold">{underReviewTasks.length}</div>
                <div className="text-sm text-muted-foreground">Under Review</div>
              </div>
              <div className="bg-card rounded-lg border border-border p-4">
                <div className="text-2xl font-bold">{completedTasks.length}</div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </div>
            </div>

            {/* Tasks List */}
            <div className="flex-1 overflow-y-auto space-y-3">
              {tasks.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No tasks assigned to you</p>
                </div>
              ) : (
                tasks.map((task) => {
                  const priority = priorityConfig[task.priority];
                  const status = statusConfig[task.status] || statusConfig.pending;
                  const PriorityIcon = priority.icon;
                  const overdue = isOverdue(task.dueDate, task.status);

                  return (
                    <div
                      key={task._id}
                      className={cn(
                        "bg-card rounded-lg border border-border p-4 hover:shadow-md transition-shadow",
                        overdue && "border-destructive/50"
                      )}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          <div className={cn("p-2 rounded-lg", priority.color)}>
                            <PriorityIcon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold">{task.title}</h4>
                              <Badge className={cn("text-xs", priority.color)}>
                                {priority.label}
                              </Badge>
                              <Badge className={cn("text-xs", status.color)}>
                                {status.label}
                              </Badge>
                              {overdue && (
                                <Badge variant="destructive" className="text-xs">
                                  Overdue
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                              {task.description || "No description"}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                Due: {formatDate(task.dueDate)}
                              </div>
                              {task.progress !== undefined && (
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {task.progress}% complete
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {task.status === "pending" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusChange(task._id, "in-progress")}
                            >
                              Start
                            </Button>
                          )}
                          {task.status === "in-progress" && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedTask(task)}
                              >
                                Submit
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStatusChange(task._id, "completed")}
                              >
                                Complete
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </DialogContent>

      {/* Submit Task Dialog */}
      <Dialog open={!!selectedTask} onOpenChange={() => {
        setSelectedTask(null);
        setSubmissionNote("");
        setSubmissionDescription("");
        setSelectedImages([]);
        imagePreviews.forEach(url => URL.revokeObjectURL(url));
        setImagePreviews([]);
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Submit Task for Review</DialogTitle>
            <DialogDescription>
              Submit "{selectedTask?.title}" for review by your manager
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Submission Description <span className="text-muted-foreground">(Required)</span>
              </label>
              <Textarea
                placeholder="Describe what you've completed, any issues encountered, or additional details..."
                className="min-h-[120px]"
                value={submissionDescription}
                onChange={(e) => setSubmissionDescription(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">
                Upload Images <span className="text-muted-foreground">(Optional, max 5)</span>
              </label>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageSelect}
                    className="hidden"
                    id="task-image-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={selectedImages.length >= 5}
                    className="flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    {selectedImages.length >= 5 ? "Max 5 images" : "Select Images"}
                  </Button>
                  {selectedImages.length > 0 && (
                    <span className="text-sm text-muted-foreground">
                      {selectedImages.length} image(s) selected
                    </span>
                  )}
                </div>
                {imagePreviews.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border border-border"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <XIcon className="w-4 h-4" />
                        </button>
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          {selectedImages[index].name}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setSelectedTask(null);
                setSubmissionNote("");
                setSubmissionDescription("");
                setSelectedImages([]);
                imagePreviews.forEach(url => URL.revokeObjectURL(url));
                setImagePreviews([]);
              }}
              className="flex-1"
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitTask}
              disabled={submitting || uploadingImages || !submissionDescription.trim()}
              className="flex-1"
            >
              {submitting || uploadingImages ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {uploadingImages ? "Uploading..." : "Submitting..."}
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Submit for Review
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}

