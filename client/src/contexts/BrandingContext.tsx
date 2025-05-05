import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { apiRequest } from '@/lib/queryClient';
import defaultLogo from '@assets/Yup-logo.png';
// Make sure the import path is correct for the assets

// Define the structure of our theme - simplified to only use primary accent color
export interface BrandTheme {
  primary: string;
}

export interface BrandingContextType {
  isPremium: boolean;
  logoUrl: string | null;
  theme: BrandTheme;
  updateTheme: (newTheme: Partial<BrandTheme>) => void;
  updateLogo: (logoUrl: string) => void;
  resetToDefault: () => void;
}

// Default theme values - simplified to only include primary accent color
const defaultTheme: BrandTheme = {
  primary: 'hsl(308, 100%, 66%)' // Magenta
};

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

export function BrandingProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [isPremium, setIsPremium] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [theme, setTheme] = useState<BrandTheme>(defaultTheme);

  // Update branding when user changes
  useEffect(() => {
    if (user) {
      setIsPremium(user.isPremium || false);
      
      if (user.logoUrl) {
        setLogoUrl(user.logoUrl);
      } else {
        setLogoUrl(null);
      }
      
      // Parse brandTheme if it exists
      if (user.brandTheme) {
        try {
          const parsed = JSON.parse(user.brandTheme);
          setTheme({
            ...defaultTheme,
            ...parsed
          });
        } catch (e) {
          console.error('Failed to parse theme:', e);
          setTheme(defaultTheme);
        }
      } else {
        setTheme(defaultTheme);
      }
    } else {
      // Reset to defaults if no user
      setIsPremium(false);
      setLogoUrl(null);
      setTheme(defaultTheme);
    }
  }, [user]);

  // Apply theme to CSS variables when theme changes
  useEffect(() => {
    // Only update the primary color for premium users
    if (isPremium) {
      // Parse the HSL color to get its components
      let primaryColor = theme.primary;
      
      // If it's in HSL format, extract the components
      if (primaryColor.startsWith('hsl')) {
        const hslMatch = primaryColor.match(/hsl\(([^,]+),\s*([^,]+),\s*([^)]+)\)/);
        if (hslMatch) {
          const [_, h, s, l] = hslMatch;
          
          // Set the primary variable in proper format for Tailwind/shadcn components
          document.documentElement.style.setProperty('--primary', `${h} ${s} ${l}`);
          
          // For buttons and other components that might use different formats
          document.documentElement.style.setProperty('--primary-color', primaryColor);
          document.documentElement.style.setProperty('--primary-hue', h.trim());
          document.documentElement.style.setProperty('--primary-saturation', s.trim());
          document.documentElement.style.setProperty('--primary-lightness', l.trim());
          
          // Apply color to other CSS variables that might be using the primary color
          document.documentElement.style.setProperty('--ring', `${h} ${s} ${l}`);
          document.documentElement.style.setProperty('--card-foreground', `0 0% 100%`);
          document.documentElement.style.setProperty('--border', `${h} ${s} 20%`); // Darker version
          
          // For custom components using CSS variables
          document.documentElement.style.setProperty('--color-primary', primaryColor);
          document.documentElement.style.setProperty('--color-primary-hover', `hsl(${h}, ${s}, ${parseInt(l)}%)`);
        }
      } else if (primaryColor.startsWith('#')) {
        // For hex colors, convert to HSL
        // This is a simplified conversion that might not be 100% accurate
        const r = parseInt(primaryColor.substring(1, 3), 16) / 255;
        const g = parseInt(primaryColor.substring(3, 5), 16) / 255;
        const b = parseInt(primaryColor.substring(5, 7), 16) / 255;
        
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
        
        document.documentElement.style.setProperty('--primary', `${hDeg} ${sPercent}% ${lPercent}%`);
        document.documentElement.style.setProperty('--primary-color', primaryColor);
        document.documentElement.style.setProperty('--ring', `${hDeg} ${sPercent}% ${lPercent}%`);
        document.documentElement.style.setProperty('--card-foreground', `0 0% 100%`);
        document.documentElement.style.setProperty('--border', `${hDeg} ${sPercent}% ${Math.max(20, lPercent - 20)}%`);
        document.documentElement.style.setProperty('--color-primary', primaryColor);
        document.documentElement.style.setProperty('--color-primary-hover', `hsl(${hDeg}, ${sPercent}%, ${lPercent}%)`);
      } else {
        // For other color formats, use as is
        document.documentElement.style.setProperty('--primary-color', primaryColor);
        document.documentElement.style.setProperty('--color-primary', primaryColor);
      }
    }
  }, [theme, isPremium]);

  // Update theme values
  const updateTheme = async (newTheme: Partial<BrandTheme>) => {
    if (!isPremium) return;
    
    const updatedTheme = { ...theme, ...newTheme };
    setTheme(updatedTheme);
    
    if (user) {
      // Save to user preferences on the server
      try {
        await apiRequest('PUT', `/api/users/${user.id}/branding`, {
          brandTheme: JSON.stringify(updatedTheme),
        });
        console.log('Theme saved successfully');
      } catch (e) {
        console.error('Error saving theme:', e);
      }
    }
  };

  // Update logo URL
  const updateLogo = async (newLogoUrl: string) => {
    if (!isPremium) return;
    
    setLogoUrl(newLogoUrl);
    
    if (user) {
      // Save to user preferences on the server
      try {
        await apiRequest('PUT', `/api/users/${user.id}/branding`, {
          logoUrl: newLogoUrl,
        });
        console.log('Logo saved successfully');
      } catch (e) {
        console.error('Error saving logo:', e);
      }
    }
  };

  // Reset to default values
  const resetToDefault = async () => {
    setTheme(defaultTheme);
    setLogoUrl(null);
    
    if (user) {
      try {
        await apiRequest('PUT', `/api/users/${user.id}/branding`, {
          brandTheme: JSON.stringify(defaultTheme),
          logoUrl: null,
        });
        console.log('Branding reset successfully');
      } catch (e) {
        console.error('Error resetting branding:', e);
      }
    }
  };

  return (
    <BrandingContext.Provider
      value={{
        isPremium,
        logoUrl,
        theme,
        updateTheme,
        updateLogo,
        resetToDefault,
      }}
    >
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding() {
  const context = useContext(BrandingContext);
  if (context === undefined) {
    throw new Error('useBranding must be used within a BrandingProvider');
  }
  return context;
}

// This function returns the logo URL or the default logo if none is set
export function getLogoUrl(branding: BrandingContextType) {
  if (branding.isPremium && branding.logoUrl) {
    // For absolute URLs or attached assets
    if (branding.logoUrl.startsWith('http') || branding.logoUrl.startsWith('attached_assets/')) {
      return branding.logoUrl;
    }
  }
  // Return the default logo as fallback
  return defaultLogo;
}