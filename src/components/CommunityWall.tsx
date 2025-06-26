import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, Share2, AlertCircle } from "lucide-react";

// Define a mock JournalUploader component since we don't have access to the actual implementation
interface JournalUploaderProps {
  onSubmit: (file: File) => Promise<void>;
  isLoading?: boolean;
}

const JournalUploader: React.FC<JournalUploaderProps> = ({
  onSubmit,
  isLoading = false,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFile) {
      await onSubmit(selectedFile);
    }
  };

  return (
    <div className="bg-background p-4 rounded-md border">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-md p-6">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
          />
          <p className="mt-2 text-sm text-muted-foreground">
            Upload a photo of your journal entry
          </p>
        </div>

        {selectedFile && (
          <div className="mt-4">
            <p className="text-sm font-medium">
              Selected file: {selectedFile.name}
            </p>
            <div className="mt-2">
              <img
                src={URL.createObjectURL(selectedFile)}
                alt="Preview"
                className="max-h-64 rounded-md mx-auto"
              />
            </div>
          </div>
        )}

        <Button
          type="submit"
          disabled={!selectedFile || isLoading}
          className="w-full"
        >
          {isLoading ? "Uploading..." : "Submit Journal Entry"}
        </Button>
      </form>
    </div>
  );
};

interface JournalEntry {
  id: string;
  imageUrl: string;
  createdAt: string;
  approved: boolean;
}

interface CommunityWallProps {
  wallId?: string;
  title?: string;
  description?: string;
  entries?: JournalEntry[];
  isFirstVisit?: boolean;
  onSubmitEntry?: (file: File) => Promise<void>;
}

const CommunityWall = ({
  wallId = "wall-123",
  title = "Community Journal Wall",
  description = "Share your thoughts and reflections with the community. All entries are anonymous.",
  entries = [
    {
      id: "1",
      imageUrl:
        "https://images.unsplash.com/photo-1527236438218-d82077ae1f85?w=600&q=80",
      createdAt: "2023-06-15",
      approved: true,
    },
    {
      id: "2",
      imageUrl:
        "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=600&q=80",
      createdAt: "2023-06-16",
      approved: true,
    },
    {
      id: "3",
      imageUrl:
        "https://images.unsplash.com/photo-1517842645767-c639042777db?w=600&q=80",
      createdAt: "2023-06-17",
      approved: true,
    },
    {
      id: "4",
      imageUrl:
        "https://images.unsplash.com/photo-1517842536804-bf6629e2c291?w=600&q=80",
      createdAt: "2023-06-18",
      approved: true,
    },
  ],
  isFirstVisit = false,
  onSubmitEntry = async () => {},
}: CommunityWallProps) => {
  const [showUploader, setShowUploader] = useState(isFirstVisit);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [activeTab, setActiveTab] = useState("grid");

  useEffect(() => {
    // Check local storage to see if user has already submitted to this wall
    const hasVisited = localStorage.getItem(`wall-visited-${wallId}`);
    if (hasVisited) {
      setShowUploader(false);
    } else {
      setShowUploader(isFirstVisit);
    }
  }, [wallId, isFirstVisit]);

  const handleSubmit = async (file: File) => {
    setIsLoading(true);
    try {
      await onSubmitEntry(file);
      // Mark that user has submitted to this wall
      localStorage.setItem(`wall-visited-${wallId}`, "true");
      setShowUploader(false);
      setHasSubmitted(true);
    } catch (error) {
      console.error("Error submitting entry:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShareWall = () => {
    if (navigator.share) {
      navigator.share({
        title: title,
        text: description,
        url: window.location.href,
      });
    } else {
      // Fallback for browsers that don't support the Web Share API
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  if (showUploader) {
    return (
      <div className="bg-background min-h-screen p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">{title}</h1>
          <p className="text-muted-foreground mb-6">{description}</p>

          <Card className="mb-6">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">
                Share Your Journal Entry
              </h2>
              <p className="text-muted-foreground mb-6">
                To view the community wall, please share your own journal entry
                first. Your submission will be reviewed by a moderator before
                being added to the wall.
              </p>
              <JournalUploader onSubmit={handleSubmit} isLoading={isLoading} />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">{title}</h1>
            <p className="text-muted-foreground">{description}</p>
          </div>
          <div className="flex mt-4 md:mt-0 space-x-2">
            <Button variant="outline" size="sm" onClick={handleShareWall}>
              <Share2 className="h-4 w-4 mr-2" />
              Share Wall
            </Button>
          </div>
        </div>

        {hasSubmitted && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Thank you for your submission! It has been sent for review and
              will appear on the wall once approved.
            </AlertDescription>
          </Alert>
        )}

        {entries.length === 0 ? (
          <Card className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-2">No Entries Yet</h2>
            <p className="text-muted-foreground mb-4">
              Be the first to have your journal entry featured on this wall!
            </p>
          </Card>
        ) : (
          <>
            <Tabs
              defaultValue="grid"
              className="mb-6"
              onValueChange={setActiveTab}
            >
              <div className="flex justify-between items-center mb-4">
                <TabsList>
                  <TabsTrigger value="grid">Grid View</TabsTrigger>
                  <TabsTrigger value="list">List View</TabsTrigger>
                </TabsList>
                <p className="text-sm text-muted-foreground">
                  {entries.length} entries
                </p>
              </div>

              <TabsContent value="grid" className="mt-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {entries.map((entry) => (
                    <Card
                      key={entry.id}
                      className="overflow-hidden cursor-pointer transition-transform hover:scale-[1.02]"
                      onClick={() => setSelectedEntry(entry)}
                    >
                      <div className="aspect-[3/4] relative">
                        <img
                          src={entry.imageUrl}
                          alt="Journal entry"
                          className="object-cover w-full h-full"
                          loading="lazy"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                          <div className="flex items-center justify-between">
                            <span className="text-white text-xs">
                              {new Date(entry.createdAt).toLocaleDateString()}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-white p-0 h-auto"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="list" className="mt-0">
                <div className="space-y-4">
                  {entries.map((entry) => (
                    <Card key={entry.id} className="overflow-hidden">
                      <div
                        className="flex flex-col md:flex-row cursor-pointer"
                        onClick={() => setSelectedEntry(entry)}
                      >
                        <div className="md:w-48 h-48 md:h-auto">
                          <img
                            src={entry.imageUrl}
                            alt="Journal entry"
                            className="object-cover w-full h-full"
                            loading="lazy"
                          />
                        </div>
                        <div className="p-4 flex flex-col justify-between flex-grow">
                          <div>
                            <p className="text-sm text-muted-foreground mb-2">
                              Posted on{" "}
                              {new Date(entry.createdAt).toLocaleDateString()}
                            </p>
                            <p className="line-clamp-3">
                              Click to view this journal entry
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="self-end"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>

      <Dialog
        open={!!selectedEntry}
        onOpenChange={(open) => !open && setSelectedEntry(null)}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Journal Entry</DialogTitle>
          </DialogHeader>
          {selectedEntry && (
            <div className="mt-2">
              <div className="rounded-md overflow-hidden mb-4">
                <img
                  src={selectedEntry.imageUrl}
                  alt="Journal entry"
                  className="w-full object-contain max-h-[70vh]"
                />
              </div>
              <div className="flex justify-between items-center text-sm text-muted-foreground">
                <span>
                  Posted on{" "}
                  {new Date(selectedEntry.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CommunityWall;
