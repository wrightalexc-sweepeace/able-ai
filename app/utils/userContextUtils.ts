// app/utils/userContextUtils.ts
import { ExtendedUser } from '../context/UserContext'; // Adjust path if ExtendedUser is elsewhere

export interface UpdateUserContextUpdates {
  lastRoleUsed?: "BUYER" | "GIG_WORKER";
  lastViewVisited?: string;
}

// Represents the expected structure of data returned from the backend (e.g., updateUserAppContextFn)
export type BackendUserUpdateData = {
  lastRoleUsed?: "BUYER" | "GIG_WORKER" | null;
  lastViewVisitedBuyer?: string | null;
  lastViewVisitedWorker?: string | null;
  appRole?: ExtendedUser['appRole'] | null; // Use the type from ExtendedUser, allow null
  isBuyer?: boolean;      // Corresponds to canBeBuyer in ExtendedUser
  isGigWorker?: boolean;  // Corresponds to canBeGigWorker in ExtendedUser
};

export interface StorageSetterFunctions {
  setLastRoleUsed: (role: "BUYER" | "GIG_WORKER") => void;
  setLastViewVisitedBuyer: (view: string) => void;
  setLastViewVisitedWorker: (view: string) => void;
}

export const handleUpdateUserContextLogic = async (
  updates: UpdateUserContextUpdates,
  currentUser: ExtendedUser | null,
  idToken: string | null,
  updateUserAppContextFn: (
    updates: UpdateUserContextUpdates,
    token: string
  ) => Promise<{ value?: BackendUserUpdateData; error?: string }>, // Updated type here
  updateUserProfileFn: (
    uid: string,
    data: { currentActiveRole: "BUYER" | "GIG_WORKER" }
  ) => Promise<void>,
  storageSetterFns: StorageSetterFunctions,
  setOptimisticUserFn: React.Dispatch<React.SetStateAction<ExtendedUser | null>>,
  forceReloadUserFn: () => Promise<void>
): Promise<{ ok: boolean; error?: string }> => {
  if (!currentUser?.isAuthenticated || !idToken) {
    return { ok: false, error: "Not authenticated" };
  }

  // Prevent unnecessary updates if data hasn't changed
  if (currentUser.lastRoleUsed === updates.lastRoleUsed) {
    if (
      updates.lastRoleUsed === "BUYER" &&
      currentUser.lastViewVisitedBuyer === updates.lastViewVisited
    ) {
      return { ok: false, error: "Same view as before" };
    }
    if (
      updates.lastRoleUsed === "GIG_WORKER" &&
      currentUser.lastViewVisitedWorker === updates.lastViewVisited
    ) {
      return { ok: false, error: "Same view as before" };
    }
  }

  try {
    // 1. Update backend (PostgreSQL via server action)
    const { value: updatedPgData, error: pgError } = await updateUserAppContextFn(
      updates,
      idToken
    );
    if (pgError) {
      console.error("Error updating user context in PG:", pgError);
      return { ok: false, error: pgError };
    }

    // 2. Update Firestore (if lastRoleUsed changed)
    // if (updates.lastRoleUsed && currentUser?.uid) {
    //   await updateUserProfileFn(currentUser.uid, {
    //     currentActiveRole: updates.lastRoleUsed,
    //   });
    // }

    // 3. Update local storage preferences
    if (updatedPgData?.lastRoleUsed) {
      storageSetterFns.setLastRoleUsed(updatedPgData.lastRoleUsed);
    }
    if (updatedPgData?.lastViewVisitedBuyer) {
      storageSetterFns.setLastViewVisitedBuyer(updatedPgData.lastViewVisitedBuyer);
    }
    if (updatedPgData?.lastViewVisitedWorker) {
      storageSetterFns.setLastViewVisitedWorker(updatedPgData.lastViewVisitedWorker);
    }
    
    // 4. Optimistically update local state for immediate UI reflection
    if (updatedPgData) {
      setOptimisticUserFn((prevUser: ExtendedUser | null) => {
        if (!prevUser) return null; // Should not happen if isAuthenticated check passed
        // Handle potential null values from backend when updating optimistic state
        const newLastRoleUsed = updatedPgData.lastRoleUsed === null ? undefined : (updatedPgData.lastRoleUsed || prevUser.lastRoleUsed);
        const newAppRole = updatedPgData.appRole === null ? undefined : (updatedPgData.appRole ?? prevUser.appRole);

        return {
          ...prevUser,
          lastRoleUsed: newLastRoleUsed,
          isBuyerMode: newLastRoleUsed === "BUYER",
          isWorkerMode: newLastRoleUsed === "GIG_WORKER",
          lastViewVisitedBuyer: updatedPgData.lastViewVisitedBuyer === null ? null : (updatedPgData.lastViewVisitedBuyer || prevUser.lastViewVisitedBuyer || null),
          lastViewVisitedWorker: updatedPgData.lastViewVisitedWorker === null ? null : (updatedPgData.lastViewVisitedWorker || prevUser.lastViewVisitedWorker || null),
          appRole: newAppRole,
          canBeBuyer: typeof updatedPgData.isBuyer === 'boolean' ? updatedPgData.isBuyer : prevUser.canBeBuyer,
          canBeGigWorker: typeof updatedPgData.isGigWorker === 'boolean' ? updatedPgData.isGigWorker : prevUser.canBeGigWorker,
          isQA: newAppRole === "QA",
        };
      });
    }

    // 5. Force reload user data from source of truth via the hook
    await forceReloadUserFn();
    
    return { ok: true };
  } catch (err: unknown) {
    console.error("Error updating user context:", err);
    let errorMessage = "An unknown error occurred";
    if (err instanceof Error) {
      errorMessage = err.message;
    } else if (typeof err === "string") {
      errorMessage = err;
    } else {
      errorMessage = String(err);
    }
    return { ok: false, error: errorMessage };
  }
};
