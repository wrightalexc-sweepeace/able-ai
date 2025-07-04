// File: app/lib/user.server.ts
import { db } from "@/lib/drizzle/db"; // Correct path to your Drizzle instance
import { UsersTable, GigWorkerProfilesTable, BuyerProfilesTable, userAppRoleEnum, activeRoleContextEnum, NotificationPreferencesTable } from "@/lib/drizzle/schema";
import { eq } from "drizzle-orm";
import admin from "./firebase/firebase-server";

// Define a comprehensive AppUser type
export interface AppUser {
  id: string; // This will be your PostgreSQL UsersTable.id
  firebaseUid: string; // Firebase UID
  email: string | null | undefined;
  fullName: string | null | undefined;
  picture?: string | null | undefined; // From Firebase profile
  appRole: typeof userAppRoleEnum.enumValues[number];
  isBuyer: boolean;
  isGigWorker: boolean;
  lastRoleUsed: typeof activeRoleContextEnum.enumValues[number] | null;
  lastViewVisitedBuyer: string | null;
  lastViewVisitedWorker: string | null;
}

// Type for the input to findOrCreatePgUserAndUpdateRole
interface FindOrCreatePgUserInput {
  firebaseUid: string;
  email: string;
  displayName: string;
  photoURL?: string | null;
  phone?: string | null;
  initialRoleContext?: typeof activeRoleContextEnum.enumValues[number] | undefined;
}

// Type for the PostgreSQL User record
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
  const { firebaseUid, email, displayName, initialRoleContext, phone } = input;

  try {
    // Try to find the user by firebaseUid with notificationPreferences
    let pgUser = await db.query.UsersTable.findFirst({
      where: eq(UsersTable.firebaseUid, firebaseUid),
      with: {
        notificationPreferences: true,
      },
    });

    if (pgUser) {
      const updates: Partial<typeof UsersTable.$inferInsert> = { updatedAt: new Date() };

      if (displayName && pgUser.fullName !== displayName) {
        updates.fullName = displayName;
      }

      if (!!phone && pgUser.phone !== phone) {
        updates.phone = phone;
      }

      if (initialRoleContext === 'BUYER' && !pgUser.isBuyer) {
        updates.isBuyer = true;
        if (!pgUser.lastRoleUsed) updates.lastRoleUsed = 'BUYER';

        const buyerProfile = await db.query.BuyerProfilesTable.findFirst({
          where: eq(BuyerProfilesTable.userId, pgUser.id),
        });

        if (!buyerProfile) {
          await db.insert(BuyerProfilesTable).values({
            userId: pgUser.id,
            fullCompanyName: `${displayName}'s Company`,
          });
        }
      }

      if (initialRoleContext === 'GIG_WORKER' && !pgUser.isGigWorker) {
        updates.isGigWorker = true;
        if (!pgUser.lastRoleUsed) updates.lastRoleUsed = 'GIG_WORKER';

        const workerProfile = await db.query.GigWorkerProfilesTable.findFirst({
          where: eq(GigWorkerProfilesTable.userId, pgUser.id),
        });

        if (!workerProfile) {
          await db.insert(GigWorkerProfilesTable).values({
            userId: pgUser.id,
          });
        }
      }

      if (!pgUser.notificationPreferences) {
        await db.insert(NotificationPreferencesTable).values({
          userId: pgUser.id,
        });
      }

      if (Object.keys(updates).length > 1) {
        const updatedUsers = await db
          .update(UsersTable)
          .set(updates)
          .where(eq(UsersTable.firebaseUid, firebaseUid))
          .returning();

        // Re-fetch the user to ensure notificationPreferences is included
        pgUser = await db.query.UsersTable.findFirst({
          where: eq(UsersTable.firebaseUid, firebaseUid),
          with: {
            notificationPreferences: true,
          },
        }) || pgUser;
      }

      return pgUser;
    } else {
      const newUserIsBuyer = initialRoleContext === 'BUYER';
      const newUserIsGigWorker = initialRoleContext === 'GIG_WORKER';

      const newPgUsers = await db
        .insert(UsersTable)
        .values({
          firebaseUid,
          email,
          fullName: displayName,
          appRole: 'USER',
          isBuyer: newUserIsBuyer,
          isGigWorker: newUserIsGigWorker,
          lastRoleUsed: initialRoleContext || null,
          phone,
        })
        .returning();

      const newPgUser = newPgUsers[0];
      if (!newPgUser) return null;

      await db.insert(NotificationPreferencesTable).values({
        userId: newPgUser.id,
      });

      if (newUserIsBuyer) {
        await db.insert(BuyerProfilesTable).values({
          userId: newPgUser.id,
          fullCompanyName: `${displayName}'s Company`,
        });
      }

      if (newUserIsGigWorker) {
        await db.insert(GigWorkerProfilesTable).values({
          userId: newPgUser.id,
        });
      }

      const foundUser = await db.query.UsersTable.findFirst({
        where: eq(UsersTable.id, newPgUser.id),
        with: {
          notificationPreferences: true,
        },
      });
      return foundUser ?? null;
    }
  } catch (error) {
    console.error("Error in findOrCreatePgUserAndUpdateRole:", error);
    return null;
  }
}


// --- UTILITY FUNCTIONS BASED ON PG USER OBJECT ---

export function getPgUserLastRoleUsed(pgUser: PgUserSelect | null): typeof activeRoleContextEnum.enumValues[number] | null {
  return pgUser?.lastRoleUsed || null;
}

export function getPgUserLastViewVisited(pgUser: PgUserSelect | null, currentRoleContext: typeof activeRoleContextEnum.enumValues[number] | null): string | null {
  if (!pgUser || !currentRoleContext) return null;
  return currentRoleContext === 'BUYER' ? pgUser.lastViewVisitedBuyer : pgUser.lastViewVisitedWorker;
}

// --- UTILITY FUNCTIONS BASED ON APP USER ---

export async function isUserAuthenticated(idToken: string) {
  try {
    const data = await admin.auth().verifyIdToken(idToken);
    return {data: true, uid: data.uid};
  } catch (error) {
    console.error("Invalid or expired token:", error);
    throw "Invalid or expired token"
  }
}

export async function isUserAdmin(idToken: string) {
  try {
    const data = await admin.auth().verifyIdToken(idToken);

    return {data: data?.role === 'ADMIN', uid: data.uid};
  } catch (error) {
    console.error("Invalid or expired token:", error);
    throw "Invalid or expired token"
  }
}

export async function isUserSuperAdmin(idToken: string): Promise<boolean> {
  try {
    const data = await admin.auth().verifyIdToken(idToken);

    return data?.role === 'SUPER_ADMIN';
  } catch (error) {
    console.error("Invalid or expired token:", error);
    throw "Invalid or expired token"
  }
}

export async function isUserQA(idToken: string): Promise<boolean> {
  try {
    const data = await admin.auth().verifyIdToken(idToken);

    return data?.role === 'QA';
  } catch (error) {
    console.error("Invalid or expired token:", error);
    throw "Invalid or expired token"
  }
}

export async function isUserBuyer(idToken: string): Promise<boolean> {
  try {
    const data = await admin.auth().verifyIdToken(idToken);

    return data?.role === 'BUYER';
  } catch (error) {
    console.error("Invalid or expired token:", error);
    throw "Invalid or expired token"
  }
}

export async function isUserGigWorker(idToken: string): Promise<boolean> {
  try {
    const data = await admin.auth().verifyIdToken(idToken);

    return data?.role === 'GIG_WORKER';
  } catch (error) {
    console.error("Invalid or expired token:", error);
    throw "Invalid or expired token"
  }
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

/**
 * Gets a hydrated AppUser object for a given Firebase UID by fetching data from PostgreSQL
 */
export async function getHydratedAppUser(firebaseUid: string): Promise<AppUser | null> {
  if (!firebaseUid) {
    console.warn("getHydratedAppUser: No Firebase UID provided.");
    return null;
  }

  try {
    const pgUser = await db.query.UsersTable.findFirst({
      where: eq(UsersTable.firebaseUid, firebaseUid),
    });

    if (!pgUser) {
      console.warn(`getHydratedAppUser: No PG User found for Firebase UID: ${firebaseUid}`);
      return null;
    }

    // Return user data from PostgreSQL
    return {
      id: pgUser.id,
      firebaseUid: pgUser.firebaseUid,
      email: pgUser.email,
      fullName: pgUser.fullName,
      picture: undefined, // This will be set from Firebase user data when needed
      appRole: pgUser.appRole,
      isBuyer: pgUser.isBuyer,
      isGigWorker: pgUser.isGigWorker,
      lastRoleUsed: pgUser.lastRoleUsed,
      lastViewVisitedBuyer: pgUser.lastViewVisitedBuyer,
      lastViewVisitedWorker: pgUser.lastViewVisitedWorker,
    };
  } catch (error) {
    console.error(`getHydratedAppUser: Error fetching PG User details:`, error);
    return null;
  }
}