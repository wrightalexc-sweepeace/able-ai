"use server";
import { findOrCreatePgUserAndUpdateRole } from "@/app/lib/user.server";
import { authServer } from "@/lib/firebase/firebase-server";

type RegisterUserData = {
  email: string;
  password: string;
  confirmPassword: string;
  dni: string;
  dniTramite: string;
};

export async function registerUserAction(data: RegisterUserData) {
  try {

    const firebaseUser = await authServer.createUser({
      email: data.email,
      password: data.password,
      //displayName: data.name,
    });

    const user = await findOrCreatePgUserAndUpdateRole({
      // This function MUST return these new fields
      firebaseUid: firebaseUser.uid,
      email: data.email,
      displayName: firebaseUser?.displayName || "",
      photoURL: firebaseUser?.photoURL,
      initialRoleContext: "BUYER" as "BUYER" | "GIG_WORKER" | undefined,
    });

    return { ok: true };
  } catch (error: any) {
    console.error("Error registering user:", error);
    return { ok: false, error: error.message };
  }
}
