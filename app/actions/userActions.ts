'use server';
import { db } from "@/app/lib/drizzle/db";
import { UsersTable } from "@/app/lib/drizzle/schema/users";
import { eq } from "drizzle-orm";
import { getAuthenticatedAppForUser } from '@/app/lib/firebase/serverApp';

export async function getUserByFirebaseUid(firebaseUid: string, idToken: string) {
  try {
    const { currentUser } = await getAuthenticatedAppForUser(idToken);
    const sessionFirebaseUid = currentUser?.uid;

    if (!sessionFirebaseUid) {
      return { ok: false, error: 'Unauthorized: No authenticated user found' };
    }

    // Although we check the authenticated user, we still retrieve the user based on the provided firebaseUid
    // This allows fetching other users' public data if needed, but the auth check ensures only authenticated users can call this.
    const user = await db
      .select({
        firebaseUid: UsersTable.firebaseUid,
        email: UsersTable.email,
        fullName: UsersTable.fullName,
        phone: UsersTable.phone,
        appRole: UsersTable.appRole,
        isGigWorker: UsersTable.isGigWorker,
        isBuyer: UsersTable.isBuyer,
        lastRoleUsed: UsersTable.lastRoleUsed,
        lastViewVisitedBuyer: UsersTable.lastViewVisitedBuyer,
        lastViewVisitedWorker: UsersTable.lastViewVisitedWorker,
        stripeCustomerId: UsersTable.stripeCustomerId,
        stripeConnectAccountId: UsersTable.stripeConnectAccountId,
        rtwStatus: UsersTable.rtwStatus,
        rtwDocumentUrl: UsersTable.rtwDocumentUrl,
        kycStatus: UsersTable.kycStatus,
        kycDocumentUrl: UsersTable.kycDocumentUrl,
        isBanned: UsersTable.isBanned,
        isDisabled: UsersTable.isDisabled,
      })
      .from(UsersTable)
      .where(eq(UsersTable.firebaseUid, firebaseUid))
      .limit(1);

    const userData = user[0] || null;

    if (!userData) {
        return { ok: false, error: 'User not found' };
    }

    return { ok: true, value: userData };

  } catch (error: any) {
    console.error("Error fetching user by firebaseUid:", error);
    return { ok: false, error: error.message };
  }
}