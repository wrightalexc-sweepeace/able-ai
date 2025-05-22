'use server'

import top10k10plus from './top_10k_10plus';

export async function isPasswordCommon(password: string) {
  return top10k10plus.has(password.toLowerCase());
}
