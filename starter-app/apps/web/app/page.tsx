"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/utils/auth-context";

export default function HomePage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && user) {
      // Auth is guaranteed by middleware, so we only need to check phone verification
      // Check if user needs phone verification
      if (!(user as any).phone_number || (user as any).phone_number?.trim() === '') {
        router.replace("/phone-verification");
      } else {
        router.replace("/my-events");
      }
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return null;
} 