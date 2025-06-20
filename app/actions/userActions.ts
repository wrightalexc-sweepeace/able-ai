'use server';
import { db } from "@/lib/drizzle/db";
import { UsersTable } from "@/lib/drizzle/schema/users";
import { eq } from "drizzle-orm";

export async function getUserByFirebaseUid(firebaseUid: string, idToken: string) {
}