import {
    // Core Auth methods
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut as firebaseSignOut, // Renamed to avoid conflict if you have a local signOut
    sendPasswordResetEmail,
    updateProfile, // For setting displayName after registration

    // Auth state listeners
    onAuthStateChanged as _onAuthStateChanged,
    onIdTokenChanged as _onIdTokenChanged,

    // Types
    // type Auth, // Firebase Auth instance type
    type User, // Firebase User type
    type UserCredential // Type for result of signIn/createUser
} from "firebase/auth";

// Import the initialized client-side auth instance
import { auth } from "@/app/lib/firebase/clientApp"; // Adjusted path for Next.js App Router

// --- AUTH STATE OBSERVERS ---

/**
 * Attaches an observer for changes to the user's sign-in state.
 * @param cb Callback function that receives the Firebase User object (or null).
 * @returns Unsubscribe function.
 */
export function onAuthStateChanged(cb: (user: User | null) => void) {
    return _onAuthStateChanged(auth, cb);
}

/**
 * Attaches an observer for changes to the user's ID token.
 * @param cb Callback function that receives the Firebase User object (or null).
 * @returns Unsubscribe function.
 */
export function onIdTokenChanged(cb: (user: User | null) => void) {
    return _onIdTokenChanged(auth, cb);
}

// --- AUTHENTICATION ACTIONS ---

/**
 * Signs in a user with their email and password.
 * @param email User's email.
 * @param password User's password.
 * @returns Promise resolving to UserCredential.
 */
export async function signInUserWithEmailAndPassword(email: string, password: string): Promise<UserCredential> {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return userCredential;
    } catch (error: any) {
        console.error("Error signing in with email and password:", error.message);
        // You might want to throw a more specific error or return an error object
        throw error; // Re-throw the error to be handled by the caller
    }
}

/**
 * Creates a new user account with the given email and password.
 * Optionally updates the user's display name.
 * @param email New user's email.
 * @param password New user's password.
 * @param displayName Optional display name for the new user.
 * @returns Promise resolving to UserCredential.
 */
export async function registerUserWithEmailAndPassword(
    email: string,
    password: string,
    displayName?: string
): Promise<UserCredential> {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        if (displayName && userCredential.user) {
            await updateProfile(userCredential.user, { displayName });
            // You might want to refresh the user object or reload if needed,
            // but Firebase Auth usually handles this internally.
        }
        return userCredential;
    } catch (error: any) {
        console.error("Error registering user with email and password:", error.message);
        throw error;
    }
}

/**
 * Signs out the current user.
 * @returns Promise that resolves when sign out is complete.
 */
export async function signOut(): Promise<void> {
    try {
        return await firebaseSignOut(auth);
    } catch (error: any) {
        console.error("Error signing out:", error.message);
        throw error;
    }
}

/**
 * Sends a password reset email to the given email address.
 * @param email User's email address.
 * @returns Promise that resolves when the email is sent.
 */
export async function sendUserPasswordResetEmail(email: string): Promise<void> {
    try {
        await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
        console.error("Error sending password reset email:", error.message);
        throw error;
    }
}

// --- CURRENT USER UTILITIES ---

/**
 * Gets the currently signed-in user.
 * @returns The current Firebase User object or null if not signed in.
 */
export function getCurrentUser(): User | null {
    return auth.currentUser;
}

/**
 * Gets the ID token of the currently signed-in user.
 * @param forceRefresh Whether to force a token refresh.
 * @returns Promise resolving to the ID token string or null.
 */
export async function getIdToken(forceRefresh: boolean = false): Promise<string | null> {
    const user = getCurrentUser();
    if (user) {
        try {
            return await user.getIdToken(forceRefresh);
        } catch (error: any) {
            console.error("Error getting ID token:", error.message);
            throw error;
        }
    }
    return null;
}
