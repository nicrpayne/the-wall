import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, RotateCcw, Maximize2 } from "lucide-react";

interface ZoomableImageProps {
  src: string;
  alt: string;
  className?: string;
}

const ZoomableImage = ({ src, alt, className = "" }: ZoomableImageProps) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const minScale = 0.5;
  const maxScale = 5;

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev * 1.2, maxScale));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev / 1.2, minScale));
  };

  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale((prev) => Math.min(Math.max(prev * delta, minScale), maxScale));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch events for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && scale > 1) {
      const touch = e.touches[0];
      setIsDragging(true);
      setDragStart({
        x: touch.clientX - position.x,
        y: touch.clientY - position.y,
      });
    } else if (e.touches.length === 2) {
      // Handle pinch-to-zoom start
      e.preventDefault();
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDragging && scale > 1) {
      const touch = e.touches[0];
      setPosition({
        x: touch.clientX - dragStart.x,
        y: touch.clientY - dragStart.y,
      });
    } else if (e.touches.length === 2) {
      // Handle pinch-to-zoom
      e.preventDefault();
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleDoubleClick = () => {
    if (scale === 1) {
      setScale(2);
    } else {
      handleReset();
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    if (!isFullscreen) {
      handleReset();
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
        handleReset();
      } else if (e.key === "+" || e.key === "=") {
        handleZoomIn();
      } else if (e.key === "-") {
        handleZoomOut();
      } else if (e.key === "0") {
        handleReset();
      }
    };

    if (isFullscreen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isFullscreen]);

  const imageStyle = {
    transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
    cursor: scale > 1 ? (isDragging ? "grabbing" : "grab") : "default",
    transition: isDragging ? "none" : "transform 0.1s ease-out",
  };

  const containerClasses = isFullscreen
    ? "fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
    : `relative overflow-hidden ${className}`;

  return (
    <div className={containerClasses} ref={containerRef}>
      {/* Zoom Controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={handleZoomIn}
          disabled={scale >= maxScale}
          className="bg-black/50 text-white hover:bg-black/70"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleZoomOut}
          disabled={scale <= minScale}
          className="bg-black/50 text-white hover:bg-black/70"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleReset}
          className="bg-black/50 text-white hover:bg-black/70"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={toggleFullscreen}
          className="bg-black/50 text-white hover:bg-black/70"
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Zoom Level Indicator */}
      <div className="absolute top-4 left-4 z-10 bg-black/50 text-white px-2 py-1 rounded text-sm">
        {Math.round(scale * 100)}%
      </div>

      {/* Image */}
      <img
        ref={imageRef}
        src={src}
        alt={alt}
        style={imageStyle}
        className={`max-w-full max-h-full object-contain select-none ${isFullscreen ? "max-h-screen" : ""}`}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onDoubleClick={handleDoubleClick}
        draggable={false}
      />

      {/* Instructions */}
      {isFullscreen && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded text-sm text-center">
          <p>
            Double-click to zoom • Drag to pan • Scroll to zoom • ESC to exit
          </p>
        </div>
      )}

      {/* Close button for fullscreen */}
      {isFullscreen && (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setIsFullscreen(false)}
          className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white hover:bg-black/70"
        >
          Close Fullscreen
        </Button>
      )}
    </div>
  );
};

export default ZoomableImage;
