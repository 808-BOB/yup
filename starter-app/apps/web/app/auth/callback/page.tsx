"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/utils/auth-context";

export default function OAuthCallback() {
  const router = useRouter();
  const { user, isLoading, error } = useAuth();
  const [timeoutReached, setTimeoutReached] = useState(false);
  const [showManualRedirect, setShowManualRedirect] = useState(false);

  useEffect(() => {
    console.log('[OAuthCallback] Current URL:', window.location.href);
    
    // Check for OAuth errors in URL
    const urlParams = new URLSearchParams(window.location.search);
    const oauthError = urlParams.get('error');
    const errorDescription = urlParams.get('error_description');
    const code = urlParams.get('code');
    
    if (oauthError) {
      console.error('[OAuthCallback] OAuth error from URL:', oauthError, errorDescription);
      router.replace(`/auth/login?error=${oauthError}`);
      return;
    }
    
    if (code) {
      console.log('[OAuthCallback] OAuth code received, letting auth context handle exchange');
    } else {
      console.warn('[OAuthCallback] No OAuth code in URL, redirecting to login');
      router.replace('/auth/login?error=no_code');
      return;
    }
    
    console.log('[OAuthCallback] No OAuth errors, waiting for auth state...');
    
    // Set a timeout to prevent infinite loading (increased to 30 seconds)
    const timeout = setTimeout(() => {
      console.warn('[OAuthCallback] Auth callback timeout reached');
      setTimeoutReached(true);
    }, 30000); // 30 second timeout
    
    // Show manual redirect button after 5 seconds
    const manualTimeout = setTimeout(() => {
      setShowManualRedirect(true);
    }, 5000);

    return () => {
      clearTimeout(timeout);
      clearTimeout(manualTimeout);
    };
  }, [router]);

  // Handle redirect once auth state is determined
  useEffect(() => {
    // If timeout reached and still no user, redirect to login
    if (timeoutReached && !user) {
      console.error('[OAuthCallback] Timeout reached without successful auth');
      router.replace('/auth/login?error=timeout');
      return;
    }

    // Wait for auth context to finish loading
    if (isLoading && !timeoutReached) {
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
      
      // Force a small delay to ensure session is fully set, then redirect
      setTimeout(() => {
        router.replace('/my-events');
      }, 100);
    } else if (!isLoading && !timeoutReached) {
      console.log('[OAuthCallback] No user found after auth completion');
      router.replace('/auth/login?error=no_session');
    }
    
    // Fallback: If we've been loading too long, try to proceed anyway
    if (timeoutReached && !error) {
      console.warn('[OAuthCallback] Timeout reached, attempting fallback redirect');
      router.replace('/my-events');
    }
  }, [user, isLoading, error, router, timeoutReached]);

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center text-white max-w-md mx-auto p-8">
        {/* Yup.RSVP Branding */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="text-3xl font-bold">
            <span className="text-white">YUP.</span>
                            <span className="text-[#FF00FF]">RSVP</span>
          </div>
        </div>
        
        {/* Loading Spinner */}
        <div className="relative mb-6">
                          <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-700 border-t-[#FF00FF] mx-auto"></div>
          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-6 h-6 bg-gradient-to-r from-[#FF00FF] to-purple-600 rounded-full opacity-60 animate-pulse"></div>
          </div>
        </div>
        
        {/* Status Message */}
        <div className="space-y-2">
          <p className="text-lg font-medium">
            {timeoutReached ? "Taking longer than expected..." : 
             isLoading ? "Completing sign-in..." : "Redirecting..."}
          </p>
          
          {timeoutReached && (
            <p className="text-gray-400 text-sm">
              If this continues, please try refreshing the page
            </p>
          )}
          
          {showManualRedirect && !user && (
            <button
              onClick={() => router.replace('/my-events')}
              className="mt-4 px-6 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg transition-colors text-sm font-medium"
            >
              Continue to Dashboard
            </button>
          )}
          
          {error && (
            <p className="text-red-400 text-sm mt-4 p-3 bg-red-900/20 rounded-lg border border-red-500/20">
              Authentication error: {error}
            </p>
          )}
        </div>
        
        {/* Progress Indicator */}
        <div className="mt-8">
          <div className="w-full bg-gray-800 rounded-full h-1">
                            <div className="bg-gradient-to-r from-[#FF00FF] to-purple-600 h-1 rounded-full animate-pulse" 
                 style={{ width: timeoutReached ? '90%' : isLoading ? '60%' : '100%' }}>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
