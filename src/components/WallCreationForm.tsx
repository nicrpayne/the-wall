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
  }) => Promise<{ success: boolean; wallId?: string; shareableLink?: string }>;
}

const WallCreationForm = ({
  onSubmit = async () => ({
    success: true,
    wallId: "123",
    shareableLink: "https://example.com/wall/123",
  }),
}: WallCreationFormProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shareableLink, setShareableLink] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await onSubmit({ title, description, isPrivate });
      if (result.success && result.shareableLink) {
        setShareableLink(result.shareableLink);
      } else {
        setError("Failed to create wall. Please try again.");
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
    setTitle("");
    setDescription("");
    setIsPrivate(false);
    setShareableLink(null);
    setError(null);
  };

  return (
    <Card className="w-full max-w-md mx-auto bg-white">
      <CardHeader>
        <CardTitle>Create New Community Wall</CardTitle>
        <CardDescription>
          Create a new wall for users to share their journal entries.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {shareableLink ? (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-medium text-green-600 mb-2">
                Wall Created Successfully!
              </h3>
              <p className="text-sm text-gray-600">
                Share this link with your community:
              </p>
            </div>

            <div className="flex items-center space-x-2 p-2 border rounded-md bg-gray-50">
              <Link className="h-4 w-4 text-gray-500" />
              <div className="text-sm truncate flex-1">{shareableLink}</div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" onClick={copyToClipboard}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Copy to clipboard</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
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
            onClick={resetForm}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Wall"}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default WallCreationForm;
