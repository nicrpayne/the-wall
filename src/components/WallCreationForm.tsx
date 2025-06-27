import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { AlertCircle, Copy, Link } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface WallCreationFormProps {
  onSubmit?: (wallData: {
    title: string;
    description: string;
    isPrivate: boolean;
  }) => Promise<{
    success: boolean;
    wallId?: string;
    shareableLink?: string;
    wallCode?: string;
  }>;
  initialData?: {
    title: string;
    description: string;
    isPrivate: boolean;
  };
  isEditMode?: boolean;
  onCancel?: () => void;
}

const WallCreationForm = ({
  onSubmit = async () => ({
    success: true,
    wallId: "123",
    shareableLink: "https://example.com/wall/123",
    wallCode: "ABC123",
  }),
  initialData,
  isEditMode = false,
  onCancel,
}: WallCreationFormProps) => {
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(
    initialData?.description || "",
  );
  const [isPrivate, setIsPrivate] = useState(initialData?.isPrivate || false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shareableLink, setShareableLink] = useState<string | null>(null);
  const [wallCode, setWallCode] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await onSubmit({ title, description, isPrivate });
      if (result.success) {
        if (isEditMode) {
          // For edit mode, just close the dialog
          resetForm();
        } else if (result.shareableLink && result.wallCode) {
          setShareableLink(result.shareableLink);
          setWallCode(result.wallCode);
        } else {
          setError("Failed to create wall. Please try again.");
        }
      } else {
        setError(
          isEditMode
            ? "Failed to update wall. Please try again."
            : "Failed to create wall. Please try again.",
        );
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = () => {
    if (shareableLink) {
      navigator.clipboard.writeText(shareableLink);
    }
  };

  const resetForm = () => {
    if (isEditMode) {
      setTitle(initialData?.title || "");
      setDescription(initialData?.description || "");
      setIsPrivate(initialData?.isPrivate || false);
    } else {
      setTitle("");
      setDescription("");
      setIsPrivate(false);
    }
    setShareableLink(null);
    setWallCode(null);
    setError(null);
  };

  const handleCancel = () => {
    resetForm();
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto bg-white">
      <CardHeader>
        <CardTitle>
          {isEditMode ? "Edit Wall Settings" : "Create New Community Wall"}
        </CardTitle>
        <CardDescription>
          {isEditMode
            ? "Update the settings for this community wall."
            : "Create a new wall for users to share their journal entries."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {shareableLink && wallCode ? (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-medium text-green-600 mb-2">
                Wall Created Successfully!
              </h3>
              <p className="text-sm text-gray-600">
                Share with your community using either method:
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <Label className="text-sm font-medium text-gray-700">
                  Wall Code
                </Label>
                <div className="flex items-center space-x-2 p-3 border rounded-md bg-blue-50">
                  <div className="text-lg font-mono font-bold text-blue-700 flex-1">
                    {wallCode}
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            navigator.clipboard.writeText(wallCode)
                          }
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Copy code</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Users can enter this code on the home page
                </p>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">
                  Shareable Link
                </Label>
                <div className="flex items-center space-x-2 p-2 border rounded-md bg-gray-50">
                  <Link className="h-4 w-4 text-gray-500" />
                  <div className="text-sm truncate flex-1">{shareableLink}</div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={copyToClipboard}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Copy link</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </div>

            <Button className="w-full" onClick={resetForm}>
              Create Another Wall
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Wall Title</Label>
              <Input
                id="title"
                placeholder="Enter a title for your wall"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe what this wall is about"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="private"
                checked={isPrivate}
                onCheckedChange={setIsPrivate}
              />
              <Label htmlFor="private">Make this wall private</Label>
            </div>
          </form>
        )}
      </CardContent>

      {!shareableLink && (
        <CardFooter className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            className="mr-2"
            onClick={handleCancel}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting
              ? isEditMode
                ? "Updating..."
                : "Creating..."
              : isEditMode
                ? "Update Wall"
                : "Create Wall"}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default WallCreationForm;
