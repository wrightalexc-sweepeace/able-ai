// app/api/users/update-context/route.ts
import { NextResponse } from 'next/server';
import { updateUserAppContext as updatePgUserAppContext } from '@/app/lib/user.server'; // The PG update function
import { getAuthenticatedAppForUser } from '@/app/lib/firebase/serverApp';

export async function POST(request: Request) {
    const { firebaseUid, lastRoleUsed, lastViewVisited, idToken } = await request.json();
    const { currentUser } = await getAuthenticatedAppForUser(idToken);
    const sessionFirebaseUid = currentUser?.uid;

    if (!firebaseUid || firebaseUid !== sessionFirebaseUid) {
        return NextResponse.json({ error: 'Mismatched user or UID missing' }, { status: 400 });
    }

    try {
        console.log('Updating user context in PostgreSQL:', { lastRoleUsed, lastViewVisited });
        const updatedUser = await updatePgUserAppContext(firebaseUid, { lastRoleUsed, lastViewVisited });
        if (updatedUser) {
            return NextResponse.json({ success: true, user: { // Return only what needs to update the session
                lastRoleUsed: updatedUser.lastRoleUsed,
                lastViewVisitedBuyer: updatedUser.lastViewVisitedBuyer,
                lastViewVisitedWorker: updatedUser.lastViewVisitedWorker,
            }});
        }
        return NextResponse.json({ error: 'Failed to update user context' }, { status: 500 });
    } catch (error) {
        console.error('API Error updating user context:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
