"use client";

import React, { createContext, useContext, ReactNode, useMemo, useCallback, useState, useEffect } from 'react';
import { useUserDataManager } from '../hooks/useUserDataManager'; // Expected to exist and be correct
import {
  setLastRoleUsed,
  setLastViewVisitedBuyer,
  setLastViewVisitedWorker,
  clearUserPreferencesFromLocalStorage,
} from '../utils/userStorage'; // Expected to exist and be correct
import { signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from '../lib/firebase/clientApp';
import { User as FirebaseUser } from "firebase/auth";
import { useFirebaseAuth } from "../hooks/useFirebaseAuth";
import { handleUpdateUserContextLogic, UpdateUserContextUpdates } from '../utils/userContextUtils';
import { updateUserAppContext } from "@/app/actions/update-user-app-context";
import { updateUserProfile } from "../lib/firebase/firestore";

export interface ExtendedUser extends FirebaseUser {
  appRole?: "ADMIN" | "SUPER_ADMIN" | "QA" | "USER";
  lastRoleUsed?: "BUYER" | "GIG_WORKER";
  // isBuyer?: boolean; // Covered by canBeBuyer
  // isGigWorker?: boolean; // Covered by canBeGigWorker
  isAuthenticated: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isQA: boolean;
  isBuyerMode: boolean; // Based on lastRoleUsed
  isWorkerMode: boolean; // Based on lastRoleUsed
  canBeBuyer: boolean;
  canBeGigWorker: boolean;
  lastViewVisitedBuyer: string | null;
  lastViewVisitedWorker: string | null;
}

interface UserContextType {
  user: ExtendedUser | null;
  loading: boolean;
  error: Error | null;
  didLoadFromCache?: boolean;
  refetchUser: () => Promise<void>;
  updateUserContext: (updates: {
    lastRoleUsed?: "BUYER" | "GIG_WORKER";
    lastViewVisited?: string;
  }) => Promise<{ ok: boolean; error?: string | unknown }>;
  signOutUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const { user: firebaseUser, idToken } = useFirebaseAuth();
  const {
    user, // This is the authoritative user state from the hook
    loading,
    error,
    didLoadFromCache,
    forceReloadUser // This is the function to call to refetch/revalidate user data
  } = useUserDataManager({ firebaseUser, idToken });

  // Local state for optimistic updates in updateUserContext
  const [localOptimisticUser, setLocalOptimisticUser] = useState<ExtendedUser | null>(user);

  useEffect(() => {
    // Keep localOptimisticUser in sync with the authoritative user from the hook
    setLocalOptimisticUser(user);
  }, [user]);

  const updateUserContext = useCallback(async (updates: UpdateUserContextUpdates) => {
    return handleUpdateUserContextLogic(
      updates,
      localOptimisticUser,
      idToken,
      updateUserAppContext, // Pass the imported server action
      updateUserProfile,    // Pass the imported Firestore utility
      { setLastRoleUsed, setLastViewVisitedBuyer, setLastViewVisitedWorker }, // Pass imported storage setters
      setLocalOptimisticUser, // Pass the state setter for optimistic updates
      forceReloadUser         // Pass the function from useUserDataManager
    );
  }, [
    localOptimisticUser, 
    idToken, 
    forceReloadUser, 
    setLocalOptimisticUser 
    // updateUserAppContext, updateUserProfile, and storage setters are assumed to be stable imports
  ]);

  const signOutUser = useCallback(async () => {
    if (!auth) {
      console.error("Firebase auth instance not available for sign out.");
      return;
    }
    try {
      await firebaseSignOut(auth);
      // User state (user, loading, error) will update automatically via useUserDataManager
      // because firebaseUser from useFirebaseAuth will become null.
      // useUserDataManager should handle clearing its own session cache.
      clearUserPreferencesFromLocalStorage(); // Clear preferences stored in localStorage.
      console.log("UserContext: Sign out initiated. Local preferences cleared.");
    } catch (err) {
      console.error("Error signing out from UserContext:", err);
      // setError(err instanceof Error ? err : new Error("Sign out failed")); // Error state is managed by useUserDataManager
    }
  }, []); // auth is stable, no other dependencies from UserProvider's scope

  const contextValue = useMemo(() => ({
    user: localOptimisticUser, // Provide the optimistically updated user for immediate UI feedback
    loading,
    error,
    didLoadFromCache,
    refetchUser: forceReloadUser, // Expose the hook's reload function
    updateUserContext,
    signOutUser,
  }), [localOptimisticUser, loading, error, didLoadFromCache, forceReloadUser, updateUserContext, signOutUser]);

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
