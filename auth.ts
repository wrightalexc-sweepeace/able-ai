import { User as NextAuthUser } from "next-auth";
import type { NextAuthOptions } from "next-auth";
import { FirestoreAdapter } from "@auth/firebase-adapter"
import CredentialsProvider from "next-auth/providers/credentials";

import firebaseAdmin from "@/lib/firebase-admin";
import { firestore } from "@/lib/firestore-admin";
import { findOrCreatePgUserAndUpdateRole } from "@/app/lib/user.server";

// Define a type that extends NextAuthUser to include our custom properties
interface ExtendedUser extends NextAuthUser {
    uid?: string;
    email?: string | null;
    fullName?: string | null;
    picture?: string | null;
    appRole?: string; // Your application-specific role
    // Add any other properties from the decoded Firebase token you want
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
                const roleFromClient = credentials?.role; // Capture role from client

                if (idToken) {
                    try {
                        const decodedToken = await firebaseAdmin // Use the imported admin namespace
                            .auth()
                            .verifyIdToken(idToken);

                        if (!decodedToken.uid || !decodedToken.email) {
                            return null;
                        }

                        const pgUser = await findOrCreatePgUserAndUpdateRole({
                            firebaseUid: decodedToken.uid,
                            email: decodedToken.email,
                            displayName: decodedToken.name || decodedToken.email?.split('@')[0] || "User",
                            // Pass the role from client if available, or determine default
                            initialRole: roleFromClient as ('BUYER' | 'GIG_WORKER' | undefined),
                        });

                        if (!pgUser) return null;

                        return {
                            id: decodedToken.uid,
                            uid: decodedToken.uid,
                            email: decodedToken.email,
                            name: pgUser.fullName,
                            picture: decodedToken.picture,
                            appRole: pgUser.appRole,
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
        async jwt({ token, user }) {
            if (user) {
                const extendedUser = user as ExtendedUser;
                token.uid = extendedUser.uid;
                token.appRole = extendedUser.appRole;
            }
            return token;
        },
        async session({ session, token }) {
            if (token && session.user) {
                (session.user as ExtendedUser).id = token.uid as string;
                (session.user as ExtendedUser).uid = token.uid as string;
                (session.user as ExtendedUser).appRole = token.appRole as string;
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

