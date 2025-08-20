"use client";

// Utility to sync user subscription status from Stripe
export async function syncUserSubscription(): Promise<{ success: boolean; error?: string; data?: any }> {
  try {
    const response = await fetch('/api/stripe/sync-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log('✅ Subscription synced successfully:', data.updatedPlan);
      
      // Trigger a custom event to notify components of subscription change
      window.dispatchEvent(new CustomEvent('subscription-updated', { 
        detail: data 
      }));
      
      return { success: true, data };
    } else {
      console.warn('⚠️ Subscription sync failed:', data.error);
      return { success: false, error: data.error };
    }
  } catch (error: any) {
    console.error('❌ Subscription sync error:', error);
    return { success: false, error: error.message };
  }
}

// Debounced sync to prevent multiple rapid calls
let syncTimeout: NodeJS.Timeout | null = null;

export function debouncedSyncSubscription(delay: number = 2000) {
  if (syncTimeout) {
    clearTimeout(syncTimeout);
  }
  
  syncTimeout = setTimeout(() => {
    syncUserSubscription();
    syncTimeout = null;
  }, delay);
}
