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
      if (!wallId) return;

      try {
        setLoading(true);
        const [wallsData, submissionsData] = await Promise.all([
          wallsApi.getAll(),
          submissionsApi.getAll(),
        ]);

        // Find the wall by ID
        const currentWall = wallsData.find((w) => w.id === wallId);
        setWall(currentWall || null);

        // Filter and transform approved submissions for this wall
        const wallSubmissions = submissionsData.filter(
          (submission) =>
            submission.wall_id === wallId && submission.status === "approved",
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
    if (!wallId) {
      alert("Error: Wall ID not found");
      return;
    }

    try {
      // Upload image to Supabase storage
      const imageUrl = await submissionsApi.uploadImage(file);

      // Create submission record
      await submissionsApi.create({
        wall_id: wallId,
        image_url: imageUrl,
        status: "pending",
      });

      alert("Your journal entry has been submitted for review!");
    } catch (error) {
      console.error("Error submitting entry:", error);
      alert("Failed to submit your entry. Please try again.");
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
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Wall Not Found</h1>
          <p className="text-muted-foreground">
            The requested wall could not be found.
          </p>
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
