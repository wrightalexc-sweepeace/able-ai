"use client";

import { useState, useCallback, useEffect } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { ExtendedUser } from '../context/UserContext'; // Assuming ExtendedUser is exported or moved
import {
  getFirestoreUserByFirebaseUid,
} from '../lib/firebase/firestore';
import { getUserByFirebaseUid } from '../actions/userActions';
import {
  getCachedUser,
  saveUserToCache,
  clearUserCache,
  getLastRoleUsed,
  getLastViewVisitedBuyer,
  getLastViewVisitedWorker,
  getIsQAView,
  CACHE_MAX_AGE_MS,
} from '../utils/userStorage';

interface UseUserDataManagerProps {
  firebaseUser: FirebaseUser | null;
  idToken: string | null;
}

interface UseUserDataManagerReturn {
  user: ExtendedUser | null;
  loading: boolean;
  error: Error | null;
  didLoadFromCache: boolean;
  forceReloadUser: () => Promise<void>;
}

export const useUserDataManager = ({
  firebaseUser,
  idToken,
}: UseUserDataManagerProps): UseUserDataManagerReturn => {
  const [user, setUser] = useState<ExtendedUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [didLoadFromCache, setDidLoadFromCache] = useState(false);

  const loadUserData = useCallback(async (options?: { forceFetch?: boolean }) => {
    let servedFromCache = false;
    if (!options?.forceFetch) {
      const cachedData = getCachedUser();
      if (cachedData && cachedData.user && cachedData.timestamp && (Date.now() - cachedData.timestamp < CACHE_MAX_AGE_MS)) {
        setUser(cachedData.user as ExtendedUser);
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
      const backendUserResult = await getUserByFirebaseUid(firebaseUser.uid, idToken);

      if (backendUserResult.error) {
        console.error("useUserDataManager: Error fetching user by firebaseUid:", backendUserResult.error);
        throw new Error(typeof backendUserResult.error === 'string' ? backendUserResult.error : 'Failed to fetch backend user data');
      }
      const backendUserData = backendUserResult.value;

      const lastRoleUsed = getLastRoleUsed();
      const lastViewVisitedBuyer = getLastViewVisitedBuyer() || backendUserData?.lastViewVisitedBuyer || null;
      const lastViewVisitedWorker = getLastViewVisitedWorker() || backendUserData?.lastViewVisitedWorker || null;
      const isQA = getIsQAView() || backendUserData?.appRole === "QA";

      const extendedUser: ExtendedUser = {
        ...(firebaseUser as FirebaseUser), // Ensure firebaseUser is not null here due to checks above
        appRole: backendUserData?.appRole,
        lastRoleUsed,
        uid: firebaseUser.uid, // Prioritize uid from firebaseUser
        displayName: firebaseUser.displayName,
        email: firebaseUser.email,
        photoURL: firebaseUser.photoURL,
        isAuthenticated: true,
        isAdmin: backendUserData?.appRole === "ADMIN",
        isSuperAdmin: backendUserData?.appRole === "SUPER_ADMIN",
        isQA,
        isBuyerMode: lastRoleUsed === "BUYER",
        isWorkerMode: lastRoleUsed === "GIG_WORKER",
        canBeBuyer: backendUserData?.isBuyer ?? false,
        canBeGigWorker: backendUserData?.isGigWorker ?? false,
        lastViewVisitedBuyer,
        lastViewVisitedWorker,
      };
      setUser(extendedUser);
      saveUserToCache(extendedUser);
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
