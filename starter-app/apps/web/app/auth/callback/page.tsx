"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/utils/auth-context";

export default function OAuthCallback() {
  const router = useRouter();
  const { user, isLoading, error } = useAuth();

  useEffect(() => {
    console.log('[OAuthCallback] Current URL:', window.location.href);
    
    // Check for OAuth errors in URL
    const urlParams = new URLSearchParams(window.location.search);
    const oauthError = urlParams.get('error');
    const errorDescription = urlParams.get('error_description');
    
    if (oauthError) {
      console.error('[OAuthCallback] OAuth error from URL:', oauthError, errorDescription);
      router.replace(`/auth/login?error=${oauthError}`);
      return;
    }
    
    console.log('[OAuthCallback] No OAuth errors, waiting for auth state...');
  }, [router]);

  // Handle redirect once auth state is determined
  useEffect(() => {
    // Wait for auth context to finish loading
    if (isLoading) {
      console.log('[OAuthCallback] Auth still loading...');
      return;
    }
    
    // Check for auth context errors
    if (error) {
      console.error('[OAuthCallback] Auth context error:', error);
      router.replace(`/auth/login?error=auth_error`);
      return;
    }
    
    // Redirect based on auth state
    if (user) {
      console.log('[OAuthCallback] User authenticated successfully:', user.email);
      router.replace('/my-events');
    } else {
      console.log('[OAuthCallback] No user found after auth completion');
      router.replace('/auth/login?error=no_session');
    }
  }, [user, isLoading, error, router]);

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center text-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p>
          {isLoading ? "Completing sign-in..." : "Redirecting..."}
        </p>
        {error && (
          <p className="text-red-400 text-sm mt-2">
            Authentication error: {error}
          </p>
        )}
      </div>
    </div>
  );
}
