'use server';

import { updateUserAppContext as updatePgUserAppContext } from '@/app/lib/user.server';

export async function updateUserAppContext({ lastRoleUsed, lastViewVisited }: { lastRoleUsed?: 'BUYER' | 'GIG_WORKER'; lastViewVisited?: string }, idToken: string) {

}