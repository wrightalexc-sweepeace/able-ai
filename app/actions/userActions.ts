'use server';
import { db } from "@/app/lib/drizzle/db";
import { UsersTable } from "@/app/lib/drizzle/schema/users";
import { eq } from "drizzle-orm";

export async function getUserByFirebaseUid(firebaseUid: string, idToken: string) {
}