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
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  wallsApi,
  submissionsApi,
  Wall,
  Submission,
  subscribeToSubmissions,
} from "../lib/supabase";
import WallCreationForm from "./WallCreationForm";
import ZoomableImage from "./ZoomableImage";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("walls");
  const [isCreateWallDialogOpen, setIsCreateWallDialogOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] =
    useState<Submission | null>(null);
  const { toast } = useToast();
  const [walls, setWalls] = useState<Wall[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [previousSubmissionCount, setPreviousSubmissionCount] = useState(0);

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

    // Subscribe to real-time updates
    const subscription = subscribeToSubmissions((updatedSubmissions) => {
      setSubmissions(updatedSubmissions);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [toast]);

  // Helper functions to calculate submission counts dynamically
  const getSubmissionCount = (wallId: string) => {
    return submissions.filter(
      (submission) =>
        submission.wall_id === wallId && submission.status === "approved",
    ).length;
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

  const handleDeleteWall = async (id: string) => {
    try {
      await wallsApi.delete(id);
      setWalls(walls.filter((wall) => wall.id !== id));
      toast({
        title: "Success",
        description: "Wall deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting wall:", error);
      toast({
        title: "Error",
        description: "Failed to delete wall. Please try again.",
        variant: "destructive",
      });
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

  return (
    <div className="container mx-auto p-4 bg-background">
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Manage your community walls and review submissions
        </p>
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
                    <CardHeader>
                      <CardTitle>{wall.title}</CardTitle>
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
                            Submissions
                          </span>
                          <span>{getSubmissionCount(wall.id)}</span>
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
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive"
                          onClick={() => handleDeleteWall(wall.id)}
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
              <h2 className="text-xl font-semibold mb-4">
                Pending Submissions
              </h2>

              {pendingSubmissions.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
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
    </div>
  );
};

export default AdminDashboard;
