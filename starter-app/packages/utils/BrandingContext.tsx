"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./auth-context";
import { supabase } from "@/lib/supabase";
import { getAccessibleTextColor } from '@/hooks/use-accessible-colors';
const defaultLogo = "/Yup-logo.png";
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

interface Theme {
  primary: string;
  background: string;
}

interface BrandingContextType {
  theme: Theme;
  logoUrl: string | null;
  isPremium: boolean;
  updateTheme: (theme: Theme) => Promise<void>;
  updateLogo: (url: string) => Promise<void>;
}

const defaultTheme: Theme = {
  primary: "hsl(308, 100%, 66%)",
  background: "hsl(222, 84%, 5%)",
};

const BrandingContext = createContext<BrandingContextType>({
  theme: defaultTheme,
  logoUrl: null,
  isPremium: false,
  updateTheme: async () => {},
  updateLogo: async () => {},
});

export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [theme, setTheme] = useState<Theme>(defaultTheme);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    async function loadBranding() {
      if (!user) {
        setTheme(defaultTheme);
        setLogoUrl(null);
        setIsPremium(false);
        return;
      }

      const { data, error } = await supabase
        .from("users")
        .select("brand_theme, logo_url, is_premium")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error loading branding:", error);
        return;
      }

      if (data) {
        try {
          if (data.brand_theme) {
            const parsedTheme = JSON.parse(data.brand_theme);
            setTheme(parsedTheme);
          }
          setLogoUrl(data.logo_url || null);
          setIsPremium(data.is_premium || false);
        } catch (e) {
          console.error("Error parsing theme:", e);
        }
      }
    }

    loadBranding();
  }, [user]);

  const updateTheme = async (newTheme: Theme) => {
    if (!user) return;

    const { error } = await supabase
      .from("users")
      .update({ brand_theme: JSON.stringify(newTheme) })
      .eq("id", user.id);

    if (error) {
      throw error;
    }

    setTheme(newTheme);
  };

  const updateLogo = async (url: string) => {
    if (!user) return;

    const { error } = await supabase
      .from("users")
      .update({ logo_url: url })
      .eq("id", user.id);

    if (error) {
      throw error;
    }

    setLogoUrl(url);
  };

  return (
    <BrandingContext.Provider
      value={{
        theme,
        logoUrl,
        isPremium,
        updateTheme,
        updateLogo,
      }}
    >
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding() {
  return useContext(BrandingContext);
}

export function getLogoUrl(branding: BrandingContextType) {
  return branding.logoUrl || "/Yup-logo.png";
}