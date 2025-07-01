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
import { Checkbox } from "@/components/ui/checkbox";
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
  Trash2,
  Check,
  LayoutDashboard,
} from "lucide-react";
import { Link } from "react-router-dom";
import JournalUploader from "./JournalUploader";
import WallCreationForm from "./WallCreationForm";
import { ColumnsPhotoAlbum } from "react-photo-album";
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
    headerImageUrl?: string;
  }) => Promise<void>;
  onReorderEntries?: (reorderedEntries: JournalEntry[]) => Promise<void>;
  onDeleteEntries?: (entryIds: string[]) => Promise<void>;
  wallData?: {
    id: string;
    title: string;
    description: string;
    is_private: boolean;
    header_image_url?: string;
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
  onDeleteEntries = async () => {},
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

  // Delete functionality states
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [selectedEntries, setSelectedEntries] = useState<Set<string>>(
    new Set(),
  );
  const [isDeleting, setIsDeleting] = useState(false);

  // Photo dimensions state for masonry layout
  const [photosWithDimensions, setPhotosWithDimensions] = useState<
    Array<{
      src: string;
      alt: string;
      key: string;
      width: number;
      height: number;
    }>
  >([]);

  // Handle rearrange mode activation
  const handleRearrangeModeToggle = (enabled: boolean) => {
    setIsRearrangeMode(enabled);
  };

  useEffect(() => {
    // Check local storage to see if user has already submitted to this wall
    // Skip this check in admin mode
    if (!isAdminMode) {
      const hasVisited = localStorage.getItem(`wall-visited-${wallId}`);
      setShowUploader(!hasVisited); // Show uploader if user hasn't visited/submitted
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

  // Load image dimensions for masonry layout
  useEffect(() => {
    const loadImageDimensions = async () => {
      console.log(
        "🔍 [CommunityWall] Loading image dimensions for",
        entries.length,
        "entries",
      );

      if (entries.length === 0) {
        console.log("🔍 [CommunityWall] No entries, clearing photos");
        setPhotosWithDimensions([]);
        return;
      }

      console.log(
        "🔍 [CommunityWall] Starting to load dimensions for entries:",
        entries.map((e) => ({
          id: e.id,
          url: e.imageUrl.substring(0, 50) + "...",
        })),
      );

      const photosWithDims = await Promise.all(
        entries.map((entry, index) => {
          return new Promise<{
            src: string;
            alt: string;
            key: string;
            width: number;
            height: number;
          }>((resolve) => {
            const img = new Image();
            img.crossOrigin = "anonymous"; // Add CORS support

            img.onload = () => {
              console.log(
                `✅ [CommunityWall] Image ${index + 1}/${entries.length} loaded:`,
                {
                  id: entry.id,
                  dimensions: `${img.naturalWidth}x${img.naturalHeight}`,
                  url: entry.imageUrl.substring(0, 50) + "...",
                },
              );

              resolve({
                src: entry.imageUrl,
                alt: `Journal entry from ${new Date(entry.createdAt).toLocaleDateString()}`,
                key: entry.id,
                width: img.naturalWidth,
                height: img.naturalHeight,
              });
            };

            img.onerror = (error) => {
              console.warn(
                `❌ [CommunityWall] Image ${index + 1}/${entries.length} failed to load:`,
                {
                  id: entry.id,
                  url: entry.imageUrl.substring(0, 50) + "...",
                  error,
                },
              );

              // Fallback dimensions if image fails to load
              resolve({
                src: entry.imageUrl,
                alt: `Journal entry from ${new Date(entry.createdAt).toLocaleDateString()}`,
                key: entry.id,
                width: 400,
                height: 600,
              });
            };

            // Set a timeout to prevent hanging
            setTimeout(() => {
              if (!img.complete) {
                console.warn(
                  `⏰ [CommunityWall] Image ${index + 1}/${entries.length} timeout:`,
                  {
                    id: entry.id,
                    url: entry.imageUrl.substring(0, 50) + "...",
                  },
                );

                resolve({
                  src: entry.imageUrl,
                  alt: `Journal entry from ${new Date(entry.createdAt).toLocaleDateString()}`,
                  key: entry.id,
                  width: 400,
                  height: 600,
                });
              }
            }, 10000); // 10 second timeout

            img.src = entry.imageUrl;
          });
        }),
      );

      console.log(
        "🎯 [CommunityWall] All images processed, setting photos:",
        photosWithDims.map((p) => ({
          key: p.key,
          dimensions: `${p.width}x${p.height}`,
        })),
      );
      setPhotosWithDimensions(photosWithDims);
    };

    loadImageDimensions();
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

  // Use photos with dimensions for PhotoAlbum masonry layout
  const photos = photosWithDimensions;

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
    headerImageUrl?: string;
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

  // Delete functionality
  const handleDeleteModeToggle = (enabled: boolean) => {
    setIsDeleteMode(enabled);
    if (!enabled) {
      setSelectedEntries(new Set());
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedEntries(new Set(entries.map((entry) => entry.id)));
    } else {
      setSelectedEntries(new Set());
    }
  };

  const handleSelectEntry = (entryId: string, checked: boolean) => {
    const newSelected = new Set(selectedEntries);
    if (checked) {
      newSelected.add(entryId);
    } else {
      newSelected.delete(entryId);
    }
    setSelectedEntries(newSelected);
  };

  const handleDeleteSelected = async () => {
    if (selectedEntries.size === 0) return;

    setIsDeleting(true);
    try {
      // Only delete entries (approved content on walls), never submissions
      await onDeleteEntries(Array.from(selectedEntries));
      setSelectedEntries(new Set());
      setIsDeleteMode(false);
    } catch (error) {
      console.error("Error deleting entries:", error);
    } finally {
      setIsDeleting(false);
    }
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
    <div className="bg-background min-h-screen">
      {/* Header Image */}
      {wallData?.header_image_url && (
        <div className="w-full h-48 md:h-64 lg:h-80 relative overflow-hidden">
          <img
            src={wallData.header_image_url}
            alt={`${title} header`}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 md:bottom-6 md:left-6 md:right-6">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-2 drop-shadow-lg">
              {title}
            </h1>
            <p className="text-white/90 text-sm md:text-base drop-shadow-md max-w-2xl">
              {description}
            </p>
          </div>
        </div>
      )}

      <div className="w-full max-w-none mx-auto p-4 md:p-8">
        {/* Title and Description (only show if no header image) */}
        {!wallData?.header_image_url && (
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2">{title}</h1>
              <p className="text-muted-foreground">{description}</p>
            </div>
          </div>
        )}

        {/* Admin Controls */}
        <div
          className={`flex flex-col md:flex-row md:items-center justify-between ${wallData?.header_image_url ? "mb-6" : !wallData?.header_image_url ? "" : "mb-6"}`}
        >
          {wallData?.header_image_url && <div />}{" "}
          {/* Spacer when header image is present */}
          <div className="flex mt-4 md:mt-0 space-x-2">
            {isAdminMode && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  disabled={isRearrangeMode || isDeleteMode}
                >
                  <Link to="/admin">
                    <LayoutDashboard className="h-4 w-4 mr-2" />
                    Dashboard
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowUploader(true)}
                  disabled={isRearrangeMode}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Add Entry
                </Button>
                {!isRearrangeMode && !isDeleteMode ? (
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
                      onClick={() => handleDeleteModeToggle(true)}
                      disabled={entries.length === 0}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
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
                ) : isRearrangeMode ? (
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
                ) : (
                  <>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleDeleteSelected}
                      disabled={selectedEntries.size === 0 || isDeleting}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {isDeleting
                        ? "Deleting..."
                        : `Delete Selected (${selectedEntries.size})`}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteModeToggle(false)}
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
              disabled={isRearrangeMode || isDeleteMode}
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

        {isDeleteMode && (
          <Alert className="mb-6">
            <Trash2 className="h-4 w-4" />
            <AlertDescription>
              Select entries to delete. Use "Select All" to select all entries
              at once.
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
              <div className="flex items-center gap-4">
                <p className="text-sm text-muted-foreground">
                  {entries.length} entries{" "}
                  {isRearrangeMode && "(Rearrange Mode)"}{" "}
                  {isDeleteMode && "(Delete Mode)"}
                  {console.log(
                    "🔵 [CommunityWall] Rendering entry count:",
                    entries.length,
                    "entries:",
                    entries.map((e) => ({
                      id: e.id,
                      imageUrl: e.imageUrl.substring(0, 30) + "...",
                    })),
                  )}
                </p>
                {isDeleteMode && entries.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="select-all"
                      checked={
                        selectedEntries.size === entries.length &&
                        entries.length > 0
                      }
                      onCheckedChange={handleSelectAll}
                    />
                    <label
                      htmlFor="select-all"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Select All
                    </label>
                  </div>
                )}
              </div>
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
            ) : isDeleteMode ? (
              // Delete mode - use simple grid with checkboxes
              <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {entries.map((entry, index) => (
                  <Card
                    key={entry.id}
                    className={`overflow-hidden transition-all duration-200 ${
                      selectedEntries.has(entry.id)
                        ? "ring-2 ring-destructive"
                        : "hover:ring-2 hover:ring-muted"
                    }`}
                  >
                    <div className="relative aspect-[3/4]">
                      <div className="absolute top-2 left-2 z-10">
                        <Checkbox
                          checked={selectedEntries.has(entry.id)}
                          onCheckedChange={(checked) =>
                            handleSelectEntry(entry.id, checked as boolean)
                          }
                          className="bg-white/90 border-2"
                        />
                      </div>
                      <img
                        src={entry.imageUrl}
                        alt="Journal entry"
                        className="object-cover w-full h-full cursor-pointer"
                        loading="lazy"
                        onClick={() =>
                          handleSelectEntry(
                            entry.id,
                            !selectedEntries.has(entry.id),
                          )
                        }
                      />
                      {selectedEntries.has(entry.id) && (
                        <div className="absolute inset-0 bg-destructive/20 flex items-center justify-center">
                          <div className="bg-destructive text-destructive-foreground rounded-full p-2">
                            <Check className="h-4 w-4" />
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              // Normal mode - use PhotoAlbum masonry layout
              <div className="w-full">
                {console.log("🖼️ [CommunityWall] Rendering PhotoAlbum:", {
                  entriesLength: entries.length,
                  photosWithDimensionsLength: photosWithDimensions.length,
                  photos: photosWithDimensions.map((p) => ({
                    key: p.key,
                    dimensions: `${p.width}x${p.height}`,
                    src: p.src.substring(0, 30) + "...",
                  })),
                })}
                {photosWithDimensions.length > 0 &&
                photosWithDimensions.length === entries.length ? (
                  <div
                    className="photo-album-container"
                    style={{
                      width: "100%",
                      maxWidth: "none",
                      display: "block",
                      overflow: "visible",
                    }}
                  >
                    <ColumnsPhotoAlbum
                      photos={photos}
                      onClick={({ index }) =>
                        !isDeleteMode && setLightboxIndex(index)
                      }
                      spacing={32}
                      padding={0}
                      columns={(containerWidth) => {
                        console.log(
                          "📐 [CommunityWall] ColumnsPhotoAlbum columns calculation:",
                          {
                            containerWidth,
                            windowWidth:
                              typeof window !== "undefined"
                                ? window.innerWidth
                                : "unknown",
                            columns:
                              containerWidth < 640
                                ? 2
                                : containerWidth < 1024
                                  ? 3
                                  : 4,
                          },
                        );
                        // Force recalculation based on actual viewport
                        const actualWidth =
                          typeof window !== "undefined"
                            ? window.innerWidth
                            : containerWidth;
                        if (actualWidth < 640) return 2;
                        if (actualWidth < 1024) return 3;
                        return 4;
                      }}
                      renderPhoto={({ photo, imageProps, wrapperStyle }) => {
                        console.log("🎨 [CommunityWall] Rendering photo:", {
                          key: photo.key,
                          dimensions: `${photo.width}x${photo.height}`,
                          imageProps: {
                            width: imageProps.width,
                            height: imageProps.height,
                          },
                          wrapperStyle,
                        });
                        return (
                          <div
                            style={{
                              ...wrapperStyle,
                              display: "block",
                              position: "relative",
                              marginBottom: "16px",
                              breakInside: "avoid",
                              pageBreakInside: "avoid",
                            }}
                            className="photo-wrapper"
                          >
                            <img
                              {...imageProps}
                              src={photo.src}
                              alt={photo.alt}
                              style={{
                                width: "100%",
                                height: "auto",
                                objectFit: "cover",
                                display: "block",
                                borderRadius: "8px",
                              }}
                              className="shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                              loading="lazy"
                            />
                          </div>
                        );
                      }}
                    />
                  </div>
                ) : entries.length > 0 ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                      <p className="text-sm text-muted-foreground">
                        Loading images... ({photosWithDimensions.length}/
                        {entries.length})
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        This may take a moment for existing images
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">
                        No images to display
                      </p>
                    </div>
                  </div>
                )}
              </div>
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
        zoom={{
          maxZoomPixelRatio: 3,
          zoomInMultiplier: 2,
          doubleTapDelay: 300,
          doubleClickDelay: 300,
          doubleClickMaxStops: 2,
          keyboardMoveDistance: 50,
          wheelZoomDistanceFactor: 100,
          pinchZoomDistanceFactor: 100,
          scrollToZoom: true,
        }}
        controller={{
          closeOnPullDown: true,
          closeOnBackdropClick: true,
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
                    headerImageUrl: wallData.header_image_url,
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
