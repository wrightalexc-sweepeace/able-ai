// app/hooks/useAppContext.ts (example)
"use client";

import { useSession } from "next-auth/react";
import { Session, User } from "next-auth"; // Import Session type

interface AppContextValue {
    session: Session | null;
    user?: User;
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
    updateUserContext: (updates: { lastRoleUsed?: 'BUYER' | 'WORKER'; lastViewVisited?: string }) => Promise<void>;
}

export function useAppContext(): AppContextValue {
    const { data: session, status, update: updateNextAuthSession } = useSession();
    const user = session?.user;

    const isAuthenticated = status === "authenticated";
    const isLoading = status === "loading";

    // Function to call API to update context in PG and then update NextAuth session
    const updateUserContext = async (updates: { lastRoleUsed?: 'BUYER' | 'WORKER'; lastViewVisited?: string }) => {
        const isViewQA = localStorage.getItem('isViewQA') === 'true';
        if (!isViewQA || !isAuthenticated || !user?.uid) return;

        try {
            // 1. Call your backend API to update PostgreSQL
            const response = await fetch('/api/users/update-context', { // Create this API route
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ firebaseUid: user.uid, ...updates }),
            });
            if (!response.ok) {
                throw new Error('Failed to update user context in backend');
            }
            const updatedPgData = await response.json();

            // 2. Trigger NextAuth session update to reflect changes from PG
            // Pass the specific fields you want to update in the session
            await updateNextAuthSession({
                userContext: { // This 'userContext' key is arbitrary, ensure your JWT callback handles it
                    lastRoleUsed: updatedPgData.user?.lastRoleUsed || updates.lastRoleUsed,
                    lastViewVisited: updatedPgData.user?.lastViewVisited || updates.lastViewVisited,
                }
            });

        } catch (error) {
            console.error("Error updating user context:", error);
        }
    };


    return {
        session,
        user,
        isLoading,
        isAuthenticated,
        isAdmin: user?.appRole === 'ADMIN',
        isSuperAdmin: user?.appRole === 'SUPER_ADMIN',
        isQA: user?.appRole === 'QA',
        isBuyerMode: isAuthenticated && user?.lastRoleUsed === 'BUYER',
        isWorkerMode: isAuthenticated && user?.lastRoleUsed === 'GIG_WORKER',
        canBeBuyer: !!user?.isBuyer,
        canBeGigWorker: !!user?.isGigWorker,
        lastViewVisited: user?.lastViewVisited || null,
        updateUserContext,
    };
}
