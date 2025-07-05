"use client";

import { AuthProvider } from "@/utils/auth-context";
import { BrandingProvider } from "@/contexts/BrandingContext";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <BrandingProvider>
        {children}
      </BrandingProvider>
    </AuthProvider>
  );
}
