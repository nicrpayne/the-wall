import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Eye,
  Share2,
  AlertCircle,
  ArrowLeft,
  Grid3X3,
  ChevronLeft,
  ChevronRight,
  Settings,
  Upload,
  Move,
  Trash2,
  Save,
  X,
  GripVertical,
} from "lucide-react";
import ZoomableImage from "./ZoomableImage";
import JournalUploader from "./JournalUploader";
import WallCreationForm from "./WallCreationForm";
import { useSwipeable } from "react-swipeable";

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
  onSubmitEntry?: (files: File | File[]) => Promise<void>;
  isAdminMode?: boolean;
  onUpdateWall?: (wallData: {
    title: string;
    description: string;
    isPrivate: boolean;
  }) => Promise<void>;
  onReorderEntries?: (reorderedEntries: JournalEntry[]) => Promise<void>;
  wallData?: {
    id: string;
    title: string;
    description: string;
    is_private: boolean;
  };
}

const CommunityWall = ({
  wallId = "wall-123",
  title = "Community Journal Wall",
  description = "Share your thoughts and reflections with the community. All entries are anonymous.",
  entries = [],
  isFirstVisit = false,
  onSubmitEntry = async (files: File | File[]) => {},
  isAdminMode = false,
  onUpdateWall = async () => {},
  onReorderEntries = async () => {},
  wallData,
}: CommunityWallProps) => {
  const [showUploader, setShowUploader] = useState(isFirstVisit);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [activeTab, setActiveTab] = useState("grid");

  // Mobile view states
  const [viewMode, setViewMode] = useState<"grid" | "scroll" | "zoom">("grid");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  // Admin functionality states
  const [showSettings, setShowSettings] = useState(false);
  const [isRearrangeMode, setIsRearrangeMode] = useState(false);
  const [reorderedEntries, setReorderedEntries] =
    useState<JournalEntry[]>(entries);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  useEffect(() => {
    // Check local storage to see if user has already submitted to this wall
    // Skip this check in admin mode
    if (!isAdminMode) {
      const hasVisited = localStorage.getItem(`wall-visited-${wallId}`);
      if (hasVisited) {
        setShowUploader(false);
      } else {
        setShowUploader(isFirstVisit);
      }
    } else {
      setShowUploader(false); // Admin doesn't need to submit first
    }

    // Check if mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, [wallId, isFirstVisit, isAdminMode]);

  // Update reordered entries when entries prop changes
  useEffect(() => {
    setReorderedEntries(entries);
  }, [entries]);

  const handleSubmit = async (files: File | File[]) => {
    setIsLoading(true);
    try {
      await onSubmitEntry(files);
      if (!isAdminMode) {
        // Mark that user has submitted to this wall (only for regular users)
        localStorage.setItem(`wall-visited-${wallId}`, "true");
        setHasSubmitted(true);
      }
      setShowUploader(false);
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

  const handleImageClick = (entry: JournalEntry, index: number) => {
    if (isMobile) {
      setCurrentImageIndex(index);
      setViewMode("scroll");
    } else {
      setSelectedEntry(entry);
    }
  };

  const handleScrollImageClick = (entry: JournalEntry) => {
    setSelectedEntry(entry);
    setViewMode("zoom");
  };

  const navigateImage = (direction: "prev" | "next") => {
    if (direction === "prev" && currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    } else if (direction === "next" && currentImageIndex < entries.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
  };

  // Settings functionality
  const handleUpdateWall = async (wallData: {
    title: string;
    description: string;
    isPrivate: boolean;
  }) => {
    try {
      await onUpdateWall(wallData);
      setShowSettings(false);
    } catch (error) {
      console.error("Error updating wall:", error);
    }
  };

  // Rearrange functionality
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null) return;

    const newEntries = [...reorderedEntries];
    const draggedEntry = newEntries[draggedIndex];
    newEntries.splice(draggedIndex, 1);
    newEntries.splice(dropIndex, 0, draggedEntry);

    setReorderedEntries(newEntries);
    setDraggedIndex(null);
  };

  const handleSaveRearrange = async () => {
    try {
      await onReorderEntries(reorderedEntries);
      setIsRearrangeMode(false);
    } catch (error) {
      console.error("Error saving rearranged entries:", error);
    }
  };

  const handleCancelRearrange = () => {
    setReorderedEntries(entries);
    setIsRearrangeMode(false);
  };

  // Swipe handlers for mobile navigation
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      if (viewMode === "scroll" && currentImageIndex < entries.length - 1) {
        setCurrentImageIndex(currentImageIndex + 1);
      }
    },
    onSwipedRight: () => {
      if (viewMode === "scroll" && currentImageIndex > 0) {
        setCurrentImageIndex(currentImageIndex - 1);
      }
    },
    onSwipedDown: () => {
      if (viewMode === "zoom") {
        setSelectedEntry(null);
        setViewMode("scroll");
      } else if (viewMode === "scroll") {
        setViewMode("grid");
      }
    },
    preventDefaultTouchmoveEvent: true,
    trackMouse: true,
  });

  if (showUploader) {
    return (
      <div className="bg-background min-h-screen p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2">{title}</h1>
              <p className="text-muted-foreground">{description}</p>
            </div>
            {isAdminMode && (
              <Button variant="outline" onClick={() => setShowUploader(false)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Wall
              </Button>
            )}
          </div>

          <Card className="mb-6">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">
                {isAdminMode ? "Add New Entry" : "Share Your Journal Entry"}
              </h2>
              <p className="text-muted-foreground mb-6">
                {isAdminMode
                  ? "Upload journal entries directly to this wall. Your entries will be added immediately without requiring approval."
                  : "To view the community wall, please share your own journal entry first. Your submission will be reviewed by a moderator before being added to the wall."}
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
            {isAdminMode && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowUploader(true)}
                  disabled={isRearrangeMode}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Add Entry
                </Button>
                {!isRearrangeMode ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsRearrangeMode(true)}
                      disabled={entries.length === 0}
                    >
                      <Move className="h-4 w-4 mr-2" />
                      Rearrange
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowSettings(true)}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSaveRearrange}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save Order
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancelRearrange}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </>
                )}
              </>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleShareWall}
              disabled={isRearrangeMode}
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share Wall
            </Button>
          </div>
        </div>

        {hasSubmitted && !isAdminMode && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Thank you for your submission! It has been sent for review and
              will appear on the wall once approved.
            </AlertDescription>
          </Alert>
        )}

        {isRearrangeMode && (
          <Alert className="mb-6">
            <Move className="h-4 w-4" />
            <AlertDescription>
              Drag and drop entries to reorder them. Click "Save Order" when
              finished or "Cancel" to discard changes.
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
                  {entries.length} entries{" "}
                  {isRearrangeMode && "(Rearrange Mode)"}
                </p>
              </div>

              <TabsContent value="grid" className="mt-0">
                <div
                  className={`grid gap-4 ${
                    isMobile
                      ? "grid-cols-3 gap-2"
                      : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
                  }`}
                >
                  {(isRearrangeMode ? reorderedEntries : entries).map(
                    (entry, index) => (
                      <Card
                        key={entry.id}
                        className={`overflow-hidden transition-transform ${
                          isRearrangeMode
                            ? "cursor-move border-2 border-dashed border-primary/50 hover:border-primary"
                            : "cursor-pointer hover:scale-[1.02]"
                        }`}
                        onClick={
                          isRearrangeMode
                            ? undefined
                            : () => handleImageClick(entry, index)
                        }
                        draggable={isRearrangeMode}
                        onDragStart={
                          isRearrangeMode
                            ? (e) => handleDragStart(e, index)
                            : undefined
                        }
                        onDragOver={
                          isRearrangeMode ? handleDragOver : undefined
                        }
                        onDrop={
                          isRearrangeMode
                            ? (e) => handleDrop(e, index)
                            : undefined
                        }
                      >
                        <div
                          className={`relative ${
                            isMobile ? "aspect-square" : "aspect-[3/4]"
                          }`}
                        >
                          {isRearrangeMode && (
                            <div className="absolute top-2 right-2 z-10 bg-white/90 rounded-full p-1">
                              <GripVertical className="h-4 w-4 text-gray-600" />
                            </div>
                          )}
                          <img
                            src={entry.imageUrl}
                            alt="Journal entry"
                            className="object-cover w-full h-full"
                            loading="lazy"
                          />
                          {!isMobile && !isRearrangeMode && (
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                              <div className="flex items-center justify-between">
                                <span className="text-white text-xs">
                                  {new Date(
                                    entry.createdAt,
                                  ).toLocaleDateString()}
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
                          )}
                          {isRearrangeMode && (
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                              <div className="flex items-center justify-center">
                                <span className="text-white text-xs font-medium">
                                  Position {index + 1}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </Card>
                    ),
                  )}
                </div>
              </TabsContent>

              <TabsContent value="list" className="mt-0">
                <div className="space-y-4">
                  {entries.map((entry) => (
                    <Card key={entry.id} className="overflow-hidden">
                      <div
                        className="flex flex-col md:flex-row cursor-pointer"
                        onClick={() => handleImageClick(entry, index)}
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

      {/* Mobile Scroll View */}
      {isMobile && viewMode === "scroll" && (
        <div className="fixed inset-0 z-50 bg-black" {...swipeHandlers}>
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-4">
            <div className="flex items-center justify-between text-white">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode("grid")}
                className="text-white hover:bg-white/20"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Grid
              </Button>
              <span className="text-sm">
                {currentImageIndex + 1} of {entries.length}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode("grid")}
                className="text-white hover:bg-white/20"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Image */}
          <div className="flex items-center justify-center h-full px-4">
            <img
              src={entries[currentImageIndex]?.imageUrl}
              alt="Journal entry"
              className="max-w-full max-h-full object-contain cursor-pointer"
              onClick={() => handleScrollImageClick(entries[currentImageIndex])}
            />
          </div>

          {/* Navigation */}
          <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/80 to-transparent p-4">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateImage("prev")}
                disabled={currentImageIndex === 0}
                className="text-white hover:bg-white/20"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <div className="text-white text-center">
                <p className="text-xs opacity-75">
                  Posted{" "}
                  {new Date(
                    entries[currentImageIndex]?.createdAt,
                  ).toLocaleDateString()}
                </p>
                <p className="text-xs mt-1 opacity-50">
                  Tap image to zoom • Swipe to navigate • Swipe down to return
                </p>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateImage("next")}
                disabled={currentImageIndex === entries.length - 1}
                className="text-white hover:bg-white/20"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Dialog or Mobile Zoom View */}
      <Dialog
        open={!!selectedEntry && (!isMobile || viewMode === "zoom")}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedEntry(null);
            if (isMobile) {
              setViewMode("scroll");
            }
          }
        }}
      >
        <DialogContent
          className={`${
            isMobile && viewMode === "zoom"
              ? "fixed inset-0 max-w-none max-h-none m-0 p-0 bg-black"
              : "max-w-4xl max-h-[95vh] overflow-hidden"
          }`}
        >
          {(!isMobile || viewMode !== "zoom") && (
            <DialogHeader>
              <DialogTitle>Journal Entry</DialogTitle>
            </DialogHeader>
          )}
          {selectedEntry && (
            <div
              className={`${isMobile && viewMode === "zoom" ? "h-full" : "mt-4"}`}
              {...(isMobile ? swipeHandlers : {})}
            >
              <div
                className={`${isMobile && viewMode === "zoom" ? "h-full" : "h-[70vh] mb-4"}`}
              >
                <ZoomableImage
                  src={selectedEntry.imageUrl}
                  alt="Journal entry"
                  className="w-full h-full"
                />
              </div>
              {(!isMobile || viewMode !== "zoom") && (
                <div className="flex justify-between items-center text-sm text-muted-foreground pt-4 border-t">
                  <span>
                    Posted on{" "}
                    {new Date(selectedEntry.createdAt).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Wall Settings</DialogTitle>
            <DialogDescription>
              Update the title, description, and privacy settings for this wall.
            </DialogDescription>
          </DialogHeader>
          <WallCreationForm
            initialData={
              wallData
                ? {
                    title: wallData.title,
                    description: wallData.description,
                    isPrivate: wallData.is_private,
                  }
                : undefined
            }
            onSubmit={async (data) => {
              await handleUpdateWall(data);
              return { success: true };
            }}
            isEditMode={true}
            onCancel={() => setShowSettings(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CommunityWall;
