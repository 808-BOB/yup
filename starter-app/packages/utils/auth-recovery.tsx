"use client";

import { useEffect } from 'react';
import { useAuth } from './auth-context';

export function AuthRecovery() {
  const { user, session, isLoading, refreshSession } = useAuth();

  useEffect(() => {
    let isRecovering = false;

    // Check for auth state loss when navigating
    const handlePageShow = (event: PageTransitionEvent) => {
      // If page is loaded from cache (back/forward button) and we have no user but should
      if (event.persisted && !user && !isLoading && !isRecovering) {
        isRecovering = true;
        console.log('[AuthRecovery] Page loaded from cache, checking auth state...');
        refreshSession().finally(() => {
          isRecovering = false;
        });
      }
    };

    // Handle browser navigation events
    const handlePopState = () => {
      // Small delay to let the page render, then check auth
      setTimeout(() => {
        if (!user && !isLoading && !isRecovering) {
          isRecovering = true;
          console.log('[AuthRecovery] Navigation detected, checking auth state...');
          refreshSession().finally(() => {
            isRecovering = false;
          });
        }
      }, 50); // Reduced delay for faster recovery
    };

    // Handle focus events (returning to tab) - less aggressive
    const handleFocus = () => {
      // Only recover if we've been away for a while and have no user
      setTimeout(() => {
        if (!user && !isLoading && !isRecovering) {
          isRecovering = true;
          console.log('[AuthRecovery] Window focused after absence, checking auth state...');
          refreshSession().finally(() => {
            isRecovering = false;
          });
        }
      }, 200);
    };

    window.addEventListener('pageshow', handlePageShow);
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('pageshow', handlePageShow);
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('focus', handleFocus);
    };
  }, [user, isLoading, refreshSession]);

  return null; // This component doesn't render anything
}
