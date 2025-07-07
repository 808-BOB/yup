"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, User, LogOut, LogIn, UserPlus, Palette, Paintbrush, CreditCard, Shield } from "lucide-react";
import { Button } from "../ui/button";
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

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logged out",
        description: "You have been logged out successfully.",
      });
      router.push("/auth/login");
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
    <header className="container flex justify-between items-center mb-6 py-3 px-4 border-b border-gray-800 sticky top-0 z-50 bg-gray-950">
      <div className="flex items-center gap-3">
        {/* YUP Logo */}
        <img
          src={defaultLogo}
          alt="Yup.RSVP"
          className="h-6 sm:h-8 w-auto max-w-[120px] sm:max-w-[144px] object-contain cursor-pointer"
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
        />

        {/* Separator and Brand Logo (for premium users with custom logos) */}
        {isPremium && branding.logoUrl && branding.logoUrl !== defaultLogo && (
          <>
            <div className="w-px h-6 sm:h-8 bg-gray-600"></div>
            <img
              src={branding.logoUrl}
              alt="Brand Logo"
              className="h-6 sm:h-8 w-auto max-w-[120px] sm:max-w-[144px] object-contain"
            />
          </>
        )}
      </div>
      <div className="flex items-center gap-4">
        {user && (
          <Button
            variant="default"
            size="sm"
            onClick={() => router.push("/events/create")}
            className="bg-primary text-white hover:bg-primary/90 hover:text-white rounded-sm h-8 w-8 p-0 sm:h-10 sm:w-10"
          >
            <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            {user ? (
              <Avatar className="cursor-pointer border border-primary w-8 h-8 bg-gray-900">
                <AvatarImage
                  src={(user as ExtendedUser)?.profile_image_url}
                  alt={displayName}
                  className="object-cover"
                />
                <AvatarFallback className="bg-gray-900 text-primary text-sm">
                  {getInitials(displayName)}
                </AvatarFallback>
              </Avatar>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="rounded-sm bg-gray-900 border border-primary w-8 h-8 flex items-center justify-center"
              >
                <User className="h-4 w-4 text-primary" />
              </Button>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-48 bg-gray-900/95 backdrop-blur-sm border border-gray-700 shadow-2xl"
          >
            {user ? (
              <>
                <div className="px-2 py-1.5 text-sm font-medium text-white bg-gray-800/50">
                  {displayName}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => router.push("/profile")}
                  className="cursor-pointer text-gray-200 hover:bg-gray-800/70 hover:text-white focus:bg-gray-800/70 focus:text-white"
                >
                  <User className="mr-2 h-4 w-4" />
                  <span>My Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => router.push("/my-events")}
                  className="cursor-pointer text-gray-200 hover:bg-gray-800/70 hover:text-white focus:bg-gray-800/70 focus:text-white"
                >
                  <User className="mr-2 h-4 w-4" />
                  <span>My Events</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => router.push("/upgrade")}
                  className="cursor-pointer text-gray-200 hover:bg-gray-800/70 hover:text-white focus:bg-gray-800/70 focus:text-white"
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  <span>Plans</span>
                </DropdownMenuItem>
                {/* Premium users can access branding settings and style guide */}
                {isPremium && (
                  <>
                    <DropdownMenuItem
                      onClick={() => router.push("/branding")}
                      className="cursor-pointer text-gray-200 hover:bg-gray-800/70 hover:text-white focus:bg-gray-800/70 focus:text-white"
                    >
                      <Paintbrush className="mr-2 h-4 w-4" />
                      <span>Branding</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => router.push("/style-guide")}
                      className="cursor-pointer text-gray-200 hover:bg-gray-800/70 hover:text-white focus:bg-gray-800/70 focus:text-white"
                    >
                      <Palette className="mr-2 h-4 w-4" />
                      <span>Style Guide</span>
                    </DropdownMenuItem>
                  </>
                )}
                {/* Admin-only links */}
                {isAdmin && (
                  <DropdownMenuItem
                    onClick={() => router.push("/admin")}
                    className="cursor-pointer text-gray-200 hover:bg-gray-800/70 hover:text-white focus:bg-gray-800/70 focus:text-white"
                  >
                    <Shield className="mr-2 h-4 w-4" />
                    <span>Admin Dashboard</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="cursor-pointer text-gray-200 hover:bg-gray-800/70 hover:text-white focus:bg-gray-800/70 focus:text-white"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log Out</span>
                </DropdownMenuItem>
              </>
            ) : (
              <>
                <DropdownMenuItem
                  onClick={() => router.push("/auth/login")}
                  className="cursor-pointer text-gray-200 hover:bg-gray-800/70 hover:text-white focus:bg-gray-800/70 focus:text-white"
                >
                  <LogIn className="mr-2 h-4 w-4" />
                  <span>Log In</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => router.push("/auth/signup")}
                  className="cursor-pointer text-gray-200 hover:bg-gray-800/70 hover:text-white focus:bg-gray-800/70 focus:text-white"
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  <span>Sign Up</span>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
