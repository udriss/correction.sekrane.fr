'use client';

import { useState, useEffect } from 'react';

export interface User {
  id: number | string;
  name: string;
  username?: string;
  email?: string;
}

export interface AuthSession {
  user: User | null;
  status: 'loading' | 'authenticated' | 'unauthenticated';
  error?: string | null;
}

/**
 * Custom hook to handle authentication state
 * This works with both your custom auth and NextAuth
 */
export function useAuth(): AuthSession {
  const [session, setSession] = useState<AuthSession>({
    user: null,
    status: 'loading'
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadUser() {
      try {
        // First try the custom auth endpoint
        const customAuthResponse = await fetch('/api/auth/user', { 
          credentials: 'include',
          cache: 'no-store' 
        });
        
        if (customAuthResponse.ok) {
          const data = await customAuthResponse.json();
          if (data.user) {
            setSession({
              user: data.user,
              status: 'authenticated'
            });
            setError(null);
            return;
          }
        }
        
        // If custom auth failed, try the NextAuth compatibility layer
        const nextAuthResponse = await fetch('/api/auth/session', { 
          credentials: 'include',
          cache: 'no-store' 
        });
        
        const data = await nextAuthResponse.json();
        
        if (data.user) {
          setSession({
            user: data.user,
            status: 'authenticated'
          });
          setError(null);
        } else {
          setSession({
            user: null, 
            status: 'unauthenticated'
          });
          setError('User not authenticated');
        }
      } catch (error) {
        console.error('Error loading user:', error);
        setSession({
          user: null,
          status: 'unauthenticated'
        });
        setError((error as Error).message || 'Failed to check authentication');
      }
    }
    
    loadUser();
  }, []);

  return {
    ...session,
    error
  };
}

export default useAuth;
