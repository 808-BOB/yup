"use client";

import { useState } from "react";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";
import { cn } from "@/lib/utils";

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
  disabled?: boolean;
  className?: string;
}

export function ColorPicker({ label, value, onChange, disabled, className }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleColorChange = (color: string) => {
    onChange(color);
  };

  // Professional color presets following the style guide
  const presetColors = [
    // Primary brand colors
    "#84793c", "#9c8f4a", "#b4a558",
    // Neutral tones
    "#6b7280", "#4b5563", "#374151",
    "#9ca3af", "#d1d5db", "#f3f4f6",
    // Accent colors
    "#ef4444", "#f97316", "#eab308",
    "#22c55e", "#3b82f6", "#8b5cf6",
    "#ec4899", "#06b6d4", "#10b981",
    // Professional variants
    "#1f2937", "#111827", "#030712",
    "#f9fafb", "#ffffff", "#fafafa",
  ];

  return (
    <div className={cn("space-y-2", className)}>
      <Label className="text-sm font-medium text-foreground">{label}</Label>
      <div className="flex gap-3">
        <button
          type="button"
          className={cn(
            "w-12 h-10 rounded-md border-2 transition-all duration-200",
            "border-border hover:border-primary/50 cursor-pointer flex-shrink-0",
            "focus:outline-none focus:ring-2 focus:ring-primary/20"
          )}
          style={{ backgroundColor: value }}
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled}
        />
        <Input
          value={value}
          onChange={(e) => handleColorChange(e.target.value)}
          placeholder="#000000 or hsl(0, 0%, 0%)"
          className="flex-1 bg-black border-white text-white placeholder:text-gray-400"
          disabled={disabled}
        />
      </div>

      {isOpen && (
        <div className={cn(
          "mt-3 p-4 bg-card rounded-md border border-border shadow-sm",
          "transition-all duration-200"
        )}>
          <div className="grid grid-cols-6 gap-2 mb-4">
            {presetColors.map((color, index) => (
              <button
                key={index}
                type="button"
                className={cn(
                  "w-8 h-8 rounded border-2 transition-all duration-150",
                  "border-border hover:border-primary/50 cursor-pointer",
                  "focus:outline-none focus:ring-2 focus:ring-primary/20"
                )}
                style={{ backgroundColor: color }}
                onClick={() => handleColorChange(color)}
                disabled={disabled}
              />
            ))}
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsOpen(false)}
            className="w-full"
          >
            Close
          </Button>
        </div>
      )}
    </div>
  );
}
