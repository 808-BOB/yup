"use client";

import { useState } from "react";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";
import { cn } from "../utils/utils";

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
  disabled?: boolean;
  className?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

// Helper function to ensure text contrast
const getContrastingTextColor = (backgroundColor: string) => {
  // Convert hex to RGB
  const hex = backgroundColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Return white for dark backgrounds, black for light backgrounds
  return luminance < 0.5 ? '#ffffff' : '#000000';
};

export function ColorPicker({ label, value, onChange, disabled, className, primaryColor = '#6b7280', secondaryColor = '#1f2937' }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleColorChange = (color: string) => {
    onChange(color);
  };

  // Professional color presets with YUP.RSVP Pink, Black, White colors first
  const presetColors = [
    // YUP.RSVP brand colors (Pink, Black, White)
    "#FF00FF", "#000000", "#fafafa", "#f8bbd9", "#fce4ec",
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
                    "border-gray-600 hover:border-[#FF00FF] cursor-pointer flex-shrink-0",
        "focus:outline-none focus:ring-2 focus:ring-[#FF00FF]/20",
            "relative overflow-hidden"
          )}
          style={{ backgroundColor: value }}
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled}
        >
          {/* Checkered background for transparency indication */}
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: `linear-gradient(45deg, #ccc 25%, transparent 25%), 
                            linear-gradient(-45deg, #ccc 25%, transparent 25%), 
                            linear-gradient(45deg, transparent 75%, #ccc 75%), 
                            linear-gradient(-45deg, transparent 75%, #ccc 75%)`,
            backgroundSize: '4px 4px',
            backgroundPosition: '0 0, 0 2px, 2px -2px, -2px 0px'
          }} />
        </button>
        <Input
          value={value}
          onChange={(e) => handleColorChange(e.target.value)}
          placeholder="#000000 or hsl(0, 0%, 0%)"
          className="flex-1 border-0"
          style={{
            backgroundColor: primaryColor,
            color: getContrastingTextColor(primaryColor),
            borderColor: primaryColor
          }}
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
                          "border-gray-600 hover:border-[#FF00FF] cursor-pointer relative overflow-hidden",
        "focus:outline-none focus:ring-2 focus:ring-[#FF00FF]/20",
        value === color && "ring-2 ring-[#FF00FF] border-[#FF00FF]"
                )}
                style={{ backgroundColor: color }}
                onClick={() => handleColorChange(color)}
                disabled={disabled}
              >
                {/* Checkered background for light colors */}
                <div className="absolute inset-0 opacity-10" style={{
                  backgroundImage: `linear-gradient(45deg, #666 25%, transparent 25%), 
                                  linear-gradient(-45deg, #666 25%, transparent 25%), 
                                  linear-gradient(45deg, transparent 75%, #666 75%), 
                                  linear-gradient(-45deg, transparent 75%, #666 75%)`,
                  backgroundSize: '2px 2px',
                  backgroundPosition: '0 0, 0 1px, 1px -1px, -1px 0px'
                }} />
              </button>
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
