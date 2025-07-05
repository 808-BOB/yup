"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function OAuthCallback() {
  const router = useRouter();

  useEffect(() => {
    console.log('[OAuthCallback] current URL', window.location.href);
    // AuthContext will pick up the session; redirect user to events or profile
    console.log('[OAuthCallback] redirecting to /my-events');
    router.replace("/my-events");
  }, [router]);

  return <p className="min-h-screen flex items-center justify-center">Signing you in…</p>;
}
