import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Share2,
  AlertCircle,
  ArrowLeft,
  Settings,
  Upload,
  Move,
  Save,
  X,
  GripVertical,
} from "lucide-react";
import JournalUploader from "./JournalUploader";
import WallCreationForm from "./WallCreationForm";
import PhotoAlbum from "react-photo-album";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";

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
  const [isLoading, setIsLoading] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(-1);
  const [isMobile, setIsMobile] = useState(false);

  // Admin functionality states
  const [showSettings, setShowSettings] = useState(false);
  const [isRearrangeMode, setIsRearrangeMode] = useState(false);
  const [reorderedEntries, setReorderedEntries] =
    useState<JournalEntry[]>(entries);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Handle rearrange mode activation
  const handleRearrangeModeToggle = (enabled: boolean) => {
    setIsRearrangeMode(enabled);
  };

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

  // Transform entries for PhotoAlbum
  const photos = (isRearrangeMode ? reorderedEntries : entries).map(
    (entry) => ({
      src: entry.imageUrl,
      width: 400, // Default width - PhotoAlbum will handle responsive sizing
      height: 600, // Default height for portrait orientation
      alt: `Journal entry from ${new Date(entry.createdAt).toLocaleDateString()}`,
      key: entry.id,
    }),
  );

  // Transform entries for Lightbox
  const lightboxSlides = (isRearrangeMode ? reorderedEntries : entries).map(
    (entry) => ({
      src: entry.imageUrl,
      alt: `Journal entry from ${new Date(entry.createdAt).toLocaleDateString()}`,
    }),
  );

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
    setIsDragging(true);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear drag over if we're actually leaving the element
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;

    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDragOverIndex(null);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
    setIsDragging(false);
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
    setDragOverIndex(null);
    setIsDragging(false);
  };

  const handleSaveRearrange = async () => {
    try {
      await onReorderEntries(reorderedEntries);
      handleRearrangeModeToggle(false);
    } catch (error) {
      console.error("Error saving rearranged entries:", error);
    }
  };

  const handleCancelRearrange = () => {
    setReorderedEntries(entries);
    handleRearrangeModeToggle(false);
  };

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
                      onClick={() => handleRearrangeModeToggle(true)}
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
            <div className="flex justify-between items-center mb-6">
              <p className="text-sm text-muted-foreground">
                {entries.length} entries {isRearrangeMode && "(Rearrange Mode)"}
              </p>
            </div>

            {isRearrangeMode ? (
              // Rearrange mode - use simple grid with drag and drop
              <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {reorderedEntries.map((entry, index) => (
                  <Card
                    key={entry.id}
                    className={`overflow-hidden transition-all duration-200 cursor-move ${
                      draggedIndex === index
                        ? "opacity-50 border-primary border-2"
                        : dragOverIndex === index
                          ? "border-green-500 border-2"
                          : "border-dashed border-gray-300"
                    }`}
                    draggable={true}
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragLeave={(e) => handleDragLeave(e)}
                    onDragEnd={handleDragEnd}
                    onDrop={(e) => handleDrop(e, index)}
                  >
                    <div className="relative aspect-[3/4]">
                      <div className="absolute top-2 right-2 z-10 bg-white/90 rounded-full p-1 shadow-sm">
                        <GripVertical className="h-4 w-4 text-gray-600" />
                      </div>
                      <img
                        src={entry.imageUrl}
                        alt="Journal entry"
                        className="object-cover w-full h-full"
                        loading="lazy"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                        <div className="flex items-center justify-center">
                          <span className="text-white text-xs font-medium">
                            {dragOverIndex === index
                              ? "Drop Here"
                              : `Position ${index + 1}`}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              // Normal mode - use PhotoAlbum masonry layout
              <PhotoAlbum
                photos={photos}
                layout="masonry"
                targetRowHeight={300}
                onClick={({ index }) => setLightboxIndex(index)}
                spacing={8}
                padding={0}
                sizes={{
                  size: "calc(100vw - 2rem)",
                  sizes: [
                    {
                      viewport: "(max-width: 640px)",
                      size: "calc(50vw - 1rem)",
                    },
                    {
                      viewport: "(max-width: 768px)",
                      size: "calc(33vw - 1rem)",
                    },
                    {
                      viewport: "(max-width: 1024px)",
                      size: "calc(25vw - 1rem)",
                    },
                    {
                      viewport: "(max-width: 1280px)",
                      size: "calc(20vw - 1rem)",
                    },
                    { size: "calc(16.66vw - 1rem)" },
                  ],
                }}
              />
            )}
          </>
        )}
      </div>

      {/* Lightbox */}
      <Lightbox
        open={lightboxIndex >= 0}
        index={lightboxIndex}
        close={() => setLightboxIndex(-1)}
        slides={lightboxSlides}
        carousel={{
          finite: true,
        }}
        render={{
          buttonPrev: () => null,
          buttonNext: () => null,
        }}
      />

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
