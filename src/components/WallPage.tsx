import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import CommunityWall from "./CommunityWall";
import { wallsApi, submissionsApi, Wall, Submission } from "../lib/supabase";

const WallPage = () => {
  const { wallId } = useParams<{ wallId: string }>();
  const [wall, setWall] = useState<Wall | null>(null);
  const [approvedEntries, setApprovedEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

        const transformedEntries = wallSubmissions.map((submission) => ({
          id: submission.id,
          imageUrl: submission.image_url,
          createdAt: submission.submitted_at,
          approved: true,
        }));

        setApprovedEntries(transformedEntries);
      } catch (error) {
        console.error("Error loading wall data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadWallData();
  }, [wallId]);

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

  const handleSubmitEntry = async (file: File) => {
    if (!wall) {
      alert("Error: Wall not found");
      return;
    }

    try {
      console.log("Starting file upload...", {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
      });

      // Upload image to Supabase storage
      const imageUrl = await submissionsApi.uploadImage(file);
      console.log("Image uploaded successfully:", imageUrl);

      // Create submission record using the actual wall ID
      await submissionsApi.create({
        wall_id: wall.id,
        image_url: imageUrl,
        status: "pending",
      });

      console.log("Submission created successfully");
      alert("Your journal entry has been submitted for review!");
    } catch (error) {
      console.error("Error submitting entry:", error);

      // Provide more detailed error messages
      let errorMessage = "Failed to submit your entry. ";
      if (error instanceof Error) {
        if (error.message.includes("storage")) {
          errorMessage += "There was an issue uploading your image. ";
        } else if (
          error.message.includes("database") ||
          error.message.includes("insert")
        ) {
          errorMessage += "There was an issue saving your submission. ";
        } else {
          errorMessage += `Error: ${error.message}. `;
        }
      }
      errorMessage +=
        "Please try again or contact support if the problem persists.";

      alert(errorMessage);
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

  return (
    <div className="bg-background min-h-screen">
      <CommunityWall
        wallId={wallId}
        title={wallInfo.title}
        description={wallInfo.description}
        entries={approvedEntries}
        isFirstVisit={true}
        onSubmitEntry={handleSubmitEntry}
      />
    </div>
  );
};

export default WallPage;
