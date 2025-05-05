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
          // Set the primary variable (for certain components) in the format Tailwind expects 
          document.documentElement.style.setProperty('--primary', `${h} ${s} ${l}`);
          
          // Set the actual CSS color variables for all instances
          document.documentElement.style.setProperty('--primary-color', primaryColor);
          document.documentElement.style.setProperty('--primary-hue', h.trim());
          document.documentElement.style.setProperty('--primary-saturation', s.trim());
          document.documentElement.style.setProperty('--primary-lightness', l.trim());
        }
      } else {
        // For hex or other color formats, use as is
        document.documentElement.style.setProperty('--primary-color', primaryColor);
      }
      
      // Also add individual CSS custom properties for any components that need them
      document.documentElement.style.setProperty('--color-primary', primaryColor);
      document.documentElement.style.setProperty('--color-primary-hover', primaryColor);
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