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
import { useSubmissions } from "../App";
import WallCreationForm from "./WallCreationForm";
import ZoomableImage from "./ZoomableImage";

interface Wall {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  shareableLink: string;
}

interface Submission {
  id: string;
  wallId: string;
  wallTitle: string;
  imageUrl: string;
  status: "pending" | "approved" | "rejected";
  submittedAt: string;
}

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("walls");
  const [isCreateWallDialogOpen, setIsCreateWallDialogOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] =
    useState<Submission | null>(null);
  const { toast } = useToast();
  const { submissions: globalSubmissions } = useSubmissions();
  const [previousSubmissionCount, setPreviousSubmissionCount] = useState(0);

  // Mock data for walls
  const [walls, setWalls] = useState<Wall[]>([
    {
      id: "1",
      title: "Gratitude Journal",
      description: "Share what you're grateful for today",
      createdAt: "2023-06-15",
      shareableLink: "https://journal-wall.com/wall/gratitude-123",
    },
    {
      id: "2",
      title: "Daily Reflections",
      description: "End of day thoughts and reflections",
      createdAt: "2023-07-02",
      shareableLink: "https://journal-wall.com/wall/reflections-456",
    },
    {
      id: "3",
      title: "Creative Writing",
      description: "Share your poetry, short stories, or creative writing",
      createdAt: "2023-08-10",
      shareableLink: "https://journal-wall.com/wall/creative-789",
    },
  ]);

  // Helper functions to calculate submission counts dynamically
  const getSubmissionCount = (wallId: string) => {
    return submissions.filter(
      (submission) =>
        submission.wallId === wallId && submission.status === "approved",
    ).length;
  };

  const getPendingCount = (wallId: string) => {
    return submissions.filter(
      (submission) =>
        submission.wallId === wallId && submission.status === "pending",
    ).length;
  };

  // Use global submissions directly from context
  const submissions = globalSubmissions;

  // Show toast notification for new submissions
  useEffect(() => {
    if (
      globalSubmissions.length > previousSubmissionCount &&
      previousSubmissionCount > 0
    ) {
      const newSubmissionsCount =
        globalSubmissions.length - previousSubmissionCount;
      toast({
        title: "New Submission!",
        description: `${newSubmissionsCount} new journal ${newSubmissionsCount === 1 ? "entry" : "entries"} submitted for review.`,
      });
    }
    setPreviousSubmissionCount(globalSubmissions.length);
  }, [globalSubmissions, previousSubmissionCount, toast]);

  // Initialize previous count after first render to avoid false notifications
  useEffect(() => {
    if (previousSubmissionCount === 0) {
      setPreviousSubmissionCount(globalSubmissions.length);
    }
  }, [globalSubmissions.length, previousSubmissionCount]);

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
    const wallId = `wall-${Date.now()}`;
    const shareableLink = `${window.location.origin}/wall/${wallId}`;
    const wallCode = generateWallCode();

    const wall: Wall = {
      id: wallId,
      title: wallData.title,
      description: wallData.description,
      createdAt: new Date().toISOString().split("T")[0],
      shareableLink,
    };

    setWalls([...walls, wall]);
    // Don't close the dialog immediately - let the form show the success state
    // setIsCreateWallDialogOpen(false);

    return {
      success: true,
      wallId: wall.id,
      shareableLink: wall.shareableLink,
      wallCode: wallCode,
    };
  };

  const handleDeleteWall = (id: string) => {
    setWalls(walls.filter((wall) => wall.id !== id));
  };

  const handleApproveSubmission = (id: string) => {
    // Update the submission status in localStorage directly
    const updatedSubmissions = submissions.map((submission) =>
      submission.id === id
        ? { ...submission, status: "approved" as const }
        : submission,
    );

    try {
      localStorage.setItem(
        "journal-submissions",
        JSON.stringify(updatedSubmissions),
      );
      // Dispatch custom event to notify other windows
      window.dispatchEvent(
        new CustomEvent("submissions-updated", {
          detail: { submissions: updatedSubmissions },
        }),
      );
    } catch (error) {
      console.error("Error updating submission status:", error);
    }
  };

  const handleRejectSubmission = (id: string) => {
    // Update the submission status in localStorage directly
    const updatedSubmissions = submissions.map((submission) =>
      submission.id === id
        ? { ...submission, status: "rejected" as const }
        : submission,
    );

    try {
      localStorage.setItem(
        "journal-submissions",
        JSON.stringify(updatedSubmissions),
      );
      // Dispatch custom event to notify other windows
      window.dispatchEvent(
        new CustomEvent("submissions-updated", {
          detail: { submissions: updatedSubmissions },
        }),
      );
    } catch (error) {
      console.error("Error updating submission status:", error);
    }
  };

  const pendingSubmissions = submissions.filter(
    (submission) => submission.status === "pending",
  );

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
                            Created
                          </span>
                          <span>{wall.createdAt}</span>
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
                          navigator.clipboard.writeText(wall.shareableLink);
                          alert("Wall link copied to clipboard!");
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
                  <p className="text-muted-foreground mt-1">
                    Create your first community wall to get started
                  </p>
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
                                src={submission.imageUrl}
                                alt="Journal submission"
                                className="absolute inset-0 w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center">
                                <Eye className="h-4 w-4 text-white opacity-0 hover:opacity-100 transition-opacity" />
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{submission.wallTitle}</TableCell>
                          <TableCell>{submission.submittedAt}</TableCell>
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
                  Submitted to &quot;{selectedSubmission.wallTitle}&quot; on{" "}
                  {selectedSubmission.submittedAt}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          {selectedSubmission && (
            <div className="mt-4">
              <div className="h-[60vh] mb-4">
                <ZoomableImage
                  src={selectedSubmission.imageUrl}
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
