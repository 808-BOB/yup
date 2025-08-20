"use client";

import { useEffect, useRef } from 'react';
import { useAuth } from '@/utils/auth-context';
import { debouncedSyncSubscription } from '@/utils/subscription-sync';

export function useSubscriptionSync() {
  const { user } = useAuth();
  const hasRunSync = useRef(false);

  useEffect(() => {
    // Only sync once per page load and only for authenticated users
    if (user && !hasRunSync.current) {
      console.log('[useSubscriptionSync] Auto-syncing subscription for dashboard visit...');
      debouncedSyncSubscription(1500); // 1.5 second delay for dashboard visits
      hasRunSync.current = true;
    }
    
    // Reset the flag when user changes (logout/login)
    if (!user) {
      hasRunSync.current = false;
    }
  }, [user]);

  // Return a manual sync function that components can call
  const manualSync = () => {
    if (user) {
      console.log('[useSubscriptionSync] Manual sync triggered...');
      debouncedSyncSubscription(500); // Faster for manual triggers
    }
  };

  return { manualSync };
}
