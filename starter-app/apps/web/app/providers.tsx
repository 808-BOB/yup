"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { AuthProvider, useAuth } from "@/utils/auth-context";
import { BrandingProvider } from "@/contexts/BrandingContext";
import { AuthRecovery } from "@/utils/auth-recovery";

function InnerProviders({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname();

  // Public, mostly-static pages – no branding needed
  const publicPaths = ["/", "/terms", "/privacy", "/phone-verification-demo", "/sms/opt-out"];
  if (publicPaths.includes(pathname)) {
    return <>{children}</>;
  }

  // All other pages: wrap with branding provider
  return (
    <BrandingProvider userId={user?.id}>
      <AuthRecovery />
      {children as any}
    </BrandingProvider>
  );
}

export default function Providers({ children }: { children: React.ReactNode }) {
  // Always wrap with AuthProvider to maintain continuous auth state
  return (
    <AuthProvider>
      <InnerProviders>{children as any}</InnerProviders>
    </AuthProvider>
  );
}
