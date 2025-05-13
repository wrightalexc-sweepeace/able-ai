// File: app/lib/user.server.ts
import { Session, User as NextAuthUser } from "next-auth";
import { db } from "@/app/lib/drizzle/db"; // Correct path to your Drizzle instance
import { UsersTable, GigWorkerProfilesTable, BuyerProfilesTable, userAppRoleEnum, activeRoleContextEnum } from "@/app/lib/drizzle/schema"; // Import specific tables
import { eq, sql } from "drizzle-orm";

// Define a comprehensive AppUser type that reflects the combined user object
// This should align with what your NextAuth session.user will look like
export interface AppUser extends NextAuthUser {
  id: string; // This will be your PostgreSQL UsersTable.id
  firebaseUid: string; // Firebase UID
  email: string | null | undefined;
  fullName: string | null | undefined;
  picture?: string | null | undefined; // From Firebase, maps to NextAuth's image
  appRole: typeof userAppRoleEnum.enumValues[number]; // Use enum values for type safety
  isBuyer: boolean;
  isGigWorker: boolean;
  lastRoleUsed: typeof activeRoleContextEnum.enumValues[number] | null;
  lastViewVisitedBuyer: string | null;
  lastViewVisitedWorker: string | null;
  // Add other relevant fields from UsersTable you want in the session/app context
}

// Type for the input to findOrCreatePgUserAndUpdateRole
interface FindOrCreatePgUserInput {
  firebaseUid: string;
  email: string;
  displayName: string; // From Firebase token (decodedToken.name or derived)
  photoURL?: string | null; // From Firebase token (decodedToken.picture)
  initialRoleContext?: typeof activeRoleContextEnum.enumValues[number] | undefined; // Hint from client on signup
}

// Type for the PostgreSQL User record (Drizzle's inferred select type)
type PgUserSelect = typeof UsersTable.$inferSelect;

/**
 * Finds an existing PostgreSQL user by Firebase UID or creates a new one.
 * Updates role flags (isBuyer, isGigWorker) based on initialRoleContext if it's a new user
 * or if the flags are not yet set.
 * This is called by NextAuth's `authorize` callback.
 */
export async function findOrCreatePgUserAndUpdateRole(
  input: FindOrCreatePgUserInput
): Promise<PgUserSelect | null> {
  const { firebaseUid, email, displayName, initialRoleContext } = input;

  try {
    // Try to find the user by firebaseUid
    let pgUser = await db.query.UsersTable.findFirst({
      where: eq(UsersTable.firebaseUid, firebaseUid),
    });

    if (pgUser) {
      // User exists, potentially update fullName if it's different from Firebase displayName
      // and ensure role flags are set if they were previously false and an initialRoleContext is now provided.
      const updates: Partial<typeof UsersTable.$inferInsert> = { updatedAt: new Date() };
      if (pgUser.fullName !== displayName) {
        updates.fullName = displayName;
      }
      if (initialRoleContext === 'BUYER' && !pgUser.isBuyer) {
        updates.isBuyer = true;
        if (!pgUser.lastRoleUsed) updates.lastRoleUsed = 'BUYER'; // Set initial context
         // Create BuyerProfile if it doesn't exist
        const buyerProfile = await db.query.BuyerProfilesTable.findFirst({where: eq(BuyerProfilesTable.userId, pgUser.id)});
        if(!buyerProfile) {
            await db.insert(BuyerProfilesTable).values({ userId: pgUser.id, fullCompanyName: `${displayName}'s Company` /* Default or from further onboarding */ });
        }
      }
      if (initialRoleContext === 'GIG_WORKER' && !pgUser.isGigWorker) {
        updates.isGigWorker = true;
        if (!pgUser.lastRoleUsed) updates.lastRoleUsed = 'GIG_WORKER'; // Set initial context
        // Create GigWorkerProfile if it doesn't exist
        const workerProfile = await db.query.GigWorkerProfilesTable.findFirst({where: eq(GigWorkerProfilesTable.userId, pgUser.id)});
        if(!workerProfile){
            await db.insert(GigWorkerProfilesTable).values({ userId: pgUser.id });
        }
      }

      if (Object.keys(updates).length > 1) { // More than just updatedAt
        const updatedUsers = await db
          .update(UsersTable)
          .set(updates)
          .where(eq(UsersTable.firebaseUid, firebaseUid))
          .returning();
        pgUser = updatedUsers[0] || pgUser;
      }
      return pgUser;
    } else {
      // User does not exist, create them
      const newUserIsBuyer = initialRoleContext === 'BUYER';
      const newUserIsGigWorker = initialRoleContext === 'GIG_WORKER';

      const newPgUsers = await db
        .insert(UsersTable)
        .values({
          firebaseUid,
          email,
          fullName: displayName,
          appRole: 'USER', // Default appRole for new sign-ups
          isBuyer: newUserIsBuyer,
          isGigWorker: newUserIsGigWorker,
          lastRoleUsed: initialRoleContext || null, // Set initial context if provided
          // Other fields will use DB defaults
        })
        .returning();
      
      pgUser = newPgUsers[0];

      if (pgUser) {
        // Create corresponding profiles if flags are set
        if (newUserIsBuyer) {
          await db.insert(BuyerProfilesTable).values({ userId: pgUser.id, fullCompanyName: `${displayName}'s Company` /* Default or from further onboarding */ });
        }
        if (newUserIsGigWorker) {
          await db.insert(GigWorkerProfilesTable).values({ userId: pgUser.id });
        }
      }
      return pgUser || null;
    }
  } catch (error) {
    console.error("Error in findOrCreatePgUserAndUpdateRole:", error);
    return null;
  }
}


// --- UTILITY FUNCTIONS BASED ON PG USER OBJECT (PgUserSelect type) ---

export function getPgUserLastRoleUsed(pgUser: PgUserSelect | null): typeof activeRoleContextEnum.enumValues[number] | null {
    return pgUser?.lastRoleUsed || null;
}

export function getPgUserLastViewVisited(pgUser: PgUserSelect | null, currentRoleContext: typeof activeRoleContextEnum.enumValues[number] | null): string | null {
    if (!pgUser || !currentRoleContext) return null;
    return currentRoleContext === 'BUYER' ? pgUser.lastViewVisitedBuyer : pgUser.lastViewVisitedWorker;
}

export function isPgUserAdmin(pgUser: PgUserSelect | null): boolean {
    return pgUser?.appRole === 'ADMIN';
}

export function isPgUserSuperAdmin(pgUser: PgUserSelect | null): boolean {
    return pgUser?.appRole === 'SUPER_ADMIN';
}

export function isPgUserQA(pgUser: PgUserSelect | null): boolean {
    return pgUser?.appRole === 'QA';
}

export function isPgUserActualBuyer(pgUser: PgUserSelect | null): boolean { // Renamed for clarity
    return !!pgUser?.isBuyer;
}

export function isPgUserActualGigWorker(pgUser: PgUserSelect | null): boolean { // Renamed for clarity
    return !!pgUser?.isGigWorker;
}

// --- UTILITY FUNCTIONS BASED ON NEXTAUTH.JS SESSION (AppUser type) ---
// These assume your NextAuth callbacks correctly populate the session.user with AppUser fields.

export function getSessionLastRoleUsed(session: Session | null): typeof activeRoleContextEnum.enumValues[number] | null {
    const user = session?.user as AppUser | undefined;
    return user?.lastRoleUsed || null;
}

export function getSessionLastViewVisited(session: Session | null, currentRoleContext?: typeof activeRoleContextEnum.enumValues[number] | null): string | null {
    const user = session?.user as AppUser | undefined;
    if (!user) return null;
    const roleToUse = currentRoleContext || user.lastRoleUsed;
    if (!roleToUse) return null;
    return roleToUse === 'BUYER' ? user.lastViewVisitedBuyer : user.lastViewVisitedWorker;
}

export function isSessionUserAdmin(session: Session | null): boolean {
    const user = session?.user as AppUser | undefined;
    return user?.appRole === 'ADMIN';
}

export function isSessionUserSuperAdmin(session: Session | null): boolean {
    const user = session?.user as AppUser | undefined;
    return user?.appRole === 'SUPER_ADMIN';
}

export function isSessionUserQA(session: Session | null): boolean {
    const user = session?.user as AppUser | undefined;
    return user?.appRole === 'QA';
}

export function isSessionUserActualBuyer(session: Session | null): boolean {
    const user = session?.user as AppUser | undefined;
    return !!user?.isBuyer;
}

export function isSessionUserActualGigWorker(session: Session | null): boolean {
    const user = session?.user as AppUser | undefined;
    return !!user?.isGigWorker;
}

// --- FUNCTION TO UPDATE USER CONTEXT IN POSTGRESQL (lastRoleUsed, lastViewVisited) ---
export async function updateUserAppContext(
    firebaseUid: string,
    updates: {
        lastRoleUsed?: typeof activeRoleContextEnum.enumValues[number];
        lastViewVisited?: string; // This will be the specific view for the role being set/updated
    }
): Promise<PgUserSelect | null> {
    if (!firebaseUid || Object.keys(updates).length === 0) return null;

    const updateData: Partial<typeof UsersTable.$inferInsert> = { updatedAt: new Date() };

    if (updates.lastRoleUsed) {
        updateData.lastRoleUsed = updates.lastRoleUsed;
        // When lastRoleUsed is updated, also update the specific lastViewVisited for that role
        if (updates.lastViewVisited) {
            if (updates.lastRoleUsed === 'BUYER') {
                updateData.lastViewVisitedBuyer = updates.lastViewVisited;
            } else if (updates.lastRoleUsed === 'GIG_WORKER') {
                updateData.lastViewVisitedWorker = updates.lastViewVisited;
            }
        }
    } else if (updates.lastViewVisited) {
        // If only lastViewVisited is provided, we need to know for which role context
        // This scenario implies the role context is already known and not changing.
        // It's better if updateUserAppContext is always called with the current role context
        // if lastViewVisited is being updated.
        // For simplicity, this function should ideally be called when a role IS active.
        // Let's assume the caller knows the current role if only updating view.
        // Or, fetch the current lastRoleUsed from DB first if not provided.
        // To avoid complexity, the `updates` object should ideally contain `lastRoleUsed` if `lastViewVisited` for that role is changing.
        // For now, if lastRoleUsed is not in updates, we won't update specific lastViewVisited.
        console.warn("Updating lastViewVisited without lastRoleUsed might lead to ambiguity. Please provide lastRoleUsed.");
    }


    try {
        const updatedUsers = await db
            .update(UsersTable)
            .set(updateData)
            .where(eq(UsersTable.firebaseUid, firebaseUid))
            .returning();

        return updatedUsers[0] || null;
    } catch (error) {
        console.error("Error updating user app context in PG:", error);
        return null;
    }
}

// --- FUNCTION TO GET THE FULL AppUser (HYDRATED WITH PG DETAILS) FROM AN EXISTING SESSION ---
export async function getHydratedAppUser(session: Session | null): Promise<AppUser | null> {
    if (!session?.user) {
        console.warn("getHydratedAppUser: No session or session.user provided.");
        return null;
    }

    const nextAuthUser = session.user as Partial<AppUser> & { uid?: string }; // uid is firebaseUid from token

    if (!nextAuthUser.uid) {
        console.warn("getHydratedAppUser: Firebase UID (as 'uid') not found in NextAuth session user.");
        // Attempt to use 'id' if 'uid' is missing and 'id' might be firebaseUid
        if (!nextAuthUser.id) {
             console.error("getHydratedAppUser: Neither 'uid' nor 'id' found as Firebase UID in session.");
             return null; // Cannot proceed without Firebase UID
        }
        nextAuthUser.uid = nextAuthUser.id; // Assume id is firebaseUid if uid is missing
    }
    
    const firebaseUid = nextAuthUser.uid;

    try {
        const pgUser = await db.query.UsersTable.findFirst({
            where: eq(UsersTable.firebaseUid, firebaseUid),
            // Optionally include related profiles if needed directly on AppUser
            // with: {
            //   gigWorkerProfile: true,
            //   buyerProfile: true,
            // }
        });

        if (!pgUser) {
            console.warn(`getHydratedAppUser: No PG User found for Firebase UID: ${firebaseUid}. User might have been deleted from PG or sync issue.`);
            return { // Return a partial AppUser based on session data
                id: firebaseUid, // Use firebaseUid as primary id in this context
                firebaseUid: firebaseUid,
                email: nextAuthUser.email,
                fullName: nextAuthUser.name, // NextAuth session has 'name'
                picture: nextAuthUser.image, // NextAuth session has 'image'
                appRole: 'USER', // Default or unknown
                isBuyer: false,
                isGigWorker: false,
                lastRoleUsed: null,
                lastViewVisitedBuyer: null,
                lastViewVisitedWorker: null,
            } as AppUser;
        }

        // Combine data, prioritizing PG data for roles/flags
        return {
            // From NextAuth session (originally from Firebase token or PG via authorize)
            email: nextAuthUser.email || pgUser.email, // Prefer session email (usually from token)
            name: nextAuthUser.name, // This is session.user.name
            image: nextAuthUser.image, // This is session.user.image

            // From PostgreSQL (authoritative for these)
            id: pgUser.id, // This is the PostgreSQL UsersTable.id
            firebaseUid: pgUser.firebaseUid,
            appRole: pgUser.appRole,
            isBuyer: pgUser.isBuyer,
            isGigWorker: pgUser.isGigWorker,
            lastRoleUsed: pgUser.lastRoleUsed,
            lastViewVisitedBuyer: pgUser.lastViewVisitedBuyer,
            lastViewVisitedWorker: pgUser.lastViewVisitedWorker,
            fullName: pgUser.fullName, // Authoritative full name from PG
            picture: nextAuthUser.image || undefined, // Use image from session if available for picture
        };
    } catch (error) {
        console.error(`getHydratedAppUser: Error fetching PG User details for Firebase UID ${firebaseUid}:`, error);
        // Fallback to a partial AppUser based on session data in case of DB error
         return {
            id: firebaseUid,
            firebaseUid: firebaseUid,
            email: nextAuthUser.email,
            fullName: nextAuthUser.name,
            picture: nextAuthUser.image,
            appRole: 'USER', // Default or unknown
            isBuyer: false,
            isGigWorker: false,
            lastRoleUsed: null,
            lastViewVisitedBuyer: null,
            lastViewVisitedWorker: null,
        } as AppUser;
    }
}