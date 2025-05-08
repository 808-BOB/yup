import { ReactNode, useEffect } from 'react';
import defaultLogo from '@assets/Yup-logo.png';

export interface HostBranding {
  logoUrl?: string | null;
  brandTheme?: string | null;
}

interface EventBrandingProviderProps {
  children: ReactNode;
  hostBranding: HostBranding | null;
  enabled?: boolean;
}

// Helper function to convert hex to HSL or parse HSL values
const parseColor = (colorStr: string) => {
  // If already HSL, extract the values
  if (colorStr.startsWith('hsl')) {
    const hslMatch = colorStr.match(/hsl\(([^,]+),\s*([^,]+),\s*([^)]+)\)/);
    if (hslMatch) {
      const [_, h, s, l] = hslMatch;
      return {
        h: h.trim(),
        s: s.trim(),
        l: l.trim()
      };
    }
  } 
  
  // If hex, convert to HSL
  if (colorStr.startsWith('#')) {
    // For hex colors, convert to HSL
    const r = parseInt(colorStr.substring(1, 3), 16) / 255;
    const g = parseInt(colorStr.substring(3, 5), 16) / 255;
    const b = parseInt(colorStr.substring(5, 7), 16) / 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    
    if (max === min) {
      h = s = 0; // achromatic
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
        default: h = 0;
      }
      h /= 6;
    }
    
    const hDeg = Math.round(h * 360);
    const sPercent = Math.round(s * 100);
    const lPercent = Math.round(l * 100);
    
    return {
      h: `${hDeg}`,
      s: `${sPercent}%`,
      l: `${lPercent}%`
    };
  }
  
  // Default values if parsing fails
  return {
    h: '308',
    s: '100%',
    l: '66%'
  };
};

export default function EventBrandingProvider({ 
  children, 
  hostBranding, 
  enabled = true 
}: EventBrandingProviderProps) {
  // Apply host's branding theme when available and enabled
  useEffect(() => {
    const originalPrimary = document.documentElement.style.getPropertyValue('--primary');
    
    if (enabled && hostBranding && hostBranding.brandTheme) {
      try {
        const parsedTheme = JSON.parse(hostBranding.brandTheme);
        
        if (parsedTheme && parsedTheme.primary) {
          const { h, s, l } = parseColor(parsedTheme.primary);
          
          // Set the primary variable in proper format for Tailwind/shadcn components
          document.documentElement.style.setProperty('--primary', `${h} ${s} ${l}`);
          
          // For buttons and other components that might use different formats
          document.documentElement.style.setProperty('--primary-color', parsedTheme.primary);
          document.documentElement.style.setProperty('--primary-hue', h);
          document.documentElement.style.setProperty('--primary-saturation', s);
          document.documentElement.style.setProperty('--primary-lightness', l);
          
          // Apply color to other CSS variables that might be using the primary color
          document.documentElement.style.setProperty('--ring', `${h} ${s} ${l}`);
          document.documentElement.style.setProperty('--card-foreground', `0 0% 100%`);
          document.documentElement.style.setProperty('--border', `${h} ${s} 20%`); // Darker version
          
          // For custom components using CSS variables
          document.documentElement.style.setProperty('--color-primary', parsedTheme.primary);
        }
      } catch (e) {
        console.error('Failed to parse theme:', e);
      }
    }
    
    // Cleanup function to restore original values when component unmounts
    return () => {
      if (originalPrimary) {
        document.documentElement.style.setProperty('--primary', originalPrimary);
      }
    };
  }, [hostBranding, enabled]);
  
  return <>{children}</>;
}

// Helper function to get logo URL from host branding
export function getHostLogoUrl(hostBranding: HostBranding | null): string {
  if (hostBranding && hostBranding.logoUrl && typeof hostBranding.logoUrl === 'string') {
    return hostBranding.logoUrl;
  }
  return defaultLogo;
}