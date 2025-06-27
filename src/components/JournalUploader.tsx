import React, { useState, useRef } from "react";
import { Camera, Upload, X, Check, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

interface JournalUploaderProps {
  onSubmit: (file: File) => Promise<void>;
  isSubmitting?: boolean;
  wallTitle?: string;
}

const JournalUploader = ({
  onSubmit,
  isSubmitting = false,
  wallTitle = "Community Wall",
}: JournalUploaderProps) => {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log("🔵 [JournalUploader] File input changed");
    const file = event.target.files?.[0];

    if (file) {
      console.log("🔵 [JournalUploader] File selected:", {
        name: file.name,
        size: file.size,
        type: file.type,
      });

      // Validate file type
      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
        "image/gif",
      ];
      if (!allowedTypes.includes(file.type)) {
        alert("Please select a valid image file (JPEG, PNG, WebP, or GIF)");
        return;
      }

      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        alert("File size too large. Please choose a file smaller than 10MB.");
        return;
      }

      setSelectedFile(file);
      setIsProcessingFile(true);
      const reader = new FileReader();

      reader.onload = (e) => {
        console.log("🔵 [JournalUploader] File read successfully");
        const result = e.target?.result as string;
        setCapturedImage(result);
        setShowPreview(true);
        setIsProcessingFile(false);
        console.log("🔵 [JournalUploader] Preview should now be visible");
      };

      reader.onerror = (error) => {
        console.error("🔴 [JournalUploader] Error reading file:", error);
        setIsProcessingFile(false);
        alert("Error reading the selected file. Please try again.");
      };

      reader.readAsDataURL(file);
    } else {
      console.log("🔴 [JournalUploader] No file selected");
    }
  };

  const startCamera = async () => {
    try {
      // Set camera active first to show the dialog
      setIsCameraActive(true);

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        // Wait for video to load
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
        };
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      setIsCameraActive(false);
      alert("Unable to access camera. Please check permissions and try again.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
      setIsCameraActive(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const file = new File([blob], "journal-entry.jpg", {
                type: "image/jpeg",
              });
              setSelectedFile(file);
              setCapturedImage(canvas.toDataURL("image/jpeg"));
              setShowPreview(true);
              stopCamera();
            }
          },
          "image/jpeg",
          0.8,
        );
      }
    }
  };

  const handleSubmit = async () => {
    console.log("🔵 [JournalUploader] Submit button clicked");
    if (selectedFile) {
      console.log("🔵 [JournalUploader] Submitting file:", selectedFile.name);
      try {
        await onSubmit(selectedFile);
        console.log("🔵 [JournalUploader] File submitted successfully");
        setCapturedImage(null);
        setSelectedFile(null);
        setShowPreview(false);
      } catch (error) {
        console.error("🔴 [JournalUploader] Error submitting file:", error);
        alert("Error uploading your journal entry. Please try again.");
      }
    } else {
      console.error("🔴 [JournalUploader] No file selected for submission");
    }
  };

  const resetUpload = () => {
    console.log("🔵 [JournalUploader] Resetting upload");
    setCapturedImage(null);
    setSelectedFile(null);
    setShowPreview(false);
    setIsProcessingFile(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
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
              <div className="grid grid-cols-1 gap-4">
                <Button
                  onClick={() => startCamera()}
                  className="h-32 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-lg"
                  variant="outline"
                >
                  <Camera size={32} />
                  <span>Take a Photo</span>
                </Button>

                <div className="relative">
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    className="h-32 w-full flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-lg"
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
                    capture="environment"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <img
                  src={capturedImage || ""}
                  alt="Journal entry preview"
                  className="w-full h-auto rounded-md object-contain max-h-80"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 rounded-full"
                  onClick={resetUpload}
                >
                  <X size={16} />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
        {showPreview && (
          <CardFooter className="flex justify-end space-x-2">
            <Button variant="outline" onClick={resetUpload}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Submit Entry
                </>
              )}
            </Button>
          </CardFooter>
        )}
      </Card>

      {/* Camera Dialog */}
      <Dialog
        open={isCameraActive}
        onOpenChange={(open) => {
          if (!open) stopCamera();
        }}
      >
        <DialogContent className="max-w-full max-h-full w-screen h-screen p-0 m-0 sm:max-w-full sm:max-h-full overflow-hidden">
          <div className="flex flex-col h-full">
            <DialogHeader className="p-4 pb-2">
              <DialogTitle>Take a Photo</DialogTitle>
              <DialogDescription>
                Position your journal page clearly in the frame
              </DialogDescription>
            </DialogHeader>

            <div
              className="flex-1 relative bg-black overflow-hidden"
              style={{ minHeight: "0" }}
            >
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {/* Camera overlay guide */}
              <div className="absolute inset-4 border-2 border-white/50 rounded-lg pointer-events-none">
                <div className="absolute top-2 left-2 w-4 h-4 border-l-2 border-t-2 border-white"></div>
                <div className="absolute top-2 right-2 w-4 h-4 border-r-2 border-t-2 border-white"></div>
                <div className="absolute bottom-2 left-2 w-4 h-4 border-l-2 border-b-2 border-white"></div>
                <div className="absolute bottom-2 right-2 w-4 h-4 border-r-2 border-b-2 border-white"></div>
              </div>

              {/* Floating Capture Button - Prominent and Always Visible */}
              <div className="absolute bottom-16 sm:bottom-12 left-1/2 transform -translate-x-1/2 z-10 pb-safe">
                <Button
                  onClick={capturePhoto}
                  className="w-24 h-24 sm:w-20 sm:h-20 rounded-full bg-white text-black hover:bg-white/90 shadow-2xl border-4 border-white/20 flex items-center justify-center text-3xl sm:text-2xl touch-manipulation"
                  size="lg"
                  style={{ minHeight: "96px", minWidth: "96px" }}
                >
                  •
                </Button>
              </div>

              {/* Cancel Button - Top Left */}
              <div className="absolute top-4 left-4 z-10">
                <Button
                  variant="outline"
                  onClick={stopCamera}
                  className="bg-black/50 border-white/20 text-white hover:bg-black/70 backdrop-blur-sm"
                  size="sm"
                >
                  ✕ Cancel
                </Button>
              </div>

              {/* Instructions overlay - Moved higher to avoid capture button */}
              <div className="absolute bottom-40 sm:bottom-36 left-0 right-0 text-center px-4">
                <p className="text-white text-sm sm:text-base bg-black/70 px-4 py-3 rounded-full mx-auto max-w-xs backdrop-blur-sm">
                  Position your journal page within the frame, then tap the
                  camera button
                </p>
              </div>
            </div>

            <canvas ref={canvasRef} className="hidden" />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default JournalUploader;
