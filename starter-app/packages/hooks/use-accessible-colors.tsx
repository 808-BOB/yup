import { useEffect, useState } from 'react';

// Calculate relative luminance according to WCAG 2.1 specification
function getRelativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

// Calculate contrast ratio between two colors
function getContrastRatio(color1: [number, number, number], color2: [number, number, number]): number {
  const lum1 = getRelativeLuminance(...color1);
  const lum2 = getRelativeLuminance(...color2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

// Convert hex color to RGB
function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result 
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [0, 0, 0];
}

// Convert HSL string to RGB
function hslToRgb(hslString: string): [number, number, number] {
  // Extract h, s, l values from string like "308 100% 66%"
  const match = hslString.match(/(\d+)\s+(\d+)%\s+(\d+)%/);
  if (!match) return [0, 0, 0];
  
  const h = parseInt(match[1]) / 360;
  const s = parseInt(match[2]) / 100;
  const l = parseInt(match[3]) / 100;

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };

  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

// Get accessible text color (white or black) based on background
export function getAccessibleTextColor(backgroundColor: string): string {
  let rgb: [number, number, number];
  
  if (backgroundColor.startsWith('#')) {
    rgb = hexToRgb(backgroundColor);
  } else if (backgroundColor.includes('%')) {
    rgb = hslToRgb(backgroundColor);
  } else {
    // Fallback for other formats
    rgb = [0, 0, 0];
  }
  
  const whiteContrast = getContrastRatio(rgb, [255, 255, 255]);
  const blackContrast = getContrastRatio(rgb, [0, 0, 0]);
  
  // Return white if it has better contrast, otherwise black
  return whiteContrast >= blackContrast ? '#ffffff' : '#000000';
}

// Hook to get current primary color and its accessible text color
export function useAccessibleColors() {
  const [primaryColor, setPrimaryColor] = useState<string>('');
  const [accessibleTextColor, setAccessibleTextColor] = useState<string>('#ffffff');
  
  useEffect(() => {
    const updateColors = () => {
      const computedStyle = getComputedStyle(document.documentElement);
      const primary = computedStyle.getPropertyValue('--primary').trim();
      const primaryColorVar = computedStyle.getPropertyValue('--primary-color').trim();
      
      // Use --primary-color if available (set by branding), otherwise use --primary
      const currentPrimary = primaryColorVar || primary;
      
      if (currentPrimary && currentPrimary !== primaryColor) {
        setPrimaryColor(currentPrimary);
        setAccessibleTextColor(getAccessibleTextColor(currentPrimary));
      }
    };
    
    // Initial update
    updateColors();
    
    // Watch for changes to CSS variables
    const observer = new MutationObserver(updateColors);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['style']
    });
    
    return () => observer.disconnect();
  }, [primaryColor]);
  
  return { primaryColor, accessibleTextColor };
}