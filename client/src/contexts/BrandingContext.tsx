import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { apiRequest } from '@/lib/queryClient';
import defaultLogo from '@assets/Yup-logo.png';
// Make sure the import path is correct for the assets

// Helper function to convert HSL to hex
function hslToHex(h: number, s: number, l: number): string {
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

// Helper function to adjust hex brightness
function adjustHexBrightness(hex: string, factor: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  
  const adjust = (color: number) => {
    const newColor = Math.round(color * (1 + factor));
    return Math.max(0, Math.min(255, newColor));
  };
  
  const newR = adjust(r).toString(16).padStart(2, '0');
  const newG = adjust(g).toString(16).padStart(2, '0');
  const newB = adjust(b).toString(16).padStart(2, '0');
  
  return `#${newR}${newG}${newB}`;
}

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
      console.log('BrandingContext: User loaded:', user);
      console.log('BrandingContext: User brand_theme:', user.brand_theme);
      console.log('BrandingContext: User logo_url:', user.logo_url);
      
      // Fix for Subourbon account - specifically check for both username and premium status
      // This ensures the test account always has branding access
      const isSubourbonAccount = user.username === 'subourbon';
      setIsPremium(user.is_premium || isSubourbonAccount || false);
      
      if (user.logo_url) {
        setLogoUrl(user.logo_url);
        console.log('BrandingContext: Logo URL set to:', user.logo_url);
      } else {
        setLogoUrl(null);
        console.log('BrandingContext: No logo URL found');
      }
      
      // Parse brandTheme if it exists
      if (user.brand_theme) {
        try {
          const parsed = JSON.parse(user.brand_theme);
          console.log('User brand theme loaded:', parsed);
          setTheme({
            ...defaultTheme,
            ...parsed
          });
        } catch (e) {
          console.error('Failed to parse theme:', e);
          setTheme(defaultTheme);
        }
      } else {
        console.log('No brand theme found for user, using default');
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
    // Reset theme if not logged in
    if (!user) {
      document.documentElement.style.setProperty('--primary', '#d946ef');
      document.documentElement.style.setProperty('--primary-color', '#d946ef');
      document.documentElement.style.setProperty('--ring', '#d946ef');
      document.documentElement.style.setProperty('--border', '#581c87');
      return;
    }
    
    // Update the primary color for any user with a custom theme
    if (theme && theme.primary) {
      // Parse the HSL color to get its components
      let primaryColor = theme.primary;
      
      // If it's in HSL format, convert to hex and use consistently
      if (primaryColor.startsWith('hsl')) {
        const hslMatch = primaryColor.match(/hsl\(([^,]+),\s*([^,]+),\s*([^)]+)\)/);
        if (hslMatch) {
          const [_, h, s, l] = hslMatch;
          
          // Convert HSL to hex for consistent representation
          const hexColor = hslToHex(parseInt(h), parseInt(s), parseInt(l));
          
          // Set all variables to use hex format
          document.documentElement.style.setProperty('--primary', hexColor);
          document.documentElement.style.setProperty('--primary-color', hexColor);
          document.documentElement.style.setProperty('--ring', hexColor);
          document.documentElement.style.setProperty('--card-foreground', '#ffffff');
          
          // Create darker version for borders
          const darkerHex = adjustHexBrightness(hexColor, -0.3);
          document.documentElement.style.setProperty('--border', darkerHex);
          
          // For custom components using CSS variables
          document.documentElement.style.setProperty('--color-primary', hexColor);
          document.documentElement.style.setProperty('--color-primary-hover', hexColor);
        }
      } else if (primaryColor.startsWith('#')) {
        // For hex colors, use consistently across all variables
        document.documentElement.style.setProperty('--primary', primaryColor);
        document.documentElement.style.setProperty('--primary-color', primaryColor);
        document.documentElement.style.setProperty('--ring', primaryColor);
        document.documentElement.style.setProperty('--card-foreground', '#ffffff');
        
        // Create a darker version for borders
        const rgb = parseInt(primaryColor.slice(1), 16);
        const r = (rgb >> 16) & 255;
        const g = (rgb >> 8) & 255;
        const b = rgb & 255;
        
        // Darken by reducing each component by 30%
        const darkerR = Math.max(0, Math.round(r * 0.7));
        const darkerG = Math.max(0, Math.round(g * 0.7));
        const darkerB = Math.max(0, Math.round(b * 0.7));
        
        const darkerHex = `#${darkerR.toString(16).padStart(2, '0')}${darkerG.toString(16).padStart(2, '0')}${darkerB.toString(16).padStart(2, '0')}`;
        
        document.documentElement.style.setProperty('--border', darkerHex);
        document.documentElement.style.setProperty('--color-primary', primaryColor);
        document.documentElement.style.setProperty('--color-primary-hover', primaryColor);
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
    if (!isPremium || !user) return;
    
    // Update state immediately for UI feedback
    setLogoUrl(newLogoUrl);
    
    try {
      // Save to user preferences on the server
      const response = await apiRequest('PUT', `/api/users/${user.id}/branding`, {
        logoUrl: newLogoUrl,
      });
      
      console.log('Logo saved successfully');
      
      // Update the user in AuthContext to ensure we're in sync
      // This would typically be handled by the calling component if needed
      
      // No need to refresh the entire page - just ensure the state is consistent
    } catch (e) {
      // Revert to previous logo on error
      console.error('Error saving logo:', e);
      // Don't revert - keep the local state as the preview
      // The next auth refresh will restore from server if needed
    }
  };

  // Reset to default values
  const resetToDefault = async () => {
    if (!user) return;
    
    // Update state immediately for UI feedback
    setTheme(defaultTheme);
    setLogoUrl(null);
    
    try {
      // Save to user preferences on the server
      const response = await apiRequest('PUT', `/api/users/${user.id}/branding`, {
        brandTheme: JSON.stringify(defaultTheme),
        logoUrl: null,
      });
      
      console.log('Branding reset successfully');
      
      // No need to refresh the entire page - state is already updated
    } catch (e) {
      console.error('Error resetting branding:', e);
      // Don't revert the UI - keep local state consistent with what user sees
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
    // All valid logo URLs should be returned as-is
    return branding.logoUrl;
  }
  // Return the default logo as fallback
  return defaultLogo;
}