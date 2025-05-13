// app/api/protected-example/route.ts
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth"; // Path to your auth options
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (session && session.user) {
    // Optionally, check for specific roles from your session.user.appRole
    // const userRole = (session.user as ExtendedUser).appRole;
    // if (userRole !== 'ADMIN') {
    //   return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    // }
    return NextResponse.json({
      content: "This is protected content. You can access this content because you are signed in.",
      user: session.user,
    });
  }

  return NextResponse.json(
    { error: "You must be signed in to view the protected content on this page." },
    { status: 401 }
  );
}
