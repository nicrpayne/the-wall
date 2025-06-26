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
import ZoomableImage from "./ZoomableImage";
import JournalUploader from "./JournalUploader";

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
  entries = [],
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
              <JournalUploader
                onSubmit={handleSubmit}
                isSubmitting={isLoading}
              />
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
        <DialogContent className="max-w-4xl max-h-[95vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Journal Entry</DialogTitle>
          </DialogHeader>
          {selectedEntry && (
            <div className="mt-4">
              <div className="h-[70vh] mb-4">
                <ZoomableImage
                  src={selectedEntry.imageUrl}
                  alt="Journal entry"
                  className="w-full h-full"
                />
              </div>
              <div className="flex justify-between items-center text-sm text-muted-foreground pt-4 border-t">
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
