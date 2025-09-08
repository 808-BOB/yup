"use client";
import * as React from "react";
import Upload from "lucide-react/dist/esm/icons/upload";
import X from "lucide-react/dist/esm/icons/x";
import Camera from "lucide-react/dist/esm/icons/camera";
import Move from "lucide-react/dist/esm/icons/move";
import ChevronDown from "lucide-react/dist/esm/icons/chevron-down";
import { Button } from "./button";
import { cn } from "../utils/utils";

interface ImageUploadProps {
  value?: string;
  onChange: (file: File | null) => void;
  onUrlChange?: (url: string | null) => void;
  placeholder?: string;
  accept?: string;
  maxSize?: number; // in MB
  className?: string;
  rounded?: boolean;
  aspectRatio?: "square" | "rectangle" | "auto";
  size?: "sm" | "md" | "lg" | "xl";
  showPositioningControls?: boolean;
  onImageSettingsChange?: (settings: { scale: number; position: { x: number; y: number }; fit: 'contain' | 'cover' }) => void;
  onSave?: () => void;
  showMiniSave?: boolean;
}

export function ImageUpload({
  value,
  onChange,
  onUrlChange,
  placeholder = "Upload an image",
  accept = "image/*",
  maxSize = 5,
  className,
  rounded = false,
  aspectRatio = "auto",
  size = "md",
  showPositioningControls = false,
  onImageSettingsChange,
  onSave,
  showMiniSave = false
}: ImageUploadProps) {
  const [preview, setPreview] = React.useState<string | null>(value || null);
  const [isDragOver, setIsDragOver] = React.useState(false);
  const [imageSettings, setImageSettings] = React.useState({
    scale: 100,
    position: { x: 50, y: 50 }, // percentage values for centering
    fit: 'contain' as 'contain' | 'cover'
  });

  // Update preview when value prop changes
  React.useEffect(() => {
    if (value !== preview) {
      setPreview(value || null);
    }
  }, [value]);
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 });
  const [hasDragged, setHasDragged] = React.useState(false);
  const [showSettings, setShowSettings] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const sizeClasses = {
    sm: "h-16 w-16",
    md: "h-24 w-24",
    lg: "h-32 w-32",
    xl: "h-40 w-40"
  };

  const aspectClasses = {
    square: "aspect-square",
    rectangle: "aspect-video",
    auto: ""
  };

  const handleFileSelect = React.useCallback((file: File) => {
    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      alert(`File size must be less than ${maxSize}MB`);
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Create preview
    const url = URL.createObjectURL(file);
    setPreview(url);
    onChange(file);
  }, [maxSize, onChange]);

  const handleDrop = React.useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleDragOver = React.useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = React.useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleInputChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleRemove = React.useCallback(() => {
    setPreview(null);
    onChange(null);
    onUrlChange?.(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onChange, onUrlChange]);

  const handleClick = React.useCallback(() => {
    // Don't trigger file upload if we just finished dragging
    if (hasDragged) return;
    fileInputRef.current?.click();
  }, [hasDragged]);

  // Handle image positioning
  const handleImageMouseDown = React.useCallback((e: React.MouseEvent) => {
    if (!showPositioningControls) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setHasDragged(false);
    setDragStart({ x: e.clientX, y: e.clientY });
  }, [showPositioningControls]);

  const handleImageMouseMove = React.useCallback((e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    
    // Only start dragging if we've moved more than 5 pixels
    if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
      setHasDragged(true);
    }
    
    const newX = Math.max(0, Math.min(100, imageSettings.position.x + (deltaX / rect.width) * 100));
    const newY = Math.max(0, Math.min(100, imageSettings.position.y + (deltaY / rect.height) * 100));
    
    const newSettings = {
      ...imageSettings,
      position: { x: newX, y: newY }
    };
    
    setImageSettings(newSettings);
    onImageSettingsChange?.(newSettings);
    setDragStart({ x: e.clientX, y: e.clientY });
  }, [isDragging, dragStart, imageSettings, onImageSettingsChange]);

  const handleImageMouseUp = React.useCallback(() => {
    setIsDragging(false);
    // Reset hasDragged after a short delay to allow click events to be processed
    setTimeout(() => setHasDragged(false), 100);
  }, []);

  // Handle scale change
  const handleScaleChange = React.useCallback((newScale: number) => {
    const newSettings = {
      ...imageSettings,
      scale: Math.max(10, Math.min(200, newScale)),
      fit: 'contain' // Scale slider always uses contain
    };
    setImageSettings(newSettings);
    onImageSettingsChange?.(newSettings);
  }, [imageSettings, onImageSettingsChange]);

  // Center image
  const centerImage = React.useCallback(() => {
    const newSettings = {
      ...imageSettings,
      position: { x: 50, y: 50 }
    };
    setImageSettings(newSettings);
    onImageSettingsChange?.(newSettings);
  }, [imageSettings, onImageSettingsChange]);

  // Update preview when value changes externally
  React.useEffect(() => {
    setPreview(value || null);
  }, [value]);

  // Add global mouse events for dragging
  React.useEffect(() => {
    if (isDragging) {
      const handleGlobalMouseMove = (e: MouseEvent) => {
        if (!containerRef.current) return;
        
        const rect = containerRef.current.getBoundingClientRect();
        const deltaX = e.clientX - dragStart.x;
        const deltaY = e.clientY - dragStart.y;
        
        // Only start dragging if we've moved more than 5 pixels
        if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
          setHasDragged(true);
        }
        
        const newX = Math.max(0, Math.min(100, imageSettings.position.x + (deltaX / rect.width) * 100));
        const newY = Math.max(0, Math.min(100, imageSettings.position.y + (deltaY / rect.height) * 100));
        
        const newSettings = {
          ...imageSettings,
          position: { x: newX, y: newY }
        };
        
        setImageSettings(newSettings);
        onImageSettingsChange?.(newSettings);
        setDragStart({ x: e.clientX, y: e.clientY });
      };

      const handleGlobalMouseUp = () => {
        setIsDragging(false);
        // Reset hasDragged after a short delay to allow click events to be processed
        setTimeout(() => setHasDragged(false), 100);
      };

      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove);
        document.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }
  }, [isDragging, dragStart, imageSettings, onImageSettingsChange]);

  return (
    <div className={cn("relative", className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        className="hidden"
      />
      
      <div
        ref={containerRef}
        onClick={(e) => {
          // Don't trigger file upload if we just finished dragging
          if (hasDragged) return;
          
          // Don't trigger file upload when clicking on the image if positioning controls are enabled
          if (showPositioningControls && preview && e.target === e.currentTarget.querySelector('img')) {
            return;
          }
          
          handleClick();
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          "relative overflow-hidden transition-all group",
          "border-2 border-dashed border-gray-600",
          "hover:border-gray-500 focus:border-primary",
          "bg-page-container hover:bg-gray-600",
          isDragOver && "border-primary bg-primary/10",
          rounded && "rounded-full",
          !rounded && "rounded-lg",
          aspectRatio !== "auto" && aspectClasses[aspectRatio],
          aspectRatio === "auto" && size !== "xl" && sizeClasses[size],
          aspectRatio === "auto" && size === "xl" && "min-h-40",
          showPositioningControls && preview ? "cursor-default" : "cursor-pointer"
        )}
      >
        {preview ? (
          <div className="relative w-full h-full group">
            <img
              src={preview}
              alt="Preview"
              className={cn(
                "w-full h-full transition-transform",
                imageSettings.fit === 'cover' ? "object-cover" : "object-contain",
                rounded && "rounded-full",
                showPositioningControls && "cursor-move hover:cursor-move"
              )}
              style={{
                transform: `scale(${imageSettings.scale / 100}) translate(${(imageSettings.position.x - 50) * 2}%, ${(imageSettings.position.y - 50) * 2}%)`,
                transformOrigin: 'center center',
                userSelect: 'none',
                pointerEvents: 'auto'
              }}
              onMouseDown={handleImageMouseDown}
              onMouseUp={handleImageMouseUp}
            />
            
            {/* Hover overlay background */}
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            {/* Top-right buttons - only show on hover */}
            <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClick();
                }}
                className="h-8 w-8 p-0 pointer-events-auto"
              >
                <Camera className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove();
                }}
                className="h-8 w-8 p-0 pointer-events-auto"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Bottom-right mini save button - only show when showMiniSave is true */}
            {showMiniSave && onSave && (
              <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
                <Button
                  type="button"
                  size="sm"
                  variant="default"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSave();
                  }}
                  className="h-8 px-3 text-xs pointer-events-auto"
                >
                  Save
                </Button>
              </div>
            )}
            
            {/* Center position/drag icon - only show on hover when positioning controls are enabled */}
            {showPositioningControls && (
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <div className="bg-white/20 backdrop-blur-sm rounded-full p-3 border border-white/30">
                  <Move className="h-6 w-6 text-white" />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-4 text-center">
            <Upload className="h-8 w-8 text-gray-400 mb-2" />
            <p className="text-sm text-gray-400">{placeholder}</p>
            <p className="text-xs text-gray-500 mt-1">
              Max {maxSize}MB
            </p>
          </div>
        )}
      </div>

      {/* Image Settings Toggle Button */}
      {showPositioningControls && preview && (
        <div className="mt-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
            className="text-xs px-3 py-2"
          >
            <ChevronDown className={cn("h-3 w-3 mr-1 transition-transform", showSettings && "rotate-180")} />
            Image Settings
          </Button>
        </div>
      )}

      {/* Positioning Controls */}
      {showPositioningControls && preview && showSettings && (
        <div className="mt-4 space-y-4 p-4 rounded-lg border border-gray-600 bg-gray-800/30">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-white leading-none">Image Settings</h4>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(false)}
              className="text-xs h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-300 mb-2 block">Size & Positioning</label>
              <div className="flex items-center justify-between mb-6">
                <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={imageSettings.scale === 100 && imageSettings.fit === 'contain' ? "default" : "outline"}
                  onClick={() => {
                    setImageSettings(prev => ({ ...prev, scale: 100, fit: 'contain' }));
                    onImageSettingsChange?.({ ...imageSettings, scale: 100, fit: 'contain' });
                  }}
                  className="text-xs px-2 py-1"
                >
                  Full
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={imageSettings.fit === 'cover' ? "default" : "outline"}
                  onClick={() => {
                    setImageSettings(prev => ({ ...prev, fit: 'cover' }));
                    onImageSettingsChange?.({ ...imageSettings, fit: 'cover' });
                  }}
                  className="text-xs px-2 py-1"
                >
                  Cover
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={imageSettings.scale === 75 && imageSettings.fit === 'contain' ? "default" : "outline"}
                  onClick={() => {
                    setImageSettings(prev => ({ ...prev, scale: 75, fit: 'contain' }));
                    onImageSettingsChange?.({ ...imageSettings, scale: 75, fit: 'contain' });
                  }}
                  className="text-xs px-2 py-1"
                >
                  Fill
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={imageSettings.scale === 50 && imageSettings.fit === 'contain' ? "default" : "outline"}
                  onClick={() => {
                    setImageSettings(prev => ({ ...prev, scale: 50, fit: 'contain' }));
                    onImageSettingsChange?.({ ...imageSettings, scale: 50, fit: 'contain' });
                  }}
                  className="text-xs px-2 py-1"
                >
                  Scale
                </Button>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={centerImage}
                  className="text-xs px-2 py-1"
                >
                  <Move className="h-3 w-3 mr-1" />
                  Center
                </Button>
              </div>
              <div className="flex items-center">
                <input
                  type="range"
                  min="10"
                  max="200"
                  value={imageSettings.scale}
                  onChange={(e) => handleScaleChange(Number(e.target.value))}
                  className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                />
                <span className="text-sm text-gray-300 w-12 text-right ml-2">
                  {imageSettings.scale}%
                </span>
              </div>
            </div>
            
            <div className="text-xs text-gray-400">
              Drag the image to reposition it within the frame
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 