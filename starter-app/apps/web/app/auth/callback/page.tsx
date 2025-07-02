"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function OAuthCallback() {
  const router = useRouter();

  useEffect(() => {
    // AuthContext will pick up the session; redirect user to events or profile
    router.replace("/events");
  }, [router]);

  return <p className="min-h-screen flex items-center justify-center">Signing you in…</p>;
} 