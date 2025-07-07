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
  updateTheme: (newTheme: Partial<BrandTheme>) => Promise<void>;
  updateCustomRSVPText: (newRSVPText: Partial<CustomRSVPText>) => Promise<void>;
  updateLogo: (logoUrl: string) => Promise<void>;
  resetToDefault: () => Promise<void>;
  isLoading: boolean;
}

// Default YUP.RSVP theme values - Pink, Black, White (from actual app CSS)
const defaultTheme: BrandTheme = {
  primary: '#ec4899', // YUP logo pink (hsl(308, 100%, 66%))
  secondary: '#0a0a14', // Page background black (hsl(222, 84%, 5%))
  tertiary: '#fafafa', // Foreground white (hsl(0, 0%, 98%))
  background: 'hsl(222, 84%, 5%)' // Dark background
};

const defaultCustomRSVPText: CustomRSVPText = {
  yup: 'Yup',
  nope: 'Nope',
  maybe: 'Maybe'
};

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

export function BrandingProvider({ children }: { children: ReactNode }) {
  const { user, refreshUser } = useAuth();
  const [isPremium, setIsPremium] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(defaultLogo);
  const [theme, setTheme] = useState<BrandTheme>(defaultTheme);
  const [customRSVPText, setCustomRSVPText] = useState<CustomRSVPText>(defaultCustomRSVPText);
  const [isLoading, setIsLoading] = useState(true);

  // Load user branding data when user changes
  useEffect(() => {
    async function loadUserBranding() {
      console.log('Loading user branding for user:', user?.id);

      if (!user) {
        console.log('No user, resetting to defaults');
        setIsPremium(false);
        setLogoUrl(defaultLogo);
        setTheme(defaultTheme);
        setCustomRSVPText(defaultCustomRSVPText);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        const { data, error } = await supabase
          .from('users')
          .select(`
            is_premium,
            logo_url,
            brand_primary_color,
            brand_secondary_color,
            brand_tertiary_color,
            custom_yup_text,
            custom_nope_text,
            custom_maybe_text
          `)
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error loading user branding:', error);
          // On error, check user object directly for premium status
          const userIsPremium = (user as any)?.is_premium ||
                               (user as any)?.user_metadata?.is_premium ||
                               user.username === 'subourbon' ||
                               false;
          setIsPremium(userIsPremium);
          setIsLoading(false);
          return;
        }

        console.log('User branding data loaded:', data);

        // Check premium status from multiple sources for backwards compatibility
        const userIsPremium = data.is_premium ||
                             (user as any)?.is_premium ||
                             (user as any)?.user_metadata?.is_premium ||
                             user.username === 'subourbon' || // Special admin account
                             false;

        console.log('Premium status check:', {
          dbIsPremium: data.is_premium,
          userIsPremium: (user as any)?.is_premium,
          metadataIsPremium: (user as any)?.user_metadata?.is_premium,
          username: user.username,
          finalIsPremium: userIsPremium
        });

        setIsPremium(userIsPremium);

        // Set logo URL
        setLogoUrl(data.logo_url || defaultLogo);

        // Set theme colors (with fallbacks to defaults)
        const newTheme: BrandTheme = {
          primary: data.brand_primary_color || defaultTheme.primary,
          secondary: data.brand_secondary_color || defaultTheme.secondary,
          tertiary: data.brand_tertiary_color || defaultTheme.tertiary,
          background: defaultTheme.background, // Keep consistent background
        };
        setTheme(newTheme);

        // Set custom RSVP text (with fallbacks to defaults)
        const newRSVPText: CustomRSVPText = {
          yup: data.custom_yup_text || defaultCustomRSVPText.yup,
          nope: data.custom_nope_text || defaultCustomRSVPText.nope,
          maybe: data.custom_maybe_text || defaultCustomRSVPText.maybe,
        };
        setCustomRSVPText(newRSVPText);

      } catch (error) {
        console.error('Error in loadUserBranding:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadUserBranding();
  }, [user]);

  // Apply theme to CSS variables whenever theme changes
  useEffect(() => {
    console.log('Applying custom theme with colors:', theme);

    // Always apply the theme, regardless of premium status for preview purposes
    if (theme) {
      let primaryColor = theme.primary;
      let secondaryColor = theme.secondary;
      let tertiaryColor = theme.tertiary;
      let backgroundColor = theme.background;

      // Apply primary color
      if (primaryColor.startsWith('#')) {
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

        // Set accessible text color for all primary-colored elements
        const textColorHsl = accessibleTextColor === '#ffffff' ? '0 0% 100%' : '0 0% 0%';
        document.documentElement.style.setProperty('--primary-foreground', textColorHsl);

        // Also set hex versions for direct use
        document.documentElement.style.setProperty('--primary-color', primaryColor);
        document.documentElement.style.setProperty('--color-primary', primaryColor);
        document.documentElement.style.setProperty('--color-primary-hover', primaryColor);
      }

      // Apply secondary color
      if (secondaryColor.startsWith('#')) {
        document.documentElement.style.setProperty('--secondary-color', secondaryColor);
        document.documentElement.style.setProperty('--color-secondary', secondaryColor);
      }

      // Apply tertiary color
      if (tertiaryColor.startsWith('#')) {
        document.documentElement.style.setProperty('--tertiary-color', tertiaryColor);
        document.documentElement.style.setProperty('--color-tertiary', tertiaryColor);
      }

      // Ensure consistent background across all pages
      document.documentElement.style.setProperty('--page-background', 'hsl(222, 84%, 5%)');
      document.body.style.backgroundColor = 'hsl(222, 84%, 5%)';
    }
  }, [theme, isPremium, user]);

  // Update theme values
  const updateTheme = async (newTheme: Partial<BrandTheme>) => {
    if (!isPremium || !user) {
      console.warn('Cannot update theme: user not premium or not logged in');
      return;
    }

    console.log('Updating theme:', newTheme);

    // Update state immediately for UI feedback
    const updatedTheme = { ...theme, ...newTheme };
    setTheme(updatedTheme);

    try {
      // Get current session token for authentication
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No active session');

      // Build update object with individual color fields
      const updateData: any = {};

      if (newTheme.primary !== undefined) {
        updateData.brand_primary_color = newTheme.primary;
      }
      if (newTheme.secondary !== undefined) {
        updateData.brand_secondary_color = newTheme.secondary;
      }
      if (newTheme.tertiary !== undefined) {
        updateData.brand_tertiary_color = newTheme.tertiary;
      }

      console.log('Saving theme update to Supabase:', updateData);

      // Update directly via Supabase client for immediate persistence
      const { error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', user.id);

      if (error) throw error;

      console.log('Theme updated successfully in Supabase');

      // Don't refresh user - the local state update is sufficient
    } catch (e) {
      console.error('Error saving theme:', e);
      // Revert the theme on error
      setTheme(theme);
      throw e;
    }
  };

  // Update custom RSVP text
  const updateCustomRSVPText = async (newRSVPText: Partial<CustomRSVPText>) => {
    if (!isPremium || !user) return;

    // Update state immediately for UI feedback
    const updatedRSVPText = { ...customRSVPText, ...newRSVPText };
    setCustomRSVPText(updatedRSVPText);

    try {
      // Get current session token for authentication
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No active session');

      // Build update object
      const updateData: any = {};

      if (newRSVPText.yup !== undefined) {
        updateData.custom_yup_text = newRSVPText.yup;
      }
      if (newRSVPText.nope !== undefined) {
        updateData.custom_nope_text = newRSVPText.nope;
      }
      if (newRSVPText.maybe !== undefined) {
        updateData.custom_maybe_text = newRSVPText.maybe;
      }

      // Update directly via Supabase client
      const { error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', user.id);

      if (error) throw error;
      console.log('RSVP text updated successfully to Supabase');

      // Don't refresh user - the local state update is sufficient
    } catch (e) {
      console.error('Error saving RSVP text:', e);
      // Revert on error
      setCustomRSVPText(customRSVPText);
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
      console.log('Logo updated successfully to Supabase');

      // Don't refresh user - the local state update is sufficient for logo changes
    } catch (e) {
      console.error('Error saving logo:', e);
      // Don't revert logo on error - keep the preview
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

      // Only refresh user for reset operations since it's a major change
      if (refreshUser) {
        await refreshUser();
      }
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
        isLoading,
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
