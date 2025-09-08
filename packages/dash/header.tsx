"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, User, LogOut, LogIn, UserPlus, Palette, Paintbrush, CreditCard, Shield } from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "../ui/dropdown-menu";
import { useAuth } from "../utils/auth-context";
import { useBranding } from "../contexts/BrandingContext";
import { useToast } from "../hooks/use-toast";

// Helper function to ensure text contrast
const getContrastingTextColor = (backgroundColor: string) => {
  // Convert hex to RGB
  const hex = backgroundColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Return white for dark backgrounds, black for light backgrounds
  return luminance < 0.5 ? '#ffffff' : '#000000';
};
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import type { User as SupabaseAuthUser } from "@supabase/supabase-js";

interface UserProfile {
  display_name?: string;
  profile_image_url?: string;
  is_premium?: boolean;
  is_admin?: boolean;
}

type ExtendedUser = SupabaseAuthUser & UserProfile;

const defaultLogo = "/Yup-logo.png";

export default function Header() {
  const { user, logout } = useAuth();
  const branding = useBranding();
  const { toast } = useToast();
  const router = useRouter();

  const displayName = (user as ExtendedUser)?.display_name ?? user?.email ?? "";
  const isPremium = branding.isPremium;
  const isAdmin = Boolean((user as ExtendedUser)?.is_admin);

  // Helper function to determine if a color is light or dark
  const isLightColor = (color: string): boolean => {
    // Convert hex to RGB
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Calculate luminance using relative luminance formula
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5; // Threshold for light vs dark
  };

  // Determine background color (secondary color is the main background)
  const backgroundColor = branding.theme.secondary || '#000000'; // Default dark
  const isLightBackground = isLightColor(backgroundColor);

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logged out",
        description: "You have been logged out successfully.",
      });
              window.location.href = "/auth/login";
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return ""; // Return empty string if name is null or undefined
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="w-full py-6 shadow-md fixed top-0 left-0 right-0 z-[200] bg-black">
      <div className="flex justify-between items-center max-w-xl mx-auto px-6">
      <div className="flex items-center gap-3 flex-1 justify-start">
        {/* Logo - Premium brand logo if available, otherwise YUP logo */}
        <div 
          className="cursor-pointer"
          onClick={() => router.push(user ? "/my-events" : "/")}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              router.push(user ? "/my-events" : "/");
            }
          }}
          tabIndex={0}
          role="button"
          aria-label="Navigate to dashboard"
        >
          {isPremium && branding.logoUrl && branding.logoUrl !== defaultLogo ? (
            <img 
              src={branding.logoUrl} 
              alt="Brand Logo" 
              className="h-6 sm:h-8 w-auto cursor-pointer max-w-[160px] sm:max-w-[200px] object-contain" 
            />
          ) : (
            <img 
              src="/Yup-logo.png" 
              alt="Yup.RSVP" 
              className="h-8 sm:h-10 w-auto cursor-pointer" 
            />
          )}
        </div>
      </div>
        
      <div className="flex items-center gap-4">
        {user && (
          <Button
            variant="default"
            size="sm"
            onClick={() => router.push("/events/create")}
              className="rounded-sm h-8 w-8 p-0 sm:h-10 sm:w-10 hover:opacity-90 text-white"
              style={{
                backgroundColor: branding.theme.primary,
                color: 'white',
                border: 'none'
              }}
          >
            <Plus className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
          </Button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            {user ? (
              <Avatar 
                className="cursor-pointer w-8 h-8"
                style={{
                  border: `2px solid ${branding.theme.primary}`,
                  backgroundColor: branding.theme.secondary
                }}
              >
                <AvatarImage
                  src={(user as ExtendedUser)?.profile_image_url}
                  alt={displayName}
                  className="object-cover"
                />
                <AvatarFallback 
                  className="text-sm"
                  style={{
                    backgroundColor: branding.theme.secondary,
                    color: branding.theme.primary
                  }}
                >
                  {getInitials(displayName)}
                </AvatarFallback>
              </Avatar>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="rounded-sm w-8 h-8 flex items-center justify-center text-white"
                style={{
                  backgroundColor: branding.theme.secondary,
                  border: `2px solid ${branding.theme.primary}`,
                  color: 'white'
                }}
              >
                <User 
                  className="h-4 w-4 text-white" 
                  style={{ color: 'white' }}
                />
              </Button>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            sideOffset={5}
            avoidCollisions={true}
            collisionPadding={8}
            className="w-48 backdrop-blur-sm shadow-2xl"
            style={{
              backgroundColor: branding.theme.secondary + 'F2', // 95% opacity
              borderColor: branding.theme.primary + '66', // 40% opacity
              border: `1px solid ${branding.theme.primary}66`,
              zIndex: 999999,
              position: 'relative',
              '--radix-dropdown-menu-content-z-index': '999999'
            } as React.CSSProperties & { [key: string]: string }}
          >
            {user ? (
              <>
                <div 
                  className="px-2 py-1.5 text-sm font-medium"
                  style={{
                    color: branding.theme.primary,
                    backgroundColor: branding.theme.secondary + '80' // 50% opacity
                  }}
                >
                  {displayName}
                </div>
                <DropdownMenuSeparator style={{ backgroundColor: branding.theme.primary + '33' }} />
                <DropdownMenuItem
                  onClick={() => router.push("/profile")}
                  className="cursor-pointer transition-colors duration-150"
                  style={{
                    color: getContrastingTextColor(branding.theme.secondary),
                    '--hover-bg': branding.theme.primary + '33', // 20% opacity
                    '--hover-color': branding.theme.primary
                  } as React.CSSProperties & { [key: string]: string }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = branding.theme.primary + '33';
                    e.currentTarget.style.color = branding.theme.primary;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = getContrastingTextColor(branding.theme.secondary);
                  }}
                >
                  <User className="mr-2 h-4 w-4" />
                  <span>My Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => router.push("/my-events")}
                  className="cursor-pointer transition-colors duration-150"
                  style={{
                    color: getContrastingTextColor(branding.theme.secondary),
                    '--hover-bg': branding.theme.primary + '33', // 20% opacity
                    '--hover-color': branding.theme.primary
                  } as React.CSSProperties & { [key: string]: string }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = branding.theme.primary + '33';
                    e.currentTarget.style.color = branding.theme.primary;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = getContrastingTextColor(branding.theme.secondary);
                  }}
                >
                  <User className="mr-2 h-4 w-4" />
                  <span>My Events</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => router.push("/upgrade")}
                  className="cursor-pointer transition-colors duration-150"
                  style={{
                    color: getContrastingTextColor(branding.theme.secondary),
                    '--hover-bg': branding.theme.primary + '33', // 20% opacity
                    '--hover-color': branding.theme.primary
                  } as React.CSSProperties & { [key: string]: string }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = branding.theme.primary + '33';
                    e.currentTarget.style.color = branding.theme.primary;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = getContrastingTextColor(branding.theme.secondary);
                  }}
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  <span>Plans</span>
                </DropdownMenuItem>
                {/* Premium users can access branding settings and style guide */}
                {isPremium && (
                  <>
                    <DropdownMenuItem
                      onClick={() => router.push("/branding")}
                      className="cursor-pointer transition-colors duration-150"
                      style={{
                        color: getContrastingTextColor(branding.theme.secondary),
                        '--hover-bg': branding.theme.primary + '33', // 20% opacity
                        '--hover-color': branding.theme.primary
                      } as React.CSSProperties & { [key: string]: string }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = branding.theme.primary + '33';
                        e.currentTarget.style.color = branding.theme.primary;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = getContrastingTextColor(branding.theme.secondary);
                      }}
                    >
                      <Paintbrush className="mr-2 h-4 w-4" />
                      <span>Branding</span>
                    </DropdownMenuItem>

                  </>
                )}
                {/* Admin-only links */}
                {isAdmin && (
                  <DropdownMenuItem
                    onClick={() => router.push("/admin")}
                    className="cursor-pointer transition-colors duration-150"
                    style={{
                      color: getContrastingTextColor(branding.theme.secondary),
                      '--hover-bg': branding.theme.primary + '33', // 20% opacity
                      '--hover-color': branding.theme.primary
                    } as React.CSSProperties & { [key: string]: string }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = branding.theme.primary + '33';
                      e.currentTarget.style.color = branding.theme.primary;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = getContrastingTextColor(branding.theme.secondary);
                    }}
                  >
                    <Shield className="mr-2 h-4 w-4" />
                    <span>Admin Dashboard</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="cursor-pointer transition-colors duration-150"
                  style={{
                    color: getContrastingTextColor(branding.theme.secondary),
                    '--hover-bg': branding.theme.primary + '33', // 20% opacity
                    '--hover-color': branding.theme.primary
                  } as React.CSSProperties & { [key: string]: string }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = branding.theme.primary + '33';
                    e.currentTarget.style.color = branding.theme.primary;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = getContrastingTextColor(branding.theme.secondary);
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log Out</span>
                </DropdownMenuItem>
              </>
            ) : (
              <>
                <DropdownMenuItem
                  onClick={() => router.push("/auth/login")}
                  className="cursor-pointer transition-colors duration-150"
                  style={{
                    color: getContrastingTextColor(branding.theme.secondary),
                    '--hover-bg': branding.theme.primary + '33', // 20% opacity
                    '--hover-color': branding.theme.primary
                  } as React.CSSProperties & { [key: string]: string }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = branding.theme.primary + '33';
                    e.currentTarget.style.color = branding.theme.primary;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = getContrastingTextColor(branding.theme.secondary);
                  }}
                >
                  <LogIn className="mr-2 h-4 w-4" />
                  <span>Log In</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => router.push("/auth/signup")}
                  className="cursor-pointer transition-colors duration-150"
                  style={{
                    color: getContrastingTextColor(branding.theme.secondary),
                    '--hover-bg': branding.theme.primary + '33', // 20% opacity
                    '--hover-color': branding.theme.primary
                  } as React.CSSProperties & { [key: string]: string }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = branding.theme.primary + '33';
                    e.currentTarget.style.color = branding.theme.primary;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = getContrastingTextColor(branding.theme.secondary);
                  }}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  <span>Sign Up</span>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
