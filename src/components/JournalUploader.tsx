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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setCapturedImage(e.target?.result as string);
        setShowPreview(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        setIsCameraActive(true);
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
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
    if (selectedFile) {
      await onSubmit(selectedFile);
      setCapturedImage(null);
      setSelectedFile(null);
      setShowPreview(false);
    }
  };

  const resetUpload = () => {
    setCapturedImage(null);
    setSelectedFile(null);
    setShowPreview(false);
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
          {!showPreview ? (
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
                  >
                    <Upload size={32} />
                    <span>Upload from Device</span>
                  </Button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Take a Photo</DialogTitle>
            <DialogDescription>
              Position your journal page clearly in the frame
            </DialogDescription>
          </DialogHeader>
          <div className="relative aspect-video w-full overflow-hidden rounded-md">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          </div>
          <canvas ref={canvasRef} className="hidden" />
          <DialogFooter className="sm:justify-between">
            <Button variant="outline" onClick={stopCamera}>
              Cancel
            </Button>
            <Button onClick={capturePhoto}>Capture</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default JournalUploader;
