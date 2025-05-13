import { DefaultSession, DefaultUser } from "next-auth";
// To make custom fields available on the JWT token type
import { JWT as DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
    interface Session {
        user: User;
        userContext?: {
            lastRoleUsed?: 'BUYER' | 'GIG_WORKER';
            lastViewVisited?: string;
        };
    }

    interface User extends DefaultUser {
        uid?: string;
        appRole?: 'USER' | 'ADMIN' | 'QA' | 'SUPER_ADMIN';
        isBuyer?: boolean;
        isGigWorker?: boolean;
        lastRoleUsed?: 'BUYER' | 'GIG_WORKER' | null;
        lastViewVisited?: string | null;
        fullName?: string | null;
    }
}

declare module "next-auth/jwt" {
    interface JWT extends DefaultJWT {
        user: User;
        userContext?: {
            lastRoleUsed?: 'BUYER' | 'GIG_WORKER';
            lastViewVisited?: string;
        };
    }
}
