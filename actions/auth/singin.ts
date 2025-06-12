'use server'
import { db } from "@/app/lib/drizzle/db";
import { UsersTable } from "@/app/lib/drizzle/schema";
import admin, { authServer } from "@/lib/firebase/firebase-server";
import { ERROR_CODES } from "@/lib/responses/errors";
import { CODES_SUCCESS } from "@/lib/responses/success";
import { eq } from "drizzle-orm";

export async function signInWithFirebase(uid: string) {
  try {
    const pgUser = await db.query.UsersTable.findFirst({
      where: eq(UsersTable.firebaseUid, uid),
    });

    const customClaims = {
      name: pgUser?.fullName,
      role: pgUser?.appRole,
    };

    if (pgUser?.email) return { error: "User not found", ...ERROR_CODES.BAD_REQUEST };

    await admin.auth().setCustomUserClaims(uid, customClaims);

    return CODES_SUCCESS.QUERY_OK;
  } catch (error: any) {
    return { error: error.message, ...ERROR_CODES.BAD_REQUEST };
  }
}
