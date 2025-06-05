"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { signOut as firebaseSignOut } from 'firebase/auth'; // Renamed to avoid conflict if any
import { auth } from '../lib/firebase/clientApp'; // Assuming this is the correct path to your Firebase auth instance
import { User as FirebaseUser } from "firebase/auth";
import { useFirebaseAuth } from "../hooks/useFirebaseAuth"; // Adjusted path
import { updateUserAppContext } from "@/app/actions/update-user-app-context";
import {
  getFirestoreUserByFirebaseUid,
  updateUserProfile,
} from "../lib/firebase/firestore"; // Adjusted path
import { getUserByFirebaseUid } from "../actions/userActions"; // Adjusted path

export interface ExtendedUser extends FirebaseUser {
  appRole?: "ADMIN" | "SUPER_ADMIN" | "QA" | "USER";
  lastRoleUsed?: "BUYER" | "GIG_WORKER";
  isBuyer?: boolean;
  isGigWorker?: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isQA: boolean;
  isBuyerMode: boolean; // Based on lastRoleUsed
  isWorkerMode: boolean; // Based on lastRoleUsed
  canBeBuyer: boolean; // User *can* be a buyer
  canBeGigWorker: boolean; // User *can* be a worker
  lastViewVisitedBuyer: string | null;
  lastViewVisitedWorker: string | null;
}

interface UserContextType {
  user: ExtendedUser | null;
  loading: boolean;
  error: Error | null;
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
  const [user, setUser] = useState<ExtendedUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const loadUser = useCallback(async () => {
    if (!firebaseUser?.uid || !idToken) {
      setUser(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const firestoreUserPromise = getFirestoreUserByFirebaseUid(firebaseUser.uid);
      const backendUserPromise = getUserByFirebaseUid(firebaseUser.uid, idToken);

      const [firestoreUserData, backendUserResult] = await Promise.all([
        firestoreUserPromise,
        backendUserPromise,
      ]);

      if (backendUserResult.error) {
        console.error("Error fetching user by firebaseUid:", backendUserResult.error);
        throw new Error(typeof backendUserResult.error === 'string' ? backendUserResult.error : 'Failed to fetch backend user data');
      }
      const backendUserData = backendUserResult.value;

      const lastRoleUsed = 
        (localStorage.getItem("lastRoleUsed") as "BUYER" | "GIG_WORKER" | null) ||
        firestoreUserData?.currentActiveRole ||
        backendUserData?.appRole;
      const lastViewVisitedBuyer = 
        ((localStorage.getItem("lastViewVisitedBuyer") as string | null) || 
        backendUserData?.lastViewVisitedBuyer) ?? null;
      const lastViewVisitedWorker = 
        ((localStorage.getItem("lastViewVisitedWorker") as string | null) || 
        backendUserData?.lastViewVisitedWorker) ?? null;
      const isQA = 
        localStorage.getItem("isViewQA") === "true" || 
        backendUserData?.appRole === "QA";

      const extendedUser: ExtendedUser = {
        ...firebaseUser,
        appRole: backendUserData?.appRole,
        lastRoleUsed: lastRoleUsed,
        uid: firebaseUser.uid, // Ensure uid from firebaseUser is prioritized
        displayName: firebaseUser.displayName,
        email: firebaseUser.email,
        photoURL: firebaseUser.photoURL,
        isAuthenticated: true,
        isAdmin: backendUserData?.appRole === "ADMIN",
        isSuperAdmin: backendUserData?.appRole === "SUPER_ADMIN",
        isQA,
        isBuyerMode: lastRoleUsed === "BUYER",
        isWorkerMode: lastRoleUsed === "GIG_WORKER",
        canBeBuyer: backendUserData?.isBuyer ?? false, // Provide default value
        canBeGigWorker: backendUserData?.isGigWorker ?? false, // Provide default value
        lastViewVisitedBuyer,
        lastViewVisitedWorker,
      };
      setUser(extendedUser);
    } catch (err) {
      console.error("Error in loadUser:", err);
      setError(err instanceof Error ? err : new Error('An unknown error occurred while loading user data'));
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [firebaseUser, idToken]);

  useEffect(() => {
    loadUser();
  }, [loadUser]); // Reload when firebaseUser or idToken changes

  const updateUserContext = useCallback(async (updates: {
    lastRoleUsed?: "BUYER" | "GIG_WORKER";
    lastViewVisited?: string;
  }) => {
    if (!user?.isAuthenticated || !idToken) {
      return { ok: false, error: "Not authenticated" };
    }

    // Optimistic check from original hook
    if (user.lastRoleUsed === updates.lastRoleUsed) {
      if (
        updates.lastRoleUsed === "BUYER" &&
        user.lastViewVisitedBuyer === updates.lastViewVisited
      ) {
        return { ok: false, error: "Same view as before" };
      }
      if (
        updates.lastRoleUsed === "GIG_WORKER" &&
        user.lastViewVisitedWorker === updates.lastViewVisited
      ) {
        return { ok: false, error: "Same view as before" };
      }
    }

    try {
      const { value: updatedPgData, error: pgError } = await updateUserAppContext(updates, idToken);
      
      if (updates.lastRoleUsed) { // Only update Firestore if lastRoleUsed is part of the update
        await updateUserProfile(user.uid, { currentActiveRole: updates.lastRoleUsed });
      }

      if (pgError) {
        console.error("Error updating user context in PG:", pgError);
        return { ok: false, error: pgError };
      }

      // Update local storage
      if (updatedPgData?.lastRoleUsed) {
        localStorage.setItem("lastRoleUsed", updatedPgData.lastRoleUsed);
      }
      if (updatedPgData?.lastViewVisitedBuyer) {
        localStorage.setItem("lastViewVisitedBuyer", updatedPgData.lastViewVisitedBuyer);
      }
      if (updatedPgData?.lastViewVisitedWorker) {
        localStorage.setItem("lastViewVisitedWorker", updatedPgData.lastViewVisitedWorker);
      }

      setUser((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          appRole: updatedPgData?.appRole ?? prev.appRole,
          lastRoleUsed: updatedPgData?.lastRoleUsed ?? prev.lastRoleUsed,
          isBuyer: updatedPgData?.isBuyer ?? prev.isBuyer,
          isGigWorker: updatedPgData?.isGigWorker ?? prev.isGigWorker,
          lastViewVisitedBuyer: updatedPgData?.lastViewVisitedBuyer ?? prev.lastViewVisitedBuyer,
          lastViewVisitedWorker: updatedPgData?.lastViewVisitedWorker ?? prev.lastViewVisitedWorker,
          // Recalculate modes based on potentially new lastRoleUsed
          isBuyerMode: (updatedPgData?.lastRoleUsed ?? prev.lastRoleUsed) === "BUYER",
          isWorkerMode: (updatedPgData?.lastRoleUsed ?? prev.lastRoleUsed) === "GIG_WORKER",
        } as ExtendedUser;
      });
      return { ok: true, error: undefined };
    } catch (err: unknown) {
      console.error("Error updating user context:", err);
      let errorMessage = "An unknown error occurred during update";
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === "string") {
        errorMessage = err;
      }
      return { ok: false, error: errorMessage };
    }
  }, [user, idToken, setUser]);

  const signOutUser = useCallback(async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null); // Clear user state in context
      // Optionally, clear other related local storage items if necessary
      localStorage.removeItem("lastRoleUsed");
      localStorage.removeItem("lastViewVisitedBuyer");
      localStorage.removeItem("lastViewVisitedWorker");
      localStorage.removeItem("isViewQA");
      console.log("User signed out successfully from context");
    } catch (error) {
      console.error("Error signing out from context:", error);
      // We might want to set an error state here too or rethrow
      throw error; 
    }
  }, [setUser]);

  const contextValue = useMemo(() => ({
    user,
    loading,
    error,
    refetchUser: loadUser, // Expose loadUser as refetchUser
    updateUserContext,
    signOutUser,
  }), [user, loading, error, loadUser, updateUserContext, signOutUser]); // idToken dependency for updateUserContext closure

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
