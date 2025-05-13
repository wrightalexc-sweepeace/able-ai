import { User as NextAuthUser } from "next-auth";
import type { NextAuthOptions } from "next-auth";
import { FirestoreAdapter } from "@auth/firebase-adapter"
import CredentialsProvider from "next-auth/providers/credentials";

import firebaseAdmin from "@/lib/firebase-admin";
import { firestore } from "@/lib/firestore-admin";
import { findOrCreatePgUserAndUpdateRole } from "@/app/lib/user.server";

interface AppUser extends NextAuthUser {
    uid?: string; // From Firebase, will be in NextAuth token
    appRole?: 'USER' | 'ADMIN' | 'QA' | 'SUPER_ADMIN'; // From PostgreSQL
    isBuyer?: boolean;       // From PostgreSQL
    isGigWorker?: boolean;   // From PostgreSQL
    lastRoleUsed?: 'BUYER' | 'WORKER' | null; // From PostgreSQL
    lastViewVisited?: string | null; // From PostgreSQL
    // other PG specific fields if needed in session
    email: string | null | undefined;
    fullName: string | null | undefined;
  }

// Define a type that extends NextAuthUser to include our custom properties
interface ExtendedUser extends NextAuthUser {
    uid?: string; // This is firebaseUid
    email?: string | null;
    fullName?: string | null; // This will come from PG
    picture?: string | null; // From Firebase token
    appRole?: 'USER' | 'ADMIN' | 'QA' | 'SUPER_ADMIN';
    isBuyer?: boolean;
    isGigWorker?: boolean;
    lastRoleUsed?: 'BUYER' | 'WORKER' | null;
    lastViewVisited?: string | null;
}

export const authOptions = {
    providers: [
        CredentialsProvider({
            name: "Firebase",
            credentials: {
                idToken: { label: "Firebase ID Token", type: "text" },
                // Add role here if you plan to pass it from client during signIn
                role: { label: "User Role", type: "text" },
            },
            async authorize(credentials): Promise<ExtendedUser | null> {
                const idToken = credentials?.idToken;
                const roleFromClient = credentials?.role;
        
                if (idToken) {
                    try {
                        const decodedToken = await firebaseAdmin.auth().verifyIdToken(idToken);
                        if (!decodedToken.uid || !decodedToken.email) return null;
        
                        const pgUser = await findOrCreatePgUserAndUpdateRole({ // This function MUST return these new fields
                            user: {
                                id: decodedToken.id,
                                uid: decodedToken.uid,
                                email: decodedToken.email,
                                name: decodedToken.name || decodedToken.email?.split('@')[0] || "User",
                                lastRoleUsed: roleFromClient as ('BUYER' | 'WORKER' | undefined),
                            },
                            expires: decodedToken.exp.toString(),

                        });
        
                        if (!pgUser) return null;
        
                        return {
                            // NextAuth standard fields
                            id: decodedToken.uid, // Use Firebase UID as NextAuth's primary 'id' for the session user object
                            email: decodedToken.email,
                            name: pgUser.fullName, // Use full name from PG
                            image: decodedToken.picture, // NextAuth uses 'image' not 'picture'
        
                            // Custom fields
                            uid: decodedToken.uid, // Explicitly firebaseUid
                            fullName: pgUser.fullName, // From PG
                            picture: decodedToken.picture, // From Firebase token
                            appRole: pgUser.appRole,
                            isBuyer: pgUser.isBuyer,
                            isGigWorker: pgUser.isGigWorker,
                            lastRoleUsed: pgUser.lastRoleUsed,
                            lastViewVisited: pgUser.lastViewVisited,
                        } as ExtendedUser;
                    } catch (err) { 
                        console.error("Error verifying Firebase ID token:", err);
                        return null;
                     }
                }
                return null;
            },
        }),
    ],

    secret: process.env.NEXTAUTH_SECRET,

    pages: {
        signIn: "/signin", // Your custom sign-in page
        // error: '/auth/error', // Custom error page
    },

    callbacks: {
        async jwt({ token, user, trigger, session }) {
            const extendedUser = user as ExtendedUser | undefined;
            if (extendedUser) { // On sign-in
                token.uid = extendedUser.uid;
                token.appRole = extendedUser.appRole;
                token.isBuyer = extendedUser.isBuyer;
                token.isGigWorker = extendedUser.isGigWorker;
                token.lastRoleUsed = extendedUser.lastRoleUsed;
                token.lastViewVisited = extendedUser.lastViewVisited;
                token.fullName = extendedUser.fullName; // Ensure fullName from PG is in token
                // Ensure 'name' and 'picture' in the token are also set if not already
                token.name = extendedUser.name || token.name;
                token.picture = extendedUser.picture || token.picture; // 'picture' is standard in JWT, 'image' in session.user
            }

            // If you have a trigger to update the session (e.g., user changes role client-side)
            if (trigger === "update" && session?.userContext) {
                const { lastRoleUsed, lastViewVisited } = session.userContext;
                if (lastRoleUsed) token.lastRoleUsed = lastRoleUsed;
                if (lastViewVisited) token.lastViewVisited = lastViewVisited;
                // Potentially re-fetch other user details from PG if they might have changed
            }
            return token;
        },
        async session({ session, token }) {
            // Standard NextAuth session.user fields
            if (session.user) {
                session.user.name = token.fullName as string | null | undefined || token.name as string | null | undefined; // Prioritize fullName from PG
                session.user.image = token.picture as string | null | undefined; // 'picture' from token maps to 'image'
            }

            // Custom fields for AppUser
            const appUser = session.user as AppUser;
            if (token && appUser) {
                appUser.id = token.uid as string; // Override NextAuth default id with firebaseUid
                appUser.uid = token.uid as string;
                appUser.appRole = token.appRole as typeof appUser.appRole;
                appUser.isBuyer = token.isBuyer as boolean;
                appUser.isGigWorker = token.isGigWorker as boolean;
                appUser.lastRoleUsed = token.lastRoleUsed as typeof appUser.lastRoleUsed;
                appUser.lastViewVisited = token.lastViewVisited as string | null;
                appUser.fullName = token.fullName as string | null; // Add fullName
            }
            return session;
        },
    },

    events: {
        async signIn({ user, isNewUser = false }) {
            console.log(`User signed in: ${user.id}, New User: ${isNewUser}`);
            // Potentially trigger other actions here, like updating last login in PG
        },
    },
    debug: process.env.NODE_ENV !== "production",
    adapter: FirestoreAdapter(firestore),
}  satisfies NextAuthOptions

