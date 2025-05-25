'use server';

import { updateUserAppContext as updatePgUserAppContext } from '@/app/lib/user.server';
import { getAuthenticatedAppForUser } from '@/app/lib/firebase/serverApp';

export async function updateUserAppContext({ lastRoleUsed, lastViewVisited }: { lastRoleUsed?: 'BUYER' | 'GIG_WORKER'; lastViewVisited?: string }, idToken: string) {
    const { currentUser } = await getAuthenticatedAppForUser(idToken);
    const sessionFirebaseUid = currentUser?.uid;

    if (!sessionFirebaseUid) {
        return { error: 'No authenticated user found' };
    }
    
    const updatedUser = await updatePgUserAppContext(sessionFirebaseUid, { lastRoleUsed, lastViewVisited });

    if (!updatedUser) {
        return { error: 'Failed to update user context' };
    }

    return { value: { // Return only what needs to update the session
        lastRoleUsed: updatedUser.lastRoleUsed,
        lastViewVisitedBuyer: updatedUser.lastViewVisitedBuyer,
        lastViewVisitedWorker: updatedUser.lastViewVisitedWorker,
        isBuyer: updatedUser.isBuyer,
        isGigWorker: updatedUser.isGigWorker,
        appRole: updatedUser.appRole,
    }}
}