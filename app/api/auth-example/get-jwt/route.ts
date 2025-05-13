// app/api/auth-example/get-jwt/route.ts
import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

const secret = process.env.NEXTAUTH_SECRET;

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret });
  if (token) {
    return NextResponse.json(token);
  }
  return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
}
