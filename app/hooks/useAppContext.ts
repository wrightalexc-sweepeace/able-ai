// app/hooks/useAppContext.ts (example)
"use client";

import { User } from "firebase/auth";
import { useFirebaseAuth } from "./useFirebaseAuth";

interface ExtendedUser extends User {
    appRole?: 'ADMIN' | 'SUPER_ADMIN' | 'QA';
    lastRoleUsed?: 'BUYER' | 'WORKER';
    lastViewVisited?: string;
    isBuyer?: boolean;
    isGigWorker?: boolean;
}

interface AppContextValue {
    user: ExtendedUser | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    isAdmin: boolean;
    isSuperAdmin: boolean;
    isQA: boolean;
    isBuyerMode: boolean;     // Based on lastRoleUsed
    isWorkerMode: boolean;    // Based on lastRoleUsed
    canBeBuyer: boolean;      // User *can* be a buyer
    canBeGigWorker: boolean;  // User *can* be a worker
    lastViewVisited: string | null;
    updateUserContext: (updates: { lastRoleUsed?: 'BUYER' | 'GIG_WORKER'; lastViewVisited?: string }, idToken?: string | null) => Promise<void>;
}

export function useAppContext(): AppContextValue {
    const { user: firebaseUser, loading } = useFirebaseAuth();
    const user = firebaseUser as ExtendedUser | null;
    const isAuthenticated = !!user;

    // Function to call API to update context in PG
    const updateUserContext = async (updates: { lastRoleUsed?: 'BUYER' | 'GIG_WORKER'; lastViewVisited?: string }, idToken?: string | null) => {
        const isViewQA = localStorage.getItem('isViewQA') === 'true';

        if (isViewQA || !isAuthenticated || !user?.uid) return;

        try {
            // Call backend API to update PostgreSQL
            const response = await fetch('/api/users/update-context', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ firebaseUid: user.uid, ...updates, idToken }),
            });
            if (!response.ok) {
                throw new Error('Failed to update user context in backend');
            }

            const updatedPgData = await response.json();

            // Update local storage for immediate client-side updates
            if (updates.lastRoleUsed) {
                localStorage.setItem('currentRole', updatedPgData.lastRoleUsed);
            }
            if (updates.lastViewVisited) {
                localStorage.setItem('lastViewVisited', updatedPgData.lastViewVisited);
            }

        } catch (error) {
            console.error("Error updating user context:", error);
        }
    };

    // Get role info from local storage for immediate updates
    const currentRole = typeof window !== 'undefined' ? localStorage.getItem('currentRole') as 'BUYER' | 'WORKER' | null : null;
    const lastViewVisitedFromStorage = typeof window !== 'undefined' ? localStorage.getItem('lastViewVisited') : null;

    return {
        user,
        isLoading: loading,
        isAuthenticated,
        isAdmin: user?.appRole === 'ADMIN',
        isSuperAdmin: user?.appRole === 'SUPER_ADMIN',
        isQA: user?.appRole === 'QA',
        isBuyerMode: isAuthenticated && (currentRole === 'BUYER' || user?.lastRoleUsed === 'BUYER'),
        isWorkerMode: isAuthenticated && (currentRole === 'WORKER' || user?.lastRoleUsed === 'WORKER'),
        canBeBuyer: !!user?.isBuyer,
        canBeGigWorker: !!user?.isGigWorker,
        lastViewVisited: lastViewVisitedFromStorage || user?.lastViewVisited || null,
        updateUserContext,
    };
}
