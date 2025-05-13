import { db as drizzleDB } from "@/app/lib/drizzle/db";
import { usersTable } from "@/app/lib/drizzle/schema"; 
import { eq } from "drizzle-orm";

interface UserArgs {
  firebaseUid: string;
  email: string | null | undefined;
  displayName: string | null | undefined;
  initialRole?: 'BUYER' | 'GIG_WORKER' | undefined;
}

export async function findOrCreatePgUserAndUpdateRole({ firebaseUid, email, displayName, initialRole }: UserArgs) {
  try {
    let user = await drizzleDB.query.usersTable.findFirst({
      where: eq(usersTable.firebaseUid, firebaseUid),
    });

    if (user) {
      // Optionally update name/email if they've changed in Firebase
      if ((displayName && user.fullName !== displayName) || (email && user.email !== email)) {
         const updatedUserData: Partial<typeof usersTable.$inferInsert> = {};
         if (displayName && user.fullName !== displayName) updatedUserData.fullName = displayName;
         if (email && user.email !== email) updatedUserData.email = email;

         if (Object.keys(updatedUserData).length > 0) {
            const updatedUsers = await drizzleDB
            .update(usersTable)
            .set(updatedUserData)
            .where(eq(usersTable.firebaseUid, firebaseUid))
            .returning();
            if (updatedUsers.length > 0) user = updatedUsers[0];
         }
      }
      return user;
    }

    // User not found, create them in PostgreSQL
    // Determine the initial appRole here. For example, default to "BUYER" or "WORKER",
    // or have a step in your client-side Firebase registration to select a role.
    const initialAppRole = initialRole || "BUYER"; // Placeholder - adjust this logic

    const newUser = {
      firebaseUid,
      email: email?.toLowerCase() || `user-${firebaseUid}@example.com`, // Ensure email is present
      fullName: displayName || "New User",
      appRole: initialAppRole, // Set a default role or determine it
      // Set other necessary default fields for your PG usersTable
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const insertedUsers = await drizzleDB.insert(usersTable).values(newUser).returning();
    return insertedUsers[0];

  } catch (error) {
    console.error("Error in findOrCreatePgUserAndUpdateRole:", error);
    return null;
  }
}