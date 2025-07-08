"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/utils/auth-context";
import { supabase } from "@/lib/supabase";

export default function OAuthCallback() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    console.log('[OAuthCallback] current URL', window.location.href);
    
    const handleOAuthCallback = async () => {
      try {
        // Get the code from the URL
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const error = urlParams.get('error');
        
        if (error) {
          console.error('[OAuthCallback] OAuth error:', error);
          router.replace("/auth?mode=login&error=" + error);
          return;
        }
        
        if (code) {
          console.log('[OAuthCallback] Exchanging code for session');
          
          // Exchange code for session
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          
          if (exchangeError) {
            console.error('[OAuthCallback] Error exchanging code:', exchangeError);
            router.replace("/auth?mode=login&error=exchange_failed");
            return;
          }
          
          console.log('[OAuthCallback] Session established successfully:', data.user?.id);
        } else {
          console.log('[OAuthCallback] No code parameter found');
        }
        
        // Give the auth context a moment to update
        setTimeout(() => {
          setProcessing(false);
        }, 1000);
        
      } catch (err) {
        console.error('[OAuthCallback] Exception handling callback:', err);
        router.replace("/auth?mode=login&error=callback_error");
      }
    };

    handleOAuthCallback();
  }, [router]);

  // Handle redirect after processing
  useEffect(() => {
    if (!processing && !isLoading) {
      if (user) {
        // Check if user needs phone verification
        if (!user.phone_number || user.phone_number.trim() === '') {
          console.log('[OAuthCallback] User authenticated, needs phone verification');
          router.replace("/phone-verification");
        } else {
          console.log('[OAuthCallback] User authenticated, redirecting to /my-events');
          router.replace("/my-events");
        }
      } else {
        // No user found after processing
        console.log('[OAuthCallback] No user found after processing, redirecting to auth');
        router.replace("/auth?mode=login&error=no_user");
      }
    }
  }, [processing, isLoading, user, router]);

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center text-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p>
          {processing ? "Processing sign-in..." : "Signing you in…"}
        </p>
      </div>
    </div>
  );
}
