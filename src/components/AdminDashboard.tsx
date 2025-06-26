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
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useSubmissions } from "../App";
import WallCreationForm from "./WallCreationForm";

interface Wall {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  submissionCount: number;
  pendingCount: number;
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
      submissionCount: 24,
      pendingCount: 3,
      shareableLink: "https://journal-wall.com/wall/gratitude-123",
    },
    {
      id: "2",
      title: "Daily Reflections",
      description: "End of day thoughts and reflections",
      createdAt: "2023-07-02",
      submissionCount: 18,
      pendingCount: 0,
      shareableLink: "https://journal-wall.com/wall/reflections-456",
    },
    {
      id: "3",
      title: "Creative Writing",
      description: "Share your poetry, short stories, or creative writing",
      createdAt: "2023-08-10",
      submissionCount: 12,
      pendingCount: 5,
      shareableLink: "https://journal-wall.com/wall/creative-789",
    },
  ]);

  // Use global submissions from context
  const [submissions, setSubmissions] = useState(globalSubmissions);

  // Update local submissions when global submissions change
  useEffect(() => {
    setSubmissions(globalSubmissions);

    // Show toast notification for new submissions
    if (globalSubmissions.length > previousSubmissionCount) {
      const newSubmissionsCount =
        globalSubmissions.length - previousSubmissionCount;
      toast({
        title: "New Submission!",
        description: `${newSubmissionsCount} new journal ${newSubmissionsCount === 1 ? "entry" : "entries"} submitted for review.`,
      });
    }
    setPreviousSubmissionCount(globalSubmissions.length);
  }, [globalSubmissions, previousSubmissionCount, toast]);

  const handleCreateWall = async (wallData: {
    title: string;
    description: string;
    isPrivate: boolean;
  }) => {
    const wallId = `wall-${Date.now()}`;
    const shareableLink = `${window.location.origin}/wall/${wallId}`;

    const wall: Wall = {
      id: wallId,
      title: wallData.title,
      description: wallData.description,
      createdAt: new Date().toISOString().split("T")[0],
      submissionCount: 0,
      pendingCount: 0,
      shareableLink,
    };

    setWalls([...walls, wall]);
    setIsCreateWallDialogOpen(false);

    return {
      success: true,
      wallId: wall.id,
      shareableLink: wall.shareableLink,
    };
  };

  const handleDeleteWall = (id: string) => {
    setWalls(walls.filter((wall) => wall.id !== id));
  };

  const handleApproveSubmission = (id: string) => {
    setSubmissions(
      submissions.map((submission) =>
        submission.id === id
          ? { ...submission, status: "approved" }
          : submission,
      ),
    );

    // Update the wall's pending count
    const submission = submissions.find((s) => s.id === id);
    if (submission) {
      setWalls(
        walls.map((wall) =>
          wall.id === submission.wallId
            ? {
                ...wall,
                pendingCount: wall.pendingCount - 1,
                submissionCount: wall.submissionCount + 1,
              }
            : wall,
        ),
      );
    }
  };

  const handleRejectSubmission = (id: string) => {
    setSubmissions(
      submissions.map((submission) =>
        submission.id === id
          ? { ...submission, status: "rejected" }
          : submission,
      ),
    );

    // Update the wall's pending count
    const submission = submissions.find((s) => s.id === id);
    if (submission) {
      setWalls(
        walls.map((wall) =>
          wall.id === submission.wallId
            ? { ...wall, pendingCount: wall.pendingCount - 1 }
            : wall,
        ),
      );
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
                          <span>{wall.submissionCount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">
                            Pending
                          </span>
                          <span>
                            {wall.pendingCount > 0 ? (
                              <Badge variant="destructive">
                                {wall.pendingCount}
                              </Badge>
                            ) : (
                              wall.pendingCount
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
                            <div className="w-16 h-16 relative overflow-hidden rounded-md">
                              <img
                                src={submission.imageUrl}
                                alt="Journal submission"
                                className="absolute inset-0 w-full h-full object-cover"
                              />
                            </div>
                          </TableCell>
                          <TableCell>{submission.wallTitle}</TableCell>
                          <TableCell>{submission.submittedAt}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
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
    </div>
  );
};

export default AdminDashboard;
