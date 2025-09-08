import { useEffect } from 'react';
import { useAuth } from '@/utils/auth-context';
// @ts-ignore - next/navigation types resolved in app environment
import { useRouter } from 'next/navigation';

export function useRequireAuth(redirectPath: string = '/auth?mode=login') {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      window.location.href = redirectPath;
    }
  }, [user, isLoading, redirectPath]);
} 