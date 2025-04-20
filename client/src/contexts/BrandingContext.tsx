import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import defaultLogo from '@assets/Yup-logo.png';

// Define the structure of our theme
export interface BrandTheme {
  primary: string;
  variant: 'professional' | 'tint' | 'vibrant';
  appearance: 'light' | 'dark' | 'system';
  radius: number;
}

export interface BrandingContextType {
  isPremium: boolean;
  logoUrl: string | null;
  theme: BrandTheme;
  updateTheme: (newTheme: Partial<BrandTheme>) => void;
  updateLogo: (logoUrl: string) => void;
  resetToDefault: () => void;
}

// Default theme values
const defaultTheme: BrandTheme = {
  primary: 'hsl(308, 100%, 66%)',
  variant: 'vibrant',
  appearance: 'dark',
  radius: 0
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
    document.documentElement.style.setProperty('--primary', theme.primary.replace('hsl(', '').replace(')', ''));
    
    // Set other theme properties if needed
    if (theme.appearance === 'light') {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    }
    
    // Update theme.json
    // Note: In a real application, this would be done server-side
  }, [theme]);

  // Update theme values
  const updateTheme = async (newTheme: Partial<BrandTheme>) => {
    if (!isPremium) return;
    
    const updatedTheme = { ...theme, ...newTheme };
    setTheme(updatedTheme);
    
    if (user) {
      // Save to user preferences on the server
      try {
        const response = await fetch(`/api/users/${user.id}/branding`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            brandTheme: JSON.stringify(updatedTheme),
          }),
        });
        
        if (!response.ok) {
          console.error('Failed to save theme');
        }
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
        const response = await fetch(`/api/users/${user.id}/branding`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            logoUrl: newLogoUrl,
          }),
        });
        
        if (!response.ok) {
          console.error('Failed to save logo');
        }
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
        const response = await fetch(`/api/users/${user.id}/branding`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            brandTheme: JSON.stringify(defaultTheme),
            logoUrl: null,
          }),
        });
        
        if (!response.ok) {
          console.error('Failed to reset branding');
        }
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

export function getLogoUrl(branding: BrandingContextType) {
  return branding.isPremium && branding.logoUrl ? branding.logoUrl : defaultLogo;
}