import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  PlusCircle,
  Edit,
  Trash2,
  ExternalLink,
  CheckCircle,
  XCircle,
  Eye,
  LogOut,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  wallsApi,
  submissionsApi,
  entriesApi,
  authApi,
  Wall,
  Submission,
  Entry,
  subscribeToSubmissions,
  subscribeToEntries,
} from "../lib/supabase";
import WallCreationForm from "./WallCreationForm";
import ZoomableImage from "./ZoomableImage";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("walls");
  const [isCreateWallDialogOpen, setIsCreateWallDialogOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] =
    useState<Submission | null>(null);
  const [selectedWallForEdit, setSelectedWallForEdit] = useState<Wall | null>(
    null,
  );
  const [wallToDelete, setWallToDelete] = useState<Wall | null>(null);
  const { toast } = useToast();
  const [walls, setWalls] = useState<Wall[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [allEntries, setAllEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [previousSubmissionCount, setPreviousSubmissionCount] = useState(0);

  // Bulk selection state
  const [selectedSubmissionIds, setSelectedSubmissionIds] = useState<
    Set<string>
  >(new Set());
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [wallsData, submissionsData] = await Promise.all([
          wallsApi.getAll(),
          submissionsApi.getAll(),
        ]);
        setWalls(wallsData);
        setSubmissions(submissionsData);
        setPreviousSubmissionCount(submissionsData.length);

        // Load all entries from all walls to get accurate counts
        const allEntriesPromises = wallsData.map((wall) =>
          entriesApi.getByWallId(wall.id).catch((error) => {
            console.error(`Error loading entries for wall ${wall.id}:`, error);
            return [];
          }),
        );
        const entriesArrays = await Promise.all(allEntriesPromises);
        const flatEntries = entriesArrays.flat();
        setAllEntries(flatEntries);

        console.log("🔵 [AdminDashboard] Loaded data:", {
          walls: wallsData.length,
          submissions: submissionsData.length,
          directEntries: flatEntries.length,
          wallsWithCounts: wallsData.map((wall) => ({
            id: wall.id,
            title: wall.title,
            approvedSubmissions: submissionsData.filter(
              (s) => s.wall_id === wall.id && s.status === "approved",
            ).length,
            directEntries: flatEntries.filter((e) => e.wall_id === wall.id)
              .length,
          })),
        });
      } catch (error) {
        console.error("Error loading data:", error);
        toast({
          title: "Error",
          description: "Failed to load data. Please refresh the page.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // Subscribe to real-time updates for submissions
    const submissionsSubscription = subscribeToSubmissions(
      (updatedSubmissions) => {
        console.log(
          "🔔 [AdminDashboard] Real-time submission update received:",
          updatedSubmissions.length,
        );
        setSubmissions(updatedSubmissions);
      },
    );

    // Subscribe to real-time updates for entries (to update entry counts)
    const entriesSubscriptions = walls.map((wall) =>
      subscribeToEntries(wall.id, (updatedEntries) => {
        console.log(
          `🔔 [AdminDashboard] Real-time entries update for wall ${wall.id}:`,
          updatedEntries.length,
        );
        setAllEntries((prevEntries) => {
          // Remove old entries for this wall and add updated ones
          const otherWallEntries = prevEntries.filter(
            (entry) => entry.wall_id !== wall.id,
          );
          return [...otherWallEntries, ...updatedEntries];
        });
      }),
    );

    return () => {
      submissionsSubscription.unsubscribe();
      entriesSubscriptions.forEach((sub) => sub.unsubscribe());
    };
  }, [toast, walls.length]); // Add walls.length to dependency to re-subscribe when walls change

  // Helper functions to calculate entry counts dynamically
  const getTotalEntryCount = (wallId: string) => {
    // Count both approved submissions and direct entries
    const approvedSubmissionCount = submissions.filter(
      (submission) =>
        submission.wall_id === wallId && submission.status === "approved",
    ).length;

    const directEntryCount = allEntries.filter(
      (entry) => entry.wall_id === wallId,
    ).length;

    const total = approvedSubmissionCount + directEntryCount;

    console.log(`🔵 [AdminDashboard] Entry count for wall ${wallId}:`, {
      approvedSubmissions: approvedSubmissionCount,
      directEntries: directEntryCount,
      total,
    });

    return total;
  };

  const getPendingCount = (wallId: string) => {
    return submissions.filter(
      (submission) =>
        submission.wall_id === wallId && submission.status === "pending",
    ).length;
  };

  // Calculate pending submissions
  const pendingSubmissions = submissions.filter(
    (submission) => submission.status === "pending",
  );

  // Show toast notification for new submissions
  useEffect(() => {
    if (
      submissions.length > previousSubmissionCount &&
      previousSubmissionCount > 0
    ) {
      const newSubmissionsCount = submissions.length - previousSubmissionCount;
      toast({
        title: "New Submission!",
        description: `${newSubmissionsCount} new journal ${newSubmissionsCount === 1 ? "entry" : "entries"} submitted for review.`,
      });
    }
    setPreviousSubmissionCount(submissions.length);
  }, [submissions.length, previousSubmissionCount, toast]);

  const generateWallCode = () => {
    // Generate a 6-character alphanumeric code
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleCreateWall = async (wallData: {
    title: string;
    description: string;
    isPrivate: boolean;
    headerImageUrl?: string;
  }) => {
    try {
      console.log(
        "🔧 [handleCreateWall] Starting wall creation with data:",
        wallData,
      );

      const wallCode = generateWallCode();
      console.log("🔧 [handleCreateWall] Generated wall code:", wallCode);

      // First create the wall without the shareable link
      const wallToCreate = {
        title: wallData.title,
        description: wallData.description,
        wall_code: wallCode,
        shareable_link: "", // Temporary empty value
        is_private: wallData.isPrivate,
        header_image_url: wallData.headerImageUrl || null,
      };

      console.log(
        "🔧 [handleCreateWall] Creating wall with data:",
        wallToCreate,
      );
      const newWall = await wallsApi.create(wallToCreate);
      console.log("🔧 [handleCreateWall] Wall created successfully:", newWall);

      // Now use the actual database-generated ID for the shareable link
      const shareableLink = `${window.location.origin}/wall/${newWall.id}`;
      console.log(
        "🔧 [handleCreateWall] Generated shareable link:",
        shareableLink,
      );

      // Update the wall with the correct shareable link
      console.log("🔧 [handleCreateWall] Updating wall with shareable link...");
      const updatedWall = await wallsApi.update(newWall.id, {
        shareable_link: shareableLink,
      });
      console.log(
        "🔧 [handleCreateWall] Wall updated successfully:",
        updatedWall,
      );

      setWalls([updatedWall, ...walls]);

      return {
        success: true,
        wallId: updatedWall.id,
        shareableLink: updatedWall.shareable_link,
        wallCode: updatedWall.wall_code,
      };
    } catch (error) {
      console.error("🔴 [handleCreateWall] Error creating wall:", error);
      console.error("🔴 [handleCreateWall] Error details:", {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
        stack: error?.stack,
      });

      let errorMessage = "Failed to create wall. Please try again.";

      // Provide more specific error messages based on the error
      if (error?.message) {
        if (error.message.includes("duplicate key")) {
          errorMessage =
            "A wall with this code already exists. Please try again.";
        } else if (error.message.includes("permission")) {
          errorMessage =
            "Permission denied. Please check your database permissions.";
        } else if (error.message.includes("network")) {
          errorMessage =
            "Network error. Please check your connection and try again.";
        } else {
          errorMessage = `Error: ${error.message}`;
        }
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  const handleDeleteWall = async (wall: Wall) => {
    try {
      console.log("🔴 [handleDeleteWall] Starting wall deletion:", {
        wallId: wall.id,
        wallTitle: wall.title,
        wallCode: wall.wall_code,
      });

      // Check if wall has any entries or submissions
      const entryCount = getTotalEntryCount(wall.id);
      const pendingCount = getPendingCount(wall.id);

      console.log("🔴 [handleDeleteWall] Wall content check:", {
        entryCount,
        pendingCount,
        totalContent: entryCount + pendingCount,
      });

      // Call the API to delete the wall
      console.log("🔴 [handleDeleteWall] Calling wallsApi.delete...");
      await wallsApi.delete(wall.id);
      console.log(
        "🔴 [handleDeleteWall] Wall deleted from database successfully",
      );

      // Update local state
      setWalls(walls.filter((w) => w.id !== wall.id));
      console.log("🔴 [handleDeleteWall] Local state updated");

      // Close the confirmation dialog
      setWallToDelete(null);

      toast({
        title: "Success",
        description: `Wall "${wall.title}" deleted successfully.`,
      });
    } catch (error) {
      console.error("🔴 [handleDeleteWall] Error deleting wall:", error);
      console.error("🔴 [handleDeleteWall] Error details:", {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
        stack: error?.stack,
      });

      let errorMessage = "Failed to delete wall. Please try again.";

      // Provide more specific error messages
      if (error?.message) {
        if (
          error.message.includes("foreign key") ||
          error.message.includes("constraint")
        ) {
          errorMessage =
            "Cannot delete wall: it contains submissions or entries. Please remove all content first.";
        } else if (error.message.includes("permission")) {
          errorMessage =
            "Permission denied. You don't have permission to delete this wall.";
        } else if (error.message.includes("not found")) {
          errorMessage = "Wall not found. It may have already been deleted.";
        } else {
          errorMessage = `Delete failed: ${error.message}`;
        }
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });

      // Close the confirmation dialog even on error
      setWallToDelete(null);
    }
  };

  const handleApproveSubmission = async (id: string) => {
    try {
      await submissionsApi.updateStatus(id, "approved");
      setSubmissions(
        submissions.map((submission) =>
          submission.id === id
            ? { ...submission, status: "approved" as const }
            : submission,
        ),
      );
      toast({
        title: "Success",
        description: "Submission approved successfully.",
      });
    } catch (error) {
      console.error("Error approving submission:", error);
      toast({
        title: "Error",
        description: "Failed to approve submission. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRejectSubmission = async (id: string) => {
    try {
      await submissionsApi.updateStatus(id, "rejected");
      setSubmissions(
        submissions.map((submission) =>
          submission.id === id
            ? { ...submission, status: "rejected" as const }
            : submission,
        ),
      );
      toast({
        title: "Success",
        description: "Submission rejected.",
      });
    } catch (error) {
      console.error("Error rejecting submission:", error);
      toast({
        title: "Error",
        description: "Failed to reject submission. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Bulk selection functions
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedSubmissionIds(new Set(pendingSubmissions.map((s) => s.id)));
    } else {
      setSelectedSubmissionIds(new Set());
    }
  };

  const handleSelectSubmission = (submissionId: string, checked: boolean) => {
    const newSelected = new Set(selectedSubmissionIds);
    if (checked) {
      newSelected.add(submissionId);
    } else {
      newSelected.delete(submissionId);
    }
    setSelectedSubmissionIds(newSelected);
  };

  // Bulk approval function
  const handleBulkApprove = async () => {
    if (selectedSubmissionIds.size === 0) return;

    setIsBulkProcessing(true);
    const selectedIds = Array.from(selectedSubmissionIds);

    try {
      // Process all approvals in parallel
      const approvalPromises = selectedIds.map(async (id) => {
        try {
          await submissionsApi.updateStatus(id, "approved");
          return { id, success: true };
        } catch (error) {
          console.error(`Error approving submission ${id}:`, error);
          return { id, success: false, error };
        }
      });

      const results = await Promise.all(approvalPromises);
      const successful = results.filter((r) => r.success);
      const failed = results.filter((r) => !r.success);

      // Update local state for successful approvals
      if (successful.length > 0) {
        const successfulIds = successful.map((r) => r.id);
        setSubmissions((prevSubmissions) =>
          prevSubmissions.map((submission) =>
            successfulIds.includes(submission.id)
              ? { ...submission, status: "approved" as const }
              : submission,
          ),
        );
      }

      // Clear selections
      setSelectedSubmissionIds(new Set());

      // Show appropriate toast
      if (failed.length === 0) {
        toast({
          title: "Success",
          description: `${successful.length} submission${successful.length === 1 ? "" : "s"} approved successfully.`,
        });
      } else if (successful.length > 0) {
        toast({
          title: "Partial Success",
          description: `${successful.length} approved, ${failed.length} failed. Please try again for the failed ones.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to approve submissions. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error in bulk approval:", error);
      toast({
        title: "Error",
        description: "Failed to approve submissions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsBulkProcessing(false);
    }
  };

  // Bulk rejection function
  const handleBulkReject = async () => {
    if (selectedSubmissionIds.size === 0) return;

    setIsBulkProcessing(true);
    const selectedIds = Array.from(selectedSubmissionIds);

    try {
      // Process all rejections in parallel
      const rejectionPromises = selectedIds.map(async (id) => {
        try {
          await submissionsApi.updateStatus(id, "rejected");
          return { id, success: true };
        } catch (error) {
          console.error(`Error rejecting submission ${id}:`, error);
          return { id, success: false, error };
        }
      });

      const results = await Promise.all(rejectionPromises);
      const successful = results.filter((r) => r.success);
      const failed = results.filter((r) => !r.success);

      // Update local state for successful rejections
      if (successful.length > 0) {
        const successfulIds = successful.map((r) => r.id);
        setSubmissions((prevSubmissions) =>
          prevSubmissions.map((submission) =>
            successfulIds.includes(submission.id)
              ? { ...submission, status: "rejected" as const }
              : submission,
          ),
        );
      }

      // Clear selections
      setSelectedSubmissionIds(new Set());

      // Show appropriate toast
      if (failed.length === 0) {
        toast({
          title: "Success",
          description: `${successful.length} submission${successful.length === 1 ? "" : "s"} rejected.`,
        });
      } else if (successful.length > 0) {
        toast({
          title: "Partial Success",
          description: `${successful.length} rejected, ${failed.length} failed. Please try again for the failed ones.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to reject submissions. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error in bulk rejection:", error);
      toast({
        title: "Error",
        description: "Failed to reject submissions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleEditWall = async (wallData: {
    title: string;
    description: string;
    isPrivate: boolean;
    headerImageUrl?: string;
  }) => {
    if (!selectedWallForEdit) return { success: false };

    try {
      const updatedWall = await wallsApi.update(selectedWallForEdit.id, {
        title: wallData.title,
        description: wallData.description,
        is_private: wallData.isPrivate,
        header_image_url: wallData.headerImageUrl || null,
      });

      setWalls(
        walls.map((wall) =>
          wall.id === selectedWallForEdit.id ? updatedWall : wall,
        ),
      );
      setSelectedWallForEdit(null);

      toast({
        title: "Success",
        description: "Wall updated successfully.",
      });

      return { success: true };
    } catch (error) {
      console.error("Error updating wall:", error);
      toast({
        title: "Error",
        description: "Failed to update wall. Please try again.",
        variant: "destructive",
      });
      return { success: false };
    }
  };

  const handleLogout = async () => {
    try {
      await authApi.signOut();
      window.location.href = "/";
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Error",
        description: "Failed to logout. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto p-4 bg-background">
      <header className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
            <p className="text-muted-foreground">
              Manage your community walls and review submissions
            </p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <div className="flex justify-between items-center mb-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList>
            <TabsTrigger value="walls">Walls</TabsTrigger>
            <TabsTrigger value="submissions">
              Submissions
              {pendingSubmissions.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {pendingSubmissions.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <div className="mt-4">
            <TabsContent value="walls" className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Your Community Walls</h2>
                <Dialog
                  open={isCreateWallDialogOpen}
                  onOpenChange={setIsCreateWallDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Create New Wall
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Community Wall</DialogTitle>
                      <DialogDescription>
                        Fill out the details below to create a new community
                        wall for journal submissions.
                      </DialogDescription>
                    </DialogHeader>
                    <WallCreationForm onSubmit={handleCreateWall} />
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {walls.map((wall) => (
                  <Card key={wall.id}>
                    {wall.header_image_url && (
                      <div className="w-full h-32 overflow-hidden">
                        <img
                          src={wall.header_image_url}
                          alt={`${wall.title} header`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex-1">{wall.title}</CardTitle>
                        {wall.is_private && (
                          <Badge variant="secondary" className="ml-2">
                            Private
                          </Badge>
                        )}
                      </div>
                      <CardDescription>{wall.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">
                            Wall Code
                          </span>
                          <span className="font-mono font-semibold">
                            {wall.wall_code}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">
                            Created
                          </span>
                          <span>
                            {new Date(wall.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">
                            Total Entries
                          </span>
                          <span>{getTotalEntryCount(wall.id)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">
                            Pending
                          </span>
                          <span>
                            {getPendingCount(wall.id) > 0 ? (
                              <Badge variant="destructive">
                                {getPendingCount(wall.id)}
                              </Badge>
                            ) : (
                              getPendingCount(wall.id)
                            )}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedWallForEdit(wall)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            window.open(
                              `/wall/${wall.id}?admin=true`,
                              "_blank",
                            );
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Preview
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive"
                          onClick={() => setWallToDelete(wall)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(wall.shareable_link);
                          toast({
                            title: "Success",
                            description: "Wall link copied to clipboard!",
                          });
                        }}
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Copy Link
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>

              {walls.length === 0 && (
                <div className="text-center py-12">
                  <h3 className="text-lg font-medium">No walls created yet</h3>
                  <p className="text-muted-foreground mt-1 mb-4">
                    Create your first community wall to get started
                  </p>
                  <Button
                    variant="outline"
                    onClick={async () => {
                      try {
                        const sampleWall = await wallsApi.createSampleWall();
                        setWalls([sampleWall]);
                        toast({
                          title: "Sample Wall Created!",
                          description: `Sample wall created with code: ${sampleWall.wall_code}`,
                        });
                      } catch (error) {
                        console.error("Error creating sample wall:", error);
                        toast({
                          title: "Error",
                          description:
                            "Failed to create sample wall. Check console for details.",
                          variant: "destructive",
                        });
                      }
                    }}
                  >
                    Create Sample Wall for Testing
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="submissions">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Pending Submissions</h2>
                {pendingSubmissions.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {selectedSubmissionIds.size} of{" "}
                      {pendingSubmissions.length} selected
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkApprove()}
                      disabled={
                        selectedSubmissionIds.size === 0 || isBulkProcessing
                      }
                    >
                      {isBulkProcessing ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle className="h-4 w-4 mr-2" />
                      )}
                      Approve Selected ({selectedSubmissionIds.size})
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkReject()}
                      disabled={
                        selectedSubmissionIds.size === 0 || isBulkProcessing
                      }
                      className="text-destructive"
                    >
                      {isBulkProcessing ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <XCircle className="h-4 w-4 mr-2" />
                      )}
                      Reject Selected ({selectedSubmissionIds.size})
                    </Button>
                  </div>
                )}
              </div>

              {pendingSubmissions.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={
                              selectedSubmissionIds.size ===
                                pendingSubmissions.length &&
                              pendingSubmissions.length > 0
                            }
                            onCheckedChange={handleSelectAll}
                            aria-label="Select all submissions"
                          />
                        </TableHead>
                        <TableHead>Preview</TableHead>
                        <TableHead>Wall</TableHead>
                        <TableHead>Submitted</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingSubmissions.map((submission) => (
                        <TableRow key={submission.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedSubmissionIds.has(submission.id)}
                              onCheckedChange={(checked) =>
                                handleSelectSubmission(
                                  submission.id,
                                  checked as boolean,
                                )
                              }
                              aria-label={`Select submission from ${submission.wall_title}`}
                            />
                          </TableCell>
                          <TableCell>
                            <div
                              className="w-16 h-16 relative overflow-hidden rounded-md cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => setSelectedSubmission(submission)}
                            >
                              <img
                                src={submission.image_url}
                                alt="Journal submission"
                                className="absolute inset-0 w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center">
                                <Eye className="h-4 w-4 text-white opacity-0 hover:opacity-100 transition-opacity" />
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{submission.wall_title}</TableCell>
                          <TableCell>
                            {new Date(
                              submission.submitted_at,
                            ).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  setSelectedSubmission(submission)
                                }
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Review
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-green-600"
                                onClick={() =>
                                  handleApproveSubmission(submission.id)
                                }
                                disabled={isBulkProcessing}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-destructive"
                                onClick={() =>
                                  handleRejectSubmission(submission.id)
                                }
                                disabled={isBulkProcessing}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <h3 className="text-lg font-medium">
                    No pending submissions
                  </h3>
                  <p className="text-muted-foreground mt-1">
                    All submissions have been reviewed
                  </p>
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Submission Review Dialog */}
      <Dialog
        open={!!selectedSubmission}
        onOpenChange={(open) => !open && setSelectedSubmission(null)}
      >
        <DialogContent className="max-w-4xl max-h-[95vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Review Journal Submission</DialogTitle>
            <DialogDescription>
              {selectedSubmission && (
                <span>
                  Submitted to &quot;{selectedSubmission.wall_title}&quot; on{" "}
                  {new Date(
                    selectedSubmission.submitted_at,
                  ).toLocaleDateString()}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          {selectedSubmission && (
            <div className="mt-4">
              <div className="h-[60vh] mb-4">
                <ZoomableImage
                  src={selectedSubmission.image_url}
                  alt="Journal submission for review"
                  className="w-full h-full"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setSelectedSubmission(null)}
                >
                  Close
                </Button>
                <Button
                  variant="outline"
                  className="text-destructive"
                  onClick={() => {
                    handleRejectSubmission(selectedSubmission.id);
                    setSelectedSubmission(null);
                  }}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Reject
                </Button>
                <Button
                  className="text-green-600 bg-green-50 hover:bg-green-100"
                  onClick={() => {
                    handleApproveSubmission(selectedSubmission.id);
                    setSelectedSubmission(null);
                  }}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Approve
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Wall Dialog */}
      <Dialog
        open={!!selectedWallForEdit}
        onOpenChange={(open) => !open && setSelectedWallForEdit(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Wall Settings</DialogTitle>
            <DialogDescription>
              Update the settings for "{selectedWallForEdit?.title}".
            </DialogDescription>
          </DialogHeader>
          {selectedWallForEdit && (
            <WallCreationForm
              onSubmit={handleEditWall}
              initialData={{
                title: selectedWallForEdit.title,
                description: selectedWallForEdit.description,
                isPrivate: selectedWallForEdit.is_private,
                headerImageUrl: selectedWallForEdit.header_image_url,
              }}
              isEditMode={true}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!wallToDelete}
        onOpenChange={(open) => !open && setWallToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete Wall
            </AlertDialogTitle>
            <AlertDialogDescription>
              {wallToDelete && (
                <div className="space-y-2">
                  <p>
                    Are you sure you want to delete &quot;
                    <strong>{wallToDelete.title}</strong>&quot;?
                  </p>
                  <div className="bg-muted p-3 rounded-md text-sm">
                    <p>
                      <strong>Wall Code:</strong> {wallToDelete.wall_code}
                    </p>
                    <p>
                      <strong>Total Entries:</strong>{" "}
                      {getTotalEntryCount(wallToDelete.id)}
                    </p>
                    <p>
                      <strong>Pending Submissions:</strong>{" "}
                      {getPendingCount(wallToDelete.id)}
                    </p>
                  </div>
                  <p className="text-destructive font-medium">
                    This action cannot be undone. All associated submissions and
                    entries will also be deleted.
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => wallToDelete && handleDeleteWall(wallToDelete)}
            >
              Delete Wall
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminDashboard;
