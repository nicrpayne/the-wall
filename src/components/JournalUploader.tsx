import React, { useState, useRef } from "react";
import { Upload, X, Check, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";

interface JournalUploaderProps {
  onSubmit: (files: File | File[]) => Promise<void>;
  isSubmitting?: boolean;
  wallTitle?: string;
}

const JournalUploader = ({
  onSubmit,
  isSubmitting = false,
  wallTitle = "Community Wall",
}: JournalUploaderProps) => {
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = (files: File[]) => {
    console.log("🔵 [JournalUploader] Processing files:", files.length);

    if (files.length > 0) {
      // Validate file types and sizes
      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
        "image/gif",
      ];

      const validFiles: File[] = [];
      const invalidFiles: string[] = [];

      files.forEach((file) => {
        if (!allowedTypes.includes(file.type)) {
          invalidFiles.push(`${file.name} (invalid type)`);
        } else if (file.size > 10 * 1024 * 1024) {
          invalidFiles.push(`${file.name} (too large)`);
        } else {
          validFiles.push(file);
        }
      });

      if (invalidFiles.length > 0) {
        alert(
          `Some files were skipped:\n${invalidFiles.join("\n")}\n\nPlease select valid image files (JPEG, PNG, WebP, or GIF) smaller than 10MB.`,
        );
      }

      if (validFiles.length === 0) {
        return;
      }

      setSelectedFiles(validFiles);
      setIsProcessingFile(true);

      // Process all files
      const imagePromises = validFiles.map((file) => {
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      });

      Promise.all(imagePromises)
        .then((images) => {
          console.log("🔵 [JournalUploader] All files processed successfully");
          setCapturedImages(images);
          setShowPreview(true);
          setIsProcessingFile(false);
        })
        .catch((error) => {
          console.error("🔴 [JournalUploader] Error reading files:", error);
          setIsProcessingFile(false);
          alert("Error reading some files. Please try again.");
        });
    } else {
      console.log("🔴 [JournalUploader] No files provided");
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log("🔵 [JournalUploader] File input changed");
    const files = Array.from(event.target.files || []);
    processFiles(files);
  };

  const handleSubmit = async () => {
    console.log("🔵 [JournalUploader] Submit button clicked");
    if (selectedFiles.length > 0) {
      console.log(
        "🔵 [JournalUploader] Submitting files:",
        selectedFiles.length,
      );
      try {
        setUploadProgress(0);

        // Pass all files at once to the parent component
        console.log(
          `🔵 [JournalUploader] Uploading ${selectedFiles.length} files`,
        );
        await onSubmit(
          selectedFiles.length === 1 ? selectedFiles[0] : selectedFiles,
        );
        setUploadProgress(100);

        console.log("🔵 [JournalUploader] All files submitted successfully");
        setCapturedImages([]);
        setSelectedFiles([]);
        setShowPreview(false);
        setUploadProgress(0);
      } catch (error) {
        console.error("🔴 [JournalUploader] Error submitting files:", error);
        alert("Error uploading your journal entries. Please try again.");
        setUploadProgress(0);
      }
    } else {
      console.error("🔴 [JournalUploader] No files selected for submission");
    }
  };

  const resetUpload = () => {
    console.log("🔵 [JournalUploader] Resetting upload");
    setCapturedImages([]);
    setSelectedFiles([]);
    setShowPreview(false);
    setIsProcessingFile(false);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    setCapturedImages((prev) => prev.filter((_, i) => i !== index));
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));

    // If no images left, hide preview
    if (capturedImages.length === 1) {
      setShowPreview(false);
    }
  };

  return (
    <div className="bg-background p-4 w-full max-w-md mx-auto">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-xl text-center">
            Share Your Journal Entry
          </CardTitle>
          <CardDescription className="text-center">
            Upload a photo of your handwritten journal page to join the{" "}
            {wallTitle}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isProcessingFile ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p className="text-sm text-muted-foreground">
                Processing your image...
              </p>
            </div>
          ) : !showPreview ? (
            <div className="space-y-6">
              <div className="relative">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="h-32 w-full flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-lg transition-colors"
                  variant="outline"
                  disabled={isProcessingFile}
                >
                  {isProcessingFile ? (
                    <>
                      <Loader2 className="animate-spin" size={32} />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <Upload size={32} />
                      <span>Upload from Device</span>
                    </>
                  )}
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*,image/jpeg,image/jpg,image/png,image/webp,image/gif"
                  className="hidden"
                  multiple
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground text-center mb-4">
                {selectedFiles.length} image
                {selectedFiles.length !== 1 ? "s" : ""} selected
              </div>

              <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto">
                {capturedImages.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image}
                      alt={`Journal entry preview ${index + 1}`}
                      className="w-full h-32 rounded-md object-cover"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 rounded-full w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeImage(index)}
                    >
                      <X size={12} />
                    </Button>
                    <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-1 rounded">
                      {index + 1}
                    </div>
                  </div>
                ))}
              </div>

              {/* Add more images button */}
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full"
                disabled={isProcessingFile}
              >
                <Upload size={16} className="mr-2" />
                Add More Images
              </Button>
            </div>
          )}
        </CardContent>
        {showPreview && (
          <CardFooter className="flex flex-col space-y-3">
            {isSubmitting && uploadProgress > 0 && (
              <div className="w-full">
                <div className="flex justify-between text-sm text-muted-foreground mb-1">
                  <span>Uploading...</span>
                  <span>{Math.round(uploadProgress)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-2 w-full">
              <Button
                variant="outline"
                onClick={resetUpload}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Submit {selectedFiles.length} Entr
                    {selectedFiles.length !== 1 ? "ies" : "y"}
                  </>
                )}
              </Button>
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  );
};

export default JournalUploader;
