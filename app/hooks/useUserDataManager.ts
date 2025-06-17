"use client";

import { useState, useCallback, useEffect } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import {
  getCachedUser,
  clearUserCache,
  CACHE_MAX_AGE_MS,
} from '../utils/userStorage';
import { User } from '@/context/AuthContext';

interface UseUserDataManagerProps {
  firebaseUser: FirebaseUser | null;
  idToken: string | null;
}

interface UseUserDataManagerReturn {
  user: User | null;
  loading: boolean;
  error: Error | null;
  didLoadFromCache: boolean;
  forceReloadUser: () => Promise<void>;
}

export const useUserDataManager = ({
  firebaseUser,
  idToken,
}: UseUserDataManagerProps): UseUserDataManagerReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [didLoadFromCache, setDidLoadFromCache] = useState(false);

  const loadUserData = useCallback(async (options?: { forceFetch?: boolean }) => {
    let servedFromCache = false;
    if (!options?.forceFetch) {
      const cachedData = getCachedUser();
      if (cachedData && cachedData.user && cachedData.timestamp && (Date.now() - cachedData.timestamp < CACHE_MAX_AGE_MS)) {
        setUser(cachedData.user);
        setLoading(false);
        setDidLoadFromCache(true);
        servedFromCache = true;
        console.log('useUserDataManager: Loaded user from session cache.');
      } else if (cachedData) {
        clearUserCache();
        console.log('useUserDataManager: Cleared stale user session cache.');
      }
    }

    if (!firebaseUser?.uid || !idToken) {
      setUser(null);
      setLoading(false);
      setDidLoadFromCache(false);
      clearUserCache(); // Ensure cache is cleared if user is not authenticated
      return;
    }

    if (!servedFromCache) {
      setLoading(true);
      setDidLoadFromCache(false);
    }
    setError(null);

    try {
      console.log('useUserDataManager: Saved user to session cache.');
    } catch (err) {
      console.error("useUserDataManager: Error in loadUserData:", err);
      setError(err instanceof Error ? err : new Error('An unknown error occurred'));
      setUser(null); // Clear user on error
    } finally {
      setLoading(false);
    }
  }, [firebaseUser, idToken]);

  useEffect(() => {
    loadUserData({ forceFetch: false });
  }, [loadUserData]);

  const forceReloadUser = useCallback(async () => {
    await loadUserData({ forceFetch: true });
  }, [loadUserData]);

  return { user, loading, error, didLoadFromCache, forceReloadUser };
};
