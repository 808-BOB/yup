import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '../utils/auth-context';
import { apiRequest } from '@/lib/queryClient';
import { getAccessibleTextColor } from '@/hooks/use-accessible-colors';
import { supabase } from '../utils/supabase';
const defaultLogo = '/Yup-logo.png';
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

// Define the structure of our comprehensive branding theme
export interface BrandTheme {
  primary: string;
  secondary: string;
  tertiary: string;
  background: string;
}

export interface CustomRSVPText {
  yup: string;
  nope: string;
  maybe: string;
}

export interface BrandingContextType {
  isPremium: boolean;
  logoUrl: string | null;
  theme: BrandTheme;
  customRSVPText: CustomRSVPText;
  updateTheme: (newTheme: Partial<BrandTheme>) => void;
  updateCustomRSVPText: (newText: Partial<CustomRSVPText>) => void;
  updateLogo: (logoUrl: string) => void;
  resetToDefault: () => void;
}

// Default YUP.RSVP theme values - magenta brand colors
const defaultTheme: BrandTheme = {
  primary: 'hsl(308, 100%, 66%)', // YUP.RSVP magenta
  secondary: 'hsl(308, 100%, 76%)', // Lighter magenta
  tertiary: 'hsl(308, 100%, 86%)', // Even lighter magenta
  background: 'hsl(222, 84%, 5%)' // Dark background
};

const defaultCustomRSVPText: CustomRSVPText = {
  yup: 'Yup',
  nope: 'Nope',
  maybe: 'Maybe'
};

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

export function BrandingProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [isPremium, setIsPremium] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [theme, setTheme] = useState<BrandTheme>(defaultTheme);
  const [customRSVPText, setCustomRSVPText] = useState<CustomRSVPText>(defaultCustomRSVPText);

  // Update branding when user changes
  useEffect(() => {
    if (user) {
      console.log('BrandingContext: User loaded:', user);
      console.log('BrandingContext: User brand_theme:', user.brand_theme);
      console.log('BrandingContext: User logo_url:', user.logo_url);

      // Check for premium status using correct field name
      const isSubourbonAccount = user.username === 'subourbon';
      setIsPremium(user.is_premium || isSubourbonAccount || false);

      if (user.logo_url) {
        setLogoUrl(user.logo_url);
        console.log('BrandingContext: Logo URL set to:', user.logo_url);
      } else {
        setLogoUrl(null);
        console.log('BrandingContext: No logo URL found');
      }

            // Load comprehensive branding data
      const newTheme = {
        primary: user.brand_primary_color || defaultTheme.primary,
        secondary: user.brand_secondary_color || defaultTheme.secondary,
        tertiary: user.brand_tertiary_color || defaultTheme.tertiary,
        background: defaultTheme.background // Keep background consistent for now
      };

      const newCustomRSVPText = {
        yup: user.custom_yup_text || defaultCustomRSVPText.yup,
        nope: user.custom_nope_text || defaultCustomRSVPText.nope,
        maybe: user.custom_maybe_text || defaultCustomRSVPText.maybe
      };

      console.log('Setting custom theme to:', newTheme);
      console.log('Setting custom RSVP text to:', newCustomRSVPText);
      setTheme(newTheme);
      setCustomRSVPText(newCustomRSVPText);

      // Handle legacy brand_theme field for backward compatibility
      const brandTheme = user.brand_theme;
      if (brandTheme && !user.brand_primary_color) {
        if (brandTheme.startsWith('#')) {
          setTheme(prev => ({ ...prev, primary: brandTheme }));
        } else {
          try {
            const parsed = JSON.parse(brandTheme);
            setTheme(prev => ({ ...prev, ...parsed }));
          } catch (e) {
            console.error('Failed to parse legacy theme:', e);
          }
        }
      }
    } else {
      // Reset to defaults if no user
      setIsPremium(false);
      setLogoUrl(null);
      setTheme(defaultTheme);
      setCustomRSVPText(defaultCustomRSVPText);
    }
  }, [user]);

  // Apply theme to CSS variables when theme changes
  useEffect(() => {
    // Check if we're on admin pages - always use default theme (only in browser)
    const isAdminPage = typeof window !== 'undefined' && window.location.pathname.includes('/admin');

    // Apply default YUP.RSVP magenta theme for non-logged-in users or admin pages
    if (!user || isAdminPage) {
      document.documentElement.style.setProperty('--primary', '308 100% 66%');
      document.documentElement.style.setProperty('--primary-color', 'hsl(308, 100%, 66%)');
      document.documentElement.style.setProperty('--ring', '308 100% 66%');
      document.documentElement.style.setProperty('--border', '308 100% 20%');

      // Apply default YUP.RSVP branding colors
      document.documentElement.style.setProperty('--color-primary', 'hsl(308, 100%, 66%)');
      document.documentElement.style.setProperty('--color-primary-hover', 'hsl(308, 100%, 66%)');
      console.log(isAdminPage ? 'Applied default YUP.RSVP theme for admin pages' : 'Applied default YUP.RSVP magenta theme for login');
      return;
    }

    // Apply custom themes for logged-in premium users (not on admin pages)
    if (theme && theme.primary && isPremium) {
      // Parse the HSL color to get its components
      let primaryColor = theme.primary;
      let secondaryColor = theme.secondary;
      let tertiaryColor = theme.tertiary;
      let backgroundColor = theme.background;
      console.log('Applying custom theme with colors:', { primaryColor, secondaryColor, tertiaryColor, backgroundColor });

      // Apply background color first
      if (backgroundColor) {
        if (backgroundColor.startsWith('hsl')) {
          const hslMatch = backgroundColor.match(/hsl\(([^,]+),\s*([^,]+),\s*([^)]+)\)/);
          if (hslMatch) {
            const [_, h, s, l] = hslMatch;
            document.documentElement.style.setProperty('--background', `${h} ${s}% ${l}%`);
          }
        } else if (backgroundColor.startsWith('#')) {
          // Convert hex to HSL for CSS variables
          const r = parseInt(backgroundColor.substring(1, 3), 16) / 255;
          const g = parseInt(backgroundColor.substring(3, 5), 16) / 255;
          const b = parseInt(backgroundColor.substring(5, 7), 16) / 255;

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

          document.documentElement.style.setProperty('--background', `${hDeg} ${sPercent}% ${lPercent}%`);
        }
      }

      // Apply primary color
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
        // Convert hex to HSL for CSS variables while keeping hex for direct use
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

        // Calculate accessible text color for WCAG compliance
        const accessibleTextColor = getAccessibleTextColor(primaryColor);

        // Set CSS variables in HSL format for Tailwind compatibility
        document.documentElement.style.setProperty('--primary', `${hDeg} ${sPercent}% ${lPercent}%`);
        document.documentElement.style.setProperty('--ring', `${hDeg} ${sPercent}% ${lPercent}%`);
        document.documentElement.style.setProperty('--border', `${hDeg} ${sPercent}% ${Math.max(20, lPercent - 20)}%`);

        // Set accessible text color for all primary-colored elements
        const textColorHsl = accessibleTextColor === '#ffffff' ? '0 0% 100%' : '0 0% 0%';
        document.documentElement.style.setProperty('--primary-foreground', textColorHsl);

        // Also set hex versions for direct use
        document.documentElement.style.setProperty('--primary-color', primaryColor);
        document.documentElement.style.setProperty('--color-primary', primaryColor);
        document.documentElement.style.setProperty('--color-primary-hover', primaryColor);
      } else {
        // For other color formats, use as is
        document.documentElement.style.setProperty('--primary-color', primaryColor);
        document.documentElement.style.setProperty('--color-primary', primaryColor);
      }
    }
  }, [theme, isPremium, user]);

  // Update theme values
  const updateTheme = async (newTheme: Partial<BrandTheme>) => {
    if (!isPremium || !user) return;

    const updatedTheme = { ...theme, ...newTheme };
    setTheme(updatedTheme);

    try {
      // Get current session token for authentication
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No active session');

      const updateData: any = {};
      if (newTheme.primary !== undefined) updateData.brand_primary_color = newTheme.primary;
      if (newTheme.secondary !== undefined) updateData.brand_secondary_color = newTheme.secondary;
      if (newTheme.tertiary !== undefined) updateData.brand_tertiary_color = newTheme.tertiary;

      // Update directly via Supabase client instead of API route
      const { error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', user.id);

      if (error) throw error;
      console.log('Theme saved successfully to Supabase');
    } catch (e) {
      console.error('Error saving theme:', e);
      throw e;
    }
  };

  // Update custom RSVP text
  const updateCustomRSVPText = async (newText: Partial<CustomRSVPText>) => {
    if (!isPremium || !user) return;

    const updatedText = { ...customRSVPText, ...newText };
    setCustomRSVPText(updatedText);

    try {
      // Get current session token for authentication
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No active session');

      const updateData: any = {};
      if (newText.yup !== undefined) updateData.custom_yup_text = newText.yup;
      if (newText.nope !== undefined) updateData.custom_nope_text = newText.nope;
      if (newText.maybe !== undefined) updateData.custom_maybe_text = newText.maybe;

      // Update directly via Supabase client
      const { error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', user.id);

      if (error) throw error;
      console.log('Custom RSVP text saved successfully to Supabase');
    } catch (e) {
      console.error('Error saving custom RSVP text:', e);
      throw e;
    }
  };

  // Update logo URL
  const updateLogo = async (newLogoUrl: string) => {
    if (!isPremium || !user) return;

    // Update state immediately for UI feedback
    setLogoUrl(newLogoUrl);

    try {
      // Get current session token for authentication
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No active session');

      // Update directly via Supabase client
      const { error } = await supabase
        .from('users')
        .update({ logo_url: newLogoUrl })
        .eq('id', user.id);

      if (error) throw error;
      console.log('Logo saved successfully to Supabase');
    } catch (e) {
      console.error('Error saving logo:', e);
      throw e;
    }
  };

  // Reset to default values
  const resetToDefault = async () => {
    if (!user) return;

    // Update state immediately for UI feedback
    setTheme(defaultTheme);
    setCustomRSVPText(defaultCustomRSVPText);
    setLogoUrl(null);

    try {
      // Get current session token for authentication
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No active session');

      // Update directly via Supabase client
      const { error } = await supabase
        .from('users')
        .update({
          brand_primary_color: defaultTheme.primary,
          brand_secondary_color: defaultTheme.secondary,
          brand_tertiary_color: defaultTheme.tertiary,
          custom_yup_text: defaultCustomRSVPText.yup,
          custom_nope_text: defaultCustomRSVPText.nope,
          custom_maybe_text: defaultCustomRSVPText.maybe,
          logo_url: null,
        })
        .eq('id', user.id);

      if (error) throw error;
      console.log('Branding reset successfully to Supabase');
    } catch (e) {
      console.error('Error resetting branding:', e);
      throw e;
    }
  };

  return (
    <BrandingContext.Provider
      value={{
        isPremium,
        logoUrl,
        theme,
        customRSVPText,
        updateTheme,
        updateCustomRSVPText,
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
