import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';

export function useRequireAuth(redirectPath: string = '/auth?mode=login') {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation(redirectPath);
    }
  }, [user, isLoading, redirectPath, setLocation]);
} 