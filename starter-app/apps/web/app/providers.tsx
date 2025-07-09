"use client";

import React from "react";
import { AuthProvider, useAuth } from "@/utils/auth-context";
import { BrandingProvider } from "@/contexts/BrandingContext";

function InnerProviders({ children }: { children: any }) {
  const { user } = useAuth();
  
  return (
    <BrandingProvider userId={user?.id}>
      {children}
    </BrandingProvider>
  );
}

export default function Providers({ children }: { children: any }) {
  return (
    <AuthProvider>
      <InnerProviders>
        {children}
      </InnerProviders>
    </AuthProvider>
  );
}
