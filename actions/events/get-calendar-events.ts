"use server";

import { MOCK_EVENTS } from '@/app/(web-client)/user/[userId]/worker/calendar/mockData';

export async function getCalendarEvents({ userId, isViewQA }: { userId: string; role?: string; isViewQA?: boolean; }) {

  if(isViewQA) return { events: MOCK_EVENTS };

  if (!userId) {
    return { error: 'User id is required', events: [], status: 404 };
  }

  try {

    return { events: MOCK_EVENTS };

  } catch (error: any) {
    console.error("Error registering user:", error);
    return { error: error.message, events: [], status: 500 };
  }
}
