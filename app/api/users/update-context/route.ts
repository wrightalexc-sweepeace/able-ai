// app/api/users/update-context/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/auth'; // Your NextAuth options
import { updateUserAppContext as updatePgUserAppContext } from '@/app/lib/user.server'; // The PG update function

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { firebaseUid, lastRoleUsed, lastViewVisited } = await request.json();
    const sessionFirebaseUid = (session.user)?.uid; // Assuming uid is firebaseUid in session

    if (!firebaseUid || firebaseUid !== sessionFirebaseUid) {
        return NextResponse.json({ error: 'Mismatched user or UID missing' }, { status: 400 });
    }

    try {
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
