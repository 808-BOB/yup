"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { getSupabaseClient } from '../utils/supabase';

interface BrandingTheme {
  primary: string;
  secondary: string;
  tertiary: string;
}

interface CustomRSVPText {
  yup: string;
  nope: string;
  maybe: string;
}

interface BrandingContextType {
  theme: BrandingTheme;
  logoUrl: string | null;
  customRSVPText: CustomRSVPText;
  isPremium: boolean;
  isLoading: boolean;
  updateTheme: (newTheme: Partial<BrandingTheme>) => Promise<void>;
  updateLogo: (logoUrl: string) => Promise<void>;
  updateCustomRSVPText: (newText: Partial<CustomRSVPText>) => Promise<void>;
  resetToDefault: () => Promise<void>;
}

const defaultTheme: BrandingTheme = {
  primary: '#FF00FF',
  secondary: '#1a1a1a',
  tertiary: '#f0f0f0',
};

const defaultRSVPText: CustomRSVPText = {
  yup: 'Yup',
  nope: 'Nope',
  maybe: 'Maybe',
};

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

export function BrandingProvider({ children, userId }: { children: React.ReactNode; userId?: string }) {
  const [theme, setTheme] = useState<BrandingTheme>(defaultTheme);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [customRSVPText, setCustomRSVPText] = useState<CustomRSVPText>(defaultRSVPText);
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = getSupabaseClient();

  useEffect(() => {
    if (userId) {
      loadBrandingData(userId);
    } else {
      // No user, use defaults
      setTheme(defaultTheme);
      setLogoUrl(null);
      setCustomRSVPText(defaultRSVPText);
      setIsPremium(false);
      setIsLoading(false);
    }
  }, [userId]);

  // Apply theme colors to CSS variables whenever theme changes
  useEffect(() => {
    const applyThemeColors = () => {
      if (!theme) return;

      // Convert hex colors to HSL for CSS variables
      const hexToHsl = (hex: string) => {
        // Remove hash if present
        hex = hex.replace('#', '');
        
        // Convert hex to RGB
        const r = parseInt(hex.substr(0, 2), 16) / 255;
        const g = parseInt(hex.substr(2, 2), 16) / 255;
        const b = parseInt(hex.substr(4, 2), 16) / 255;

        // Convert RGB to HSL
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h = 0, s = 0, l = (max + min) / 2;

        if (max !== min) {
          const d = max - min;
          s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
          
          switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
          }
          h /= 6;
        }

        return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
      };

      // Apply primary color (buttons, accents, borders)
      if (theme.primary) {
        const primaryHsl = hexToHsl(theme.primary);
        document.documentElement.style.setProperty('--primary', primaryHsl);
        document.documentElement.style.setProperty('--ring', primaryHsl);
        document.documentElement.style.setProperty('--primary-color', theme.primary);
      }

      // Apply secondary color (main background)
      if (theme.secondary) {
        const secondaryHsl = hexToHsl(theme.secondary);
        document.documentElement.style.setProperty('--background', secondaryHsl);
        document.documentElement.style.setProperty('--card', secondaryHsl);
        document.documentElement.style.setProperty('--page-background', theme.secondary);
        document.documentElement.style.setProperty('--secondary-color', theme.secondary);
      }

      // Apply tertiary color (text/foreground)
      if (theme.tertiary) {
        const tertiaryHsl = hexToHsl(theme.tertiary);
        document.documentElement.style.setProperty('--foreground', tertiaryHsl);
        document.documentElement.style.setProperty('--card-foreground', tertiaryHsl);
        document.documentElement.style.setProperty('--tertiary-color', theme.tertiary);
      }

      console.log('[Branding] Applied theme colors to CSS variables:', theme);
    };

    applyThemeColors();
  }, [theme]);

  const loadBrandingData = async (userId: string) => {
    try {
      setIsLoading(true);
      console.log('[Branding] Loading branding data for user:', userId);

      const { data: userProfile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('[Branding] Error loading user profile:', error);
        // Use defaults if no profile found
        setTheme(defaultTheme);
        setLogoUrl(null);
        setCustomRSVPText(defaultRSVPText);
        setIsPremium(false);
      } else {
        console.log('[Branding] User profile loaded:', userProfile);

        // Load theme
        const loadedTheme = {
          primary: userProfile.brand_primary_color || defaultTheme.primary,
          secondary: userProfile.brand_secondary_color || defaultTheme.secondary,
          tertiary: userProfile.brand_tertiary_color || defaultTheme.tertiary,
        };

        // Load custom RSVP text
        const loadedRSVPText = {
          yup: userProfile.custom_yup_text || defaultRSVPText.yup,
          nope: userProfile.custom_nope_text || defaultRSVPText.nope,
          maybe: userProfile.custom_maybe_text || defaultRSVPText.maybe,
        };

        // Check premium status from multiple fields
        const premiumStatus = userProfile.is_premium || userProfile.is_pro || false;

        // Only apply custom branding if user is premium, otherwise use defaults
        if (premiumStatus) {
          console.log('[Branding] User is premium - applying custom branding');
          setTheme(loadedTheme);
          setLogoUrl(userProfile.logo_url || null);
          setCustomRSVPText(loadedRSVPText);
        } else {
          console.log('[Branding] User is not premium - using default branding (custom branding saved in DB but not applied)');
          setTheme(defaultTheme);
          setLogoUrl(null);
          setCustomRSVPText(defaultRSVPText);
        }
        
        setIsPremium(premiumStatus);

        console.log('[Branding] Branding data loaded:', {
          theme: premiumStatus ? loadedTheme : defaultTheme,
          logoUrl: premiumStatus ? (userProfile.logo_url || null) : null,
          customRSVPText: premiumStatus ? loadedRSVPText : defaultRSVPText,
          isPremium: premiumStatus,
          savedInDb: { // This shows what's saved in DB regardless of premium status
            theme: loadedTheme,
            logoUrl: userProfile.logo_url,
            customRSVPText: loadedRSVPText,
          }
        });
      }
    } catch (error) {
      console.error('[Branding] Error loading branding data:', error);
      // Use defaults on error
      setTheme(defaultTheme);
      setLogoUrl(null);
      setCustomRSVPText(defaultRSVPText);
      setIsPremium(false);
    } finally {
      setIsLoading(false);
    }
  };

  const updateTheme = async (newTheme: Partial<BrandingTheme>) => {
    if (!userId) {
      throw new Error('User not authenticated');
    }

    if (!isPremium) {
      throw new Error('Premium subscription required to customize branding');
    }

    try {
      console.log('[Branding] Updating theme:', newTheme);

      const updateData: any = {};
      if (newTheme.primary) updateData.brand_primary_color = newTheme.primary;
      if (newTheme.secondary) updateData.brand_secondary_color = newTheme.secondary;
      if (newTheme.tertiary) updateData.brand_tertiary_color = newTheme.tertiary;

      const { error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId);

      if (error) {
        console.error('[Branding] Error updating theme:', error);
        throw error;
      }

      // Update local state
      setTheme(prevTheme => ({ ...prevTheme, ...newTheme }));
      console.log('[Branding] Theme updated successfully');
    } catch (error) {
      console.error('[Branding] Failed to update theme:', error);
      throw error;
    }
  };

  const updateLogo = async (newLogoUrl: string) => {
    if (!userId) {
      throw new Error('User not authenticated');
    }

    if (!isPremium) {
      throw new Error('Premium subscription required to customize branding');
    }

    try {
      console.log('[Branding] Updating logo:', newLogoUrl);

      const { error } = await supabase
        .from('users')
        .update({ logo_url: newLogoUrl })
        .eq('id', userId);

      if (error) {
        console.error('[Branding] Error updating logo:', error);
        throw error;
      }

      // Update local state
      setLogoUrl(newLogoUrl);
      console.log('[Branding] Logo updated successfully');
    } catch (error) {
      console.error('[Branding] Failed to update logo:', error);
      throw error;
    }
  };

  const updateCustomRSVPText = async (newText: Partial<CustomRSVPText>) => {
    if (!userId) {
      throw new Error('User not authenticated');
    }

    if (!isPremium) {
      throw new Error('Premium subscription required to customize branding');
    }

    try {
      console.log('[Branding] Updating RSVP text:', newText);

      const updateData: any = {};
      if (newText.yup !== undefined) updateData.custom_yup_text = newText.yup;
      if (newText.nope !== undefined) updateData.custom_nope_text = newText.nope;
      if (newText.maybe !== undefined) updateData.custom_maybe_text = newText.maybe;

      const { error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId);

      if (error) {
        console.error('[Branding] Error updating RSVP text:', error);
        throw error;
      }

      // Update local state
      setCustomRSVPText(prevText => ({ ...prevText, ...newText }));
      console.log('[Branding] RSVP text updated successfully');
    } catch (error) {
      console.error('[Branding] Failed to update RSVP text:', error);
      throw error;
    }
  };

  const resetToDefault = async () => {
    if (!userId) {
      throw new Error('User not authenticated');
    }

    if (!isPremium) {
      throw new Error('Premium subscription required to customize branding');
    }

    try {
      console.log('[Branding] Resetting to default');

      const { error } = await supabase
        .from('users')
        .update({
          brand_primary_color: defaultTheme.primary,
          brand_secondary_color: defaultTheme.secondary,
          brand_tertiary_color: defaultTheme.tertiary,
          logo_url: null,
          custom_yup_text: defaultRSVPText.yup,
          custom_nope_text: defaultRSVPText.nope,
          custom_maybe_text: defaultRSVPText.maybe,
        })
        .eq('id', userId);

      if (error) {
        console.error('[Branding] Error resetting to default:', error);
        throw error;
      }

      // Update local state
      setTheme(defaultTheme);
      setLogoUrl(null);
      setCustomRSVPText(defaultRSVPText);
      console.log('[Branding] Reset to default successfully');
    } catch (error) {
      console.error('[Branding] Failed to reset to default:', error);
      throw error;
    }
  };

  const value: BrandingContextType = {
    theme,
    logoUrl,
    customRSVPText,
    isPremium,
    isLoading,
    updateTheme,
    updateLogo,
    updateCustomRSVPText,
    resetToDefault,
  };

  return <BrandingContext.Provider value={value}>{children}</BrandingContext.Provider>;
}

export function useBranding() {
  const context = useContext(BrandingContext);
  if (context === undefined) {
    throw new Error('useBranding must be used within a BrandingProvider');
  }
  return context;
}
