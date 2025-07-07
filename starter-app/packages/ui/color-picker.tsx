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

  // Professional color presets with YUP.RSVP Pink, Black, White colors first
  const presetColors = [
    // YUP.RSVP brand colors (Pink, Black, White)
    "#ec4899", "#0a0a14", "#fafafa", "#f8bbd9", "#fce4ec",
    "#e91e63", "#ad1457", "#c2185b", "#d81b60",
    // Additional neutral variants
    "#ffffff", "#f9fafb", "#f3f4f6", "#e5e7eb", "#d1d5db",
    "#000000", "#111827", "#1f2937", "#374151", "#4b5563",
    // Complementary accent colors
    "#8b5cf6", "#3b82f6", "#06b6d4", "#10b981", "#22c55e",
    "#eab308", "#f97316", "#ef4444", "#6b7280", "#9ca3af",
  ];

  return (
    <div className={cn("space-y-2", className)}>
      <Label className="text-sm font-medium text-white">{label}</Label>
      <div className="flex gap-3">
        <button
          type="button"
          className={cn(
            "w-12 h-10 rounded-md border-2 transition-all duration-200",
            "border-gray-600 hover:border-pink-500 cursor-pointer flex-shrink-0",
            "focus:outline-none focus:ring-2 focus:ring-pink-500/20"
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
          "mt-3 p-4 bg-gray-900 rounded-md border border-gray-700 shadow-lg",
          "transition-all duration-200"
        )}>
          <div className="grid grid-cols-6 gap-2 mb-4">
            {presetColors.map((color, index) => (
              <button
                key={index}
                type="button"
                className={cn(
                  "w-8 h-8 rounded border-2 transition-all duration-150",
                  "border-gray-600 hover:border-pink-500 cursor-pointer",
                  "focus:outline-none focus:ring-2 focus:ring-pink-500/20"
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
            className="w-full border-gray-600 text-gray-300 hover:bg-gray-800"
          >
            Close
          </Button>
        </div>
      )}
    </div>
  );
}
