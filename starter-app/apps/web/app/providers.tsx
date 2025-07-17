"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { AuthProvider, useAuth } from "@/utils/auth-context";
import { BrandingProvider } from "@/contexts/BrandingContext";

function InnerProviders({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  return <BrandingProvider userId={user?.id}>{children as any}</BrandingProvider>;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Public, mostly-static pages – no auth/branding needed
  const publicPaths = ["/", "/terms", "/privacy", "/phone-verification-demo", "/sms/opt-out"];
  if (publicPaths.includes(pathname)) {
    return <>{children}</>;
  }

  // All other pages: wrap with Auth & Branding providers
  return (
    <AuthProvider>
      <InnerProviders>{children as any}</InnerProviders>
    </AuthProvider>
  );
}
