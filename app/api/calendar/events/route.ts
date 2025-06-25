import { NextResponse } from 'next/server';
import { type NextRequest } from 'next/server'
import { MOCK_EVENTS } from '@/app/(web-client)/user/[userId]/worker/calendar/mockData';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get('userId');

  if (userId === 'notfound') {
    return NextResponse.json({ error: 'Events not found' }, { status: 404 });
  }
  try {

    return NextResponse.json({ events: MOCK_EVENTS });

  } catch (error: any) {
    console.error("Error registering user:", error);
    return NextResponse.json({ error: error.message, ok: false }, { status: 500 });
  }
}