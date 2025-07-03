import React, { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import CommunityWall from "./CommunityWall";
import {
  wallsApi,
  submissionsApi,
  entriesApi,
  Wall,
  Submission,
  Entry,
  subscribeToSubmissions,
  subscribeToEntries,
} from "../lib/supabase";
import { useToast } from "@/components/ui/use-toast";

const WallPage = () => {
  const { wallId } = useParams<{ wallId: string }>();
  const [searchParams] = useSearchParams();
  const isAdminMode = searchParams.get("admin") === "true";
  const [wall, setWall] = useState<Wall | null>(null);
  const [approvedEntries, setApprovedEntries] = useState<any[]>([]);
  const [directEntries, setDirectEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Load wall data and approved submissions
  useEffect(() => {
    const loadWallData = async () => {
      if (!wallId) {
        console.log("🔴 [WallPage] No wallId provided in URL params");
        return;
      }

      try {
        setLoading(true);
        console.log("🔵 [WallPage] Starting to load wall data for:", wallId);
        console.log("🔵 [WallPage] Current URL:", window.location.href);

        // Use the new method to find wall by ID or code
        const currentWall = await wallsApi.getByIdOrCode(wallId);
        setWall(currentWall);

        console.log("🔵 [WallPage] Looking for wall with ID/code:", wallId);
        console.log("🔵 [WallPage] Found wall:", currentWall);

        if (!currentWall) {
          console.log(
            "🔴 [WallPage] Wall not found - this will show the 'Wall Not Found' message",
          );
          return;
        }

        // Get submissions for this wall
        const submissionsData = await submissionsApi.getAll();

        // Filter and transform approved submissions for this wall
        // Use the actual wall ID from the found wall, not the URL parameter
        const actualWallId = currentWall?.id || wallId;
        const wallSubmissions = submissionsData.filter(
          (submission) =>
            submission.wall_id === actualWallId &&
            submission.status === "approved",
        );

        const transformedSubmissions = wallSubmissions.map((submission) => ({
          id: submission.id,
          imageUrl: submission.image_url,
          createdAt: submission.submitted_at,
          approved: true,
        }));

        // Get direct entries for this wall
        const wallEntries = await entriesApi.getByWallId(actualWallId);
        const transformedDirectEntries = wallEntries.map((entry) => ({
          id: entry.id,
          imageUrl: entry.image_url,
          createdAt: entry.created_at,
          approved: true,
        }));

        // Combine both types of entries with special sorting for newly approved submissions
        // Add a flag to distinguish between approved submissions and direct entries
        const submissionsWithFlag = transformedSubmissions.map(
          (submission) => ({
            ...submission,
            isApprovedSubmission: true,
          }),
        );
        const directEntriesWithFlag = transformedDirectEntries.map((entry) => ({
          ...entry,
          isApprovedSubmission: false,
        }));

        const allEntries = [
          ...submissionsWithFlag,
          ...directEntriesWithFlag,
        ].sort((a, b) => {
          // First, prioritize approved submissions over direct entries
          if (a.isApprovedSubmission && !b.isApprovedSubmission) return -1;
          if (!a.isApprovedSubmission && b.isApprovedSubmission) return 1;

          // Within the same type, sort by creation date (newest first)
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        });

        setApprovedEntries(allEntries);
        setDirectEntries(wallEntries);
      } catch (error) {
        console.error("Error loading wall data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadWallData();
  }, [wallId]);

  // Set up real-time subscriptions for this wall
  useEffect(() => {
    if (!wall?.id) return;

    console.log(
      "🔔 [WallPage] Setting up real-time subscriptions for wall:",
      wall.id,
    );

    // Function to reload all wall data
    const reloadWallData = async () => {
      try {
        console.log(
          "🔔 [WallPage] Reloading wall data due to real-time update",
        );

        // Get fresh submissions data
        const submissionsData = await submissionsApi.getAll();
        const wallSubmissions = submissionsData.filter(
          (submission) =>
            submission.wall_id === wall.id && submission.status === "approved",
        );
        const transformedSubmissions = wallSubmissions.map((submission) => ({
          id: submission.id,
          imageUrl: submission.image_url,
          createdAt: submission.submitted_at,
          approved: true,
        }));

        // Get fresh direct entries data
        const wallEntries = await entriesApi.getByWallId(wall.id);
        const transformedDirectEntries = wallEntries.map((entry) => ({
          id: entry.id,
          imageUrl: entry.image_url,
          createdAt: entry.created_at,
          approved: true,
        }));

        // Combine and sort all entries with priority for approved submissions
        // Add a flag to distinguish between approved submissions and direct entries
        const submissionsWithFlag = transformedSubmissions.map(
          (submission) => ({
            ...submission,
            isApprovedSubmission: true,
          }),
        );
        const directEntriesWithFlag = transformedDirectEntries.map((entry) => ({
          ...entry,
          isApprovedSubmission: false,
        }));

        const allEntries = [
          ...submissionsWithFlag,
          ...directEntriesWithFlag,
        ].sort((a, b) => {
          // First, prioritize approved submissions over direct entries
          if (a.isApprovedSubmission && !b.isApprovedSubmission) return -1;
          if (!a.isApprovedSubmission && b.isApprovedSubmission) return 1;

          // Within the same type, sort by creation date (newest first)
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        });

        // Update state
        setDirectEntries(wallEntries);
        setApprovedEntries(allEntries);

        console.log("🔔 [WallPage] Wall data reloaded:", {
          submissions: transformedSubmissions.length,
          directEntries: transformedDirectEntries.length,
          total: allEntries.length,
        });
      } catch (error) {
        console.error("🔴 [WallPage] Error reloading wall data:", error);
      }
    };

    // Subscribe to submission changes (for approved submissions)
    const submissionsSubscription = subscribeToSubmissions(() => {
      console.log("🔔 [WallPage] Submissions changed, reloading wall data");
      reloadWallData();
    });

    // Subscribe to direct entries changes
    const entriesSubscription = subscribeToEntries(wall.id, () => {
      console.log("🔔 [WallPage] Entries changed, reloading wall data");
      reloadWallData();
    });

    return () => {
      console.log("🔔 [WallPage] Cleaning up real-time subscriptions");
      submissionsSubscription.unsubscribe();
      entriesSubscription.unsubscribe();
    };
  }, [wall?.id]);

  // Get wall info from loaded data or provide defaults
  const wallInfo = wall
    ? {
        title: wall.title,
        description: wall.description,
      }
    : {
        title: "Community Journal Wall",
        description:
          "Share your thoughts and reflections with the community. All entries are anonymous.",
      };

  const handleSubmitEntry = async (files: File | File[]) => {
    if (!wall) {
      alert("Error: Wall not found");
      return;
    }

    const fileArray = Array.isArray(files) ? files : [files];

    try {
      console.log("🔵 [WallPage] Starting file upload...", {
        fileCount: fileArray.length,
        wallId: wall.id,
        isAdminMode,
        files: fileArray.map((f) => ({
          name: f.name,
          size: f.size,
          type: f.type,
        })),
      });

      if (isAdminMode) {
        // Admin mode: Create direct entries
        const uploadPromises = fileArray.map(async (file) => {
          const imageUrl = await submissionsApi.uploadImage(file);
          return {
            wall_id: wall.id,
            image_url: imageUrl,
          };
        });

        const entryData = await Promise.all(uploadPromises);
        const newEntries = await entriesApi.createMultiple(entryData);

        console.log("Direct entries created successfully:", newEntries);
        console.log("Number of entries created:", newEntries.length);
        console.log("Number of files processed:", fileArray.length);

        // Update the entries list immediately
        const transformedNewEntries = newEntries.map((entry) => ({
          id: entry.id,
          imageUrl: entry.image_url,
          createdAt: entry.created_at,
          approved: true,
          isApprovedSubmission: false, // These are direct entries, not approved submissions
        }));

        setApprovedEntries((prev) => {
          const combined = [...transformedNewEntries, ...prev];
          return combined.sort((a, b) => {
            // First, prioritize approved submissions over direct entries
            if (a.isApprovedSubmission && !b.isApprovedSubmission) return -1;
            if (!a.isApprovedSubmission && b.isApprovedSubmission) return 1;

            // Within the same type, sort by creation date (newest first)
            return (
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
          });
        });

        const actualCount = newEntries.length;
        alert(
          `Successfully added ${actualCount} ${actualCount === 1 ? "entry" : "entries"} to the wall!`,
        );
      } else {
        // Regular user mode: Create submissions for review
        const uploadPromises = fileArray.map(async (file, index) => {
          console.log(
            `🔵 [WallPage] Processing file ${index + 1}/${fileArray.length}:`,
            {
              name: file.name,
              size: file.size,
              type: file.type,
            },
          );

          const imageUrl = await submissionsApi.uploadImage(file);
          console.log(
            `🔵 [WallPage] Image uploaded successfully for file ${index + 1}:`,
            imageUrl,
          );

          const submission = await submissionsApi.create({
            wall_id: wall.id,
            image_url: imageUrl,
            status: "pending",
          });
          console.log(
            `🔵 [WallPage] Submission created for file ${index + 1}:`,
            submission,
          );

          return submission;
        });

        const submissions = await Promise.all(uploadPromises);
        console.log(
          "🔵 [WallPage] All submissions created successfully:",
          submissions,
        );
        alert(
          `Your ${fileArray.length === 1 ? "journal entry has" : `${fileArray.length} journal entries have`} been submitted for review!`,
        );
      }
    } catch (error) {
      console.error("🔴 [WallPage] Error submitting entry:", error);
      console.error("🔴 [WallPage] Error details:", {
        message: error?.message,
        name: error?.name,
        stack: error?.stack,
        cause: error?.cause,
      });

      // Provide more detailed error messages
      let errorMessage = "Failed to submit your entry. ";
      if (error instanceof Error) {
        if (
          error.message.includes("Upload failed") ||
          error.message.includes("storage")
        ) {
          errorMessage += `Upload error: ${error.message}. `;
        } else if (error.message.includes("File size too large")) {
          errorMessage +=
            "Error: File too large. Please choose smaller images (under 10MB each). ";
        } else if (
          error.message.includes("File type not supported") ||
          error.message.includes("Invalid file type")
        ) {
          errorMessage +=
            "Error: Invalid file format. Please use JPEG, PNG, WebP, or GIF images only. ";
        } else if (
          error.message.includes("Authentication failed") ||
          error.message.includes("Permission denied")
        ) {
          errorMessage +=
            "Error: Authentication issue. Please refresh the page and try again. ";
        } else if (
          error.message.includes("network") ||
          error.message.includes("Network")
        ) {
          errorMessage +=
            "Error: Network connection issue. Please check your internet connection. ";
        } else if (
          error.message.includes("database") ||
          error.message.includes("insert") ||
          error.message.includes("submission")
        ) {
          errorMessage +=
            "Error: Database issue. There was a problem saving your submission. ";
        } else {
          errorMessage += `Error: ${error.message}. `;
        }
      } else {
        errorMessage += "Error: Unknown error occurred. ";
      }
      errorMessage +=
        "Please try again or contact support if the problem persists.";

      alert(errorMessage);
    }
  };

  const handleUpdateWall = async (wallData: {
    title: string;
    description: string;
    isPrivate: boolean;
    headerImageUrl?: string;
  }) => {
    if (!wall) return;

    try {
      const updatedWall = await wallsApi.update(wall.id, {
        title: wallData.title,
        description: wallData.description,
        is_private: wallData.isPrivate,
        header_image_url: wallData.headerImageUrl || null,
      });

      setWall(updatedWall);
      toast({
        title: "Success",
        description: "Wall settings updated successfully.",
      });
    } catch (error) {
      console.error("Error updating wall:", error);
      toast({
        title: "Error",
        description: "Failed to update wall settings.",
        variant: "destructive",
      });
    }
  };

  const handleReorderEntries = async (reorderedEntries: any[]) => {
    // For now, we'll just update the local state
    // In a real implementation, you might want to store the order in the database
    setApprovedEntries(reorderedEntries);
    toast({
      title: "Success",
      description: "Entry order updated successfully.",
    });
  };

  const handleDeleteEntries = async (entryIds: string[]) => {
    if (!wall) {
      console.error("🔴 [WallPage] No wall found, cannot delete entries");
      return;
    }

    if (entryIds.length === 0) {
      console.warn("🟡 [WallPage] No entry IDs provided for deletion");
      return;
    }

    try {
      console.log(
        "🔵 [WallPage] Starting deletion process for entries:",
        entryIds,
      );

      // Separate entries by type: direct entries vs approved submissions
      const entriesToDelete: string[] = [];
      const submissionsToReject: string[] = [];

      // Check which entries are direct entries vs approved submissions
      entryIds.forEach((entryId) => {
        const isDirectEntry = directEntries.some(
          (entry) => entry.id === entryId,
        );
        if (isDirectEntry) {
          entriesToDelete.push(entryId);
        } else {
          // This is an approved submission, we should reject it instead of deleting
          submissionsToReject.push(entryId);
        }
      });

      console.log("🔵 [WallPage] Categorized entries for deletion:", {
        directEntries: entriesToDelete,
        approvedSubmissions: submissionsToReject,
      });

      const deletePromises: Promise<{
        entryId: string;
        success: boolean;
        error?: string;
      }>[] = [];

      // Delete direct entries from entries table
      entriesToDelete.forEach((entryId) => {
        deletePromises.push(
          entriesApi
            .delete(entryId)
            .then(() => ({ entryId, success: true }))
            .catch((error) => {
              console.error(
                `🔴 [WallPage] Failed to delete entry ${entryId}:`,
                error,
              );
              return {
                entryId,
                success: false,
                error: error instanceof Error ? error.message : String(error),
              };
            }),
        );
      });

      // Reject approved submissions (change status back to rejected)
      submissionsToReject.forEach((submissionId) => {
        deletePromises.push(
          submissionsApi
            .updateStatus(submissionId, "rejected")
            .then(() => ({ entryId: submissionId, success: true }))
            .catch((error) => {
              console.error(
                `🔴 [WallPage] Failed to reject submission ${submissionId}:`,
                error,
              );
              return {
                entryId: submissionId,
                success: false,
                error: error instanceof Error ? error.message : String(error),
              };
            }),
        );
      });

      const deleteResults = await Promise.all(deletePromises);
      const successfulDeletions = deleteResults.filter((r) => r.success);
      const failedDeletions = deleteResults.filter((r) => !r.success);
      const successfulIds = successfulDeletions.map((r) => r.entryId);

      console.log("🔵 [WallPage] Delete results:", {
        total: deleteResults.length,
        successful: successfulDeletions.length,
        failed: failedDeletions.length,
        successfulIds,
      });

      // Update local state immediately to provide instant feedback
      if (successfulIds.length > 0) {
        setApprovedEntries((prev) =>
          prev.filter((entry) => !successfulIds.includes(entry.id)),
        );
        setDirectEntries((prev) =>
          prev.filter((entry) => !successfulIds.includes(entry.id)),
        );
      }

      // Show appropriate toast messages
      if (failedDeletions.length > 0 && successfulDeletions.length > 0) {
        toast({
          title: "Partial Deletion Error",
          description: `${successfulDeletions.length} entries deleted successfully, but ${failedDeletions.length} failed. Check console for details.`,
          variant: "destructive",
        });
      } else if (failedDeletions.length > 0) {
        toast({
          title: "Deletion Failed",
          description: "Failed to delete entries. Please try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: `Successfully deleted ${successfulDeletions.length} ${successfulDeletions.length === 1 ? "entry" : "entries"}.`,
        });
      }
    } catch (error) {
      console.error("🔴 [WallPage] Error in handleDeleteEntries:", error);
      toast({
        title: "Error",
        description: "Failed to delete entries. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading wall...</p>
        </div>
      </div>
    );
  }

  if (!wall && !loading) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <h1 className="text-2xl font-bold mb-2">Wall Not Found</h1>
          <p className="text-muted-foreground mb-4">
            The requested wall could not be found.
          </p>
          <div className="text-sm text-muted-foreground bg-muted p-4 rounded-lg">
            <p className="font-medium mb-2">Debug Info:</p>
            <p>
              Searched for:{" "}
              <code className="bg-background px-2 py-1 rounded">{wallId}</code>
            </p>
            <p className="mt-2">This could mean:</p>
            <ul className="list-disc list-inside mt-1 text-left">
              <li>No walls have been created yet</li>
              <li>The wall ID/code is incorrect</li>
              <li>Database connection issues</li>
            </ul>
            <p className="mt-2 text-xs">
              Check the browser console for more details.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Check if user has already submitted to this wall (only for regular users)
  const hasVisited =
    !isAdminMode && localStorage.getItem(`wall-visited-${wallId}`);
  const shouldShowUploader = isAdminMode ? false : !hasVisited;

  return (
    <div className="bg-background min-h-screen">
      <CommunityWall
        wallId={wallId}
        title={wallInfo.title}
        description={wallInfo.description}
        entries={approvedEntries}
        isFirstVisit={!isAdminMode}
        onSubmitEntry={handleSubmitEntry}
        isAdminMode={isAdminMode}
        onUpdateWall={handleUpdateWall}
        onReorderEntries={handleReorderEntries}
        onDeleteEntries={handleDeleteEntries}
        wallData={
          wall
            ? {
                id: wall.id,
                title: wall.title,
                description: wall.description,
                is_private: wall.is_private,
                header_image_url: wall.header_image_url,
              }
            : undefined
        }
      />
    </div>
  );
};

export default WallPage;
