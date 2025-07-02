"use client";
import * as React from "react";
import { Upload, X, Camera } from "lucide-react";
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
  size = "md"
}: ImageUploadProps) {
  const [preview, setPreview] = React.useState<string | null>(value || null);
  const [isDragOver, setIsDragOver] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

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
    fileInputRef.current?.click();
  }, []);

  // Update preview when value changes externally
  React.useEffect(() => {
    setPreview(value || null);
  }, [value]);

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
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          "relative overflow-hidden cursor-pointer transition-all",
          "border-2 border-dashed border-gray-600",
          "hover:border-gray-500 focus:border-primary",
          "bg-gray-900/50 hover:bg-gray-900/70",
          isDragOver && "border-primary bg-primary/10",
          rounded && "rounded-full",
          !rounded && "rounded-lg",
          aspectRatio !== "auto" && aspectClasses[aspectRatio],
          aspectRatio === "auto" && size !== "xl" && sizeClasses[size],
          aspectRatio === "auto" && size === "xl" && "min-h-40"
        )}
      >
        {preview ? (
          <div className="relative w-full h-full">
            <img
              src={preview}
              alt="Preview"
              className={cn(
                "w-full h-full object-cover",
                rounded && "rounded-full"
              )}
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClick();
                  }}
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
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
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
    </div>
  );
} 