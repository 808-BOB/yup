import useSWR from 'swr';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/utils/auth-context';

const fetchUnrespondedCount = async () => {
  // Get the access token from Supabase
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    return 0;
  }

  const response = await fetch('/api/events/invited', {
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
    },
  });
  
  if (!response.ok) {
    return 0;
  }
  
  const data = await response.json();
  return data.unresponded_count || 0;
};

export function useUnrespondedCount() {
  const { user } = useAuth();
  
  const { data: count, error, mutate } = useSWR<number>(
    user ? `unresponded-invitations-count-${user.id}` : null,
    fetchUnrespondedCount,
    {
      refreshInterval: 30000, // Refresh every 30 seconds
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );

  return {
    count: count || 0,
    isLoading: !error && count === undefined,
    error,
    refresh: mutate,
  };
}
