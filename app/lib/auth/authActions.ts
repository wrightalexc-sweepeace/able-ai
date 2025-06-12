import { signIn } from "next-auth/react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  getIdToken,
  User,
  validatePassword,
} from "firebase/auth";
import { auth, auth as firebaseAuthClient } from "@/app/lib/firebase/clientApp";
import { findOrCreatePgUserAndUpdateRole } from "../user.server";

interface SignInResult {
  success: boolean;
  error: string | null;
}

interface RegistrationResult extends SignInResult {
  user: User | null;
}

// Helper to handle NextAuth sign-in after Firebase auth
export async function handleFirebaseSignInWithNextAuth(
  idToken: string,
  phone?: string,
  role?: "BUYER" | "GIG_WORKER"
): Promise<SignInResult> {
  const result = await signIn("credentials", {
    idToken,
    phone,
    role,
    redirect: false,
  });

  if (result?.error) {
    console.error("NextAuth Sign In Error:", result.error);
    return { success: false, error: result.error };
  } else if (result?.ok) {
    // Successful NextAuth sign-in
    // You might want to handle redirect/navigation on the client side
    // window.location.href = "/select-role"; // Or useRouter().push('/')
    return { success: true, error: null };
  }

  // Handle cases where result is neither error nor ok (e.g., canceled)
  return { success: false, error: "Authentication failed." };
}

export const validateClientPassword = async (password: string) => {
  if (password.length < 10) {
    return {
      success: false,
      error: "Password should be at least 10 characters.",
      user: null,
    };
  }
  const status = await validatePassword(auth, password);
  if (!status.isValid) {
    if (!status.meetsMinPasswordLength) {
      return {
        success: false,
        error: "Password should be at least 10 characters.",
        user: null,
      };
    }
    if (status.meetsMaxPasswordLength) {
      return {
        success: false,
        error: "Password should be less than 64 characters.",
        user: null,
      };
    }
    console.warn(
      `Password is invalid, checking policy: ${status.passwordPolicy}`
    );
    return { success: false, error: "Password is invalid.", user: null };
  }
  return { success: true, error: null };
};

// Handles email/password sign-in via Firebase and then NextAuth
export async function signInWithEmailPassword(
  email: string,
  password: string
): Promise<SignInResult> {
  try {
    const userCredential = await signInWithEmailAndPassword(
      firebaseAuthClient,
      email,
      password
    );
    const idToken = await getIdToken(userCredential.user, true);
    return handleFirebaseSignInWithNextAuth(idToken);
  } catch (err: any) {
    console.error("Firebase Email/Password Sign In Error:", err);
    // More user-friendly error mapping might be needed
    return { success: false, error: "Email or password is incorrect." };
  }
}

// Handles email/password registration via Firebase and then NextAuth
export async function registerWithEmailPassword(
  email: string,
  password: string,
  name: string,
  phone: string | undefined
): Promise<RegistrationResult> {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      firebaseAuthClient,
      email,
      password
    );
    await updateProfile(userCredential.user, { displayName: name });

    const pgUser = await findOrCreatePgUserAndUpdateRole({
      // This function MUST return these new fields
      firebaseUid: userCredential.user.uid || "46897",
      email: userCredential.user.email,
      displayName: userCredential.user.displayName,
      photoURL: userCredential.user.photoURL,
      phone,
      initialRoleContext: "BUYER" as "BUYER" | "GIG_WORKER" | undefined,
    });

    return { user: userCredential.user };
  } catch (err: any) {
    console.error("Firebase Email/Password Registration Error:", err);
    return {
      success: false,
      error: err.message || "Failed to register.",
      user: null,
    };
  }
}
