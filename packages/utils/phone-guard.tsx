"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/utils/auth-context";

interface PhoneGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export function PhoneGuard({ children, redirectTo = "/phone-verification" }: PhoneGuardProps) {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        // Not authenticated, redirect to login
        window.location.href = "/auth?mode=login";
        return;
      }

      // Check if user needs phone verification
      if (!user.phone_number || user.phone_number.trim() === '') {
        window.location.href = redirectTo;
        return;
      }
    }
  }, [user, isLoading, router, redirectTo]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Don't render children until we confirm user is authenticated and has phone
  if (!user || !user.phone_number || user.phone_number.trim() === '') {
    return null;
  }

  return <>{children}</>;
} 