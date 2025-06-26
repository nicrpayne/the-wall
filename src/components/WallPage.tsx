import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import CommunityWall from "./CommunityWall";
import { useSubmissions } from "../App";

const WallPage = () => {
  const { wallId } = useParams<{ wallId: string }>();
  const { addSubmission, submissions } = useSubmissions();
  const [approvedEntries, setApprovedEntries] = useState<any[]>([]);

  // Transform approved submissions into the format expected by CommunityWall
  useEffect(() => {
    const wallSubmissions = submissions.filter(
      (submission) =>
        submission.wallId === wallId && submission.status === "approved",
    );

    const transformedEntries = wallSubmissions.map((submission) => ({
      id: submission.id,
      imageUrl: submission.imageUrl,
      createdAt: submission.submittedAt,
      approved: true,
    }));

    setApprovedEntries(transformedEntries);
  }, [submissions, wallId]);

  // Listen for storage changes to update entries in real-time
  useEffect(() => {
    const handleStorageChange = () => {
      // Re-fetch submissions from localStorage when changes occur
      try {
        const stored = localStorage.getItem("journal-submissions");
        if (stored) {
          const parsedSubmissions = JSON.parse(stored);
          const wallSubmissions = parsedSubmissions.filter(
            (submission: any) =>
              submission.wallId === wallId && submission.status === "approved",
          );

          const transformedEntries = wallSubmissions.map((submission: any) => ({
            id: submission.id,
            imageUrl: submission.imageUrl,
            createdAt: submission.submittedAt,
            approved: true,
          }));

          setApprovedEntries(transformedEntries);
        }
      } catch (error) {
        console.error("Error parsing submissions from storage:", error);
      }
    };

    const handleCustomEvent = (e: CustomEvent) => {
      if (e.detail?.submissions) {
        const wallSubmissions = e.detail.submissions.filter(
          (submission: any) =>
            submission.wallId === wallId && submission.status === "approved",
        );

        const transformedEntries = wallSubmissions.map((submission: any) => ({
          id: submission.id,
          imageUrl: submission.imageUrl,
          createdAt: submission.submittedAt,
          approved: true,
        }));

        setApprovedEntries(transformedEntries);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener(
      "submissions-updated",
      handleCustomEvent as EventListener,
    );

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener(
        "submissions-updated",
        handleCustomEvent as EventListener,
      );
    };
  }, [wallId]);

  // In a real app, you would fetch wall data based on wallId
  // For now, we'll use mock data and determine wall info from the ID
  const getWallInfo = (id: string) => {
    // Mock wall data - in a real app this would come from your backend
    const mockWalls = {
      "wall-gratitude": {
        title: "Gratitude Journal",
        description: "Share what you're grateful for today",
      },
      "wall-reflections": {
        title: "Daily Reflections",
        description: "End of day thoughts and reflections",
      },
      "wall-creative": {
        title: "Creative Writing",
        description: "Share your poetry, short stories, or creative writing",
      },
    };

    // Check if it's one of our predefined walls or a newly created one
    if (mockWalls[id as keyof typeof mockWalls]) {
      return mockWalls[id as keyof typeof mockWalls];
    }

    // For newly created walls, return a generic response
    return {
      title: "Community Journal Wall",
      description:
        "Share your thoughts and reflections with the community. All entries are anonymous.",
    };
  };

  const wallInfo = getWallInfo(wallId || "");

  const handleSubmitEntry = async (file: File) => {
    // Mock submission - in a real app this would upload to your backend
    console.log("Submitting entry for wall:", wallId, file);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Create a mock image URL from the file
    const imageUrl = URL.createObjectURL(file);

    // Add submission to global state
    addSubmission({
      wallId: wallId || "unknown",
      wallTitle: wallInfo.title,
      imageUrl: imageUrl,
      status: "pending",
    });

    // In a real app, you would send this to your backend for moderation
    alert("Your journal entry has been submitted for review!");
  };

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
