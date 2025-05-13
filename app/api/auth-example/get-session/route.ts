// app/api/auth-example/get-session/route.ts
// Note: For server-side access to session in App Router, you typically use `auth()` from your NextAuth config.
// This route handler shows how a client might fetch its own session if needed, or how an API can check it.
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth"; // Path to your auth options
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions); // Use authOptions
  if (session) {
    return NextResponse.json(session);
  }
  return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
}
