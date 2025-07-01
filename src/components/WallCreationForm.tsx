import React, { useState, useRef } from "react";
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
import { AlertCircle, Copy, Link, Upload, X, Image } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { submissionsApi } from "../lib/supabase";
import { useToast } from "@/components/ui/use-toast";

interface WallCreationFormProps {
  onSubmit?: (wallData: {
    title: string;
    description: string;
    isPrivate: boolean;
    headerImageUrl?: string;
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
    headerImageUrl?: string;
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
  const [headerImageUrl, setHeaderImageUrl] = useState(
    initialData?.headerImageUrl || "",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shareableLink, setShareableLink] = useState<string | null>(null);
  const [wallCode, setWallCode] = useState<string | null>(null);
  const [isUploadingHeader, setIsUploadingHeader] = useState(false);
  const headerFileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await onSubmit({
        title,
        description,
        isPrivate,
        headerImageUrl,
      });
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
      toast({
        title: "Success",
        description: "Shareable link copied to clipboard!",
      });
    }
  };

  const resetForm = () => {
    if (isEditMode) {
      setTitle(initialData?.title || "");
      setDescription(initialData?.description || "");
      setIsPrivate(initialData?.isPrivate || false);
      setHeaderImageUrl(initialData?.headerImageUrl || "");
    } else {
      setTitle("");
      setDescription("");
      setIsPrivate(false);
      setHeaderImageUrl("");
    }
    setShareableLink(null);
    setWallCode(null);
    setError(null);
  };

  const handleHeaderImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingHeader(true);
    setError(null);

    try {
      const imageUrl = await submissionsApi.uploadHeaderImage(file);
      setHeaderImageUrl(imageUrl);
    } catch (error) {
      console.error("Error uploading header image:", error);
      setError("Failed to upload header image. Please try again.");
    } finally {
      setIsUploadingHeader(false);
    }
  };

  const removeHeaderImage = () => {
    setHeaderImageUrl("");
    if (headerFileInputRef.current) {
      headerFileInputRef.current.value = "";
    }
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
                          onClick={() => {
                            navigator.clipboard.writeText(wallCode);
                            toast({
                              title: "Success",
                              description: "Wall code copied to clipboard!",
                            });
                          }}
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

            <div className="space-y-2">
              <Label htmlFor="header-image">Header Image (Optional)</Label>
              <div className="space-y-3">
                {headerImageUrl ? (
                  <div className="relative">
                    <div className="w-full h-32 rounded-lg overflow-hidden bg-gray-100 border-2 border-dashed border-gray-300">
                      <img
                        src={headerImageUrl}
                        alt="Header preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={removeHeaderImage}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="w-full h-32 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="text-center">
                      <Image className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500 mb-2">
                        Add a header image to brand your wall
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => headerFileInputRef.current?.click()}
                        disabled={isUploadingHeader}
                      >
                        {isUploadingHeader ? (
                          "Uploading..."
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            Choose Image
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
                <input
                  ref={headerFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleHeaderImageUpload}
                  className="hidden"
                />
                <p className="text-xs text-gray-500">
                  Recommended: 1200x300px or similar banner dimensions. Max
                  10MB.
                </p>
              </div>
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
