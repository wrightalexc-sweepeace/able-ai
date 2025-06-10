"use client";

import { ExtendedUser } from '../context/UserContext';

export const SESSION_STORAGE_KEY_USER = 'extendedUserCache';
export const CACHE_MAX_AGE_MS = 5 * 60 * 1000; // 5 minutes

// --- Session Storage for ExtendedUser Cache ---

interface CachedUserData {
  user: ExtendedUser;
  timestamp: number;
}

export const getCachedUser = (): CachedUserData | null => {
  if (typeof window === 'undefined') return null;
  try {
    const cachedItem = sessionStorage.getItem(SESSION_STORAGE_KEY_USER);
    if (!cachedItem) return null;
    const data = JSON.parse(cachedItem) as CachedUserData;
    if (data && data.user && typeof data.timestamp === 'number') {
      return data;
    }
    // Clear corrupted or malformed cache
    if (typeof window !== 'undefined') { // Re-check window as sessionStorage might throw if called in SSR after initial check
        sessionStorage.removeItem(SESSION_STORAGE_KEY_USER);
    }
    return null;
  } catch (error) {
    console.warn('UserStorage: Failed to retrieve or parse cached user data:', error);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(SESSION_STORAGE_KEY_USER); // Clear corrupted cache
    }
    return null;
  }
};

export const saveUserToCache = (user: ExtendedUser): void => {
  if (typeof window === 'undefined') return;
  try {
    const dataToCache: CachedUserData = { user, timestamp: Date.now() };
    sessionStorage.setItem(SESSION_STORAGE_KEY_USER, JSON.stringify(dataToCache));
  } catch (error) {
    console.warn('UserStorage: Failed to save user to cache:', error);
  }
};

export const clearUserCache = (): void => {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(SESSION_STORAGE_KEY_USER);
};

// --- Local Storage for User Preferences ---

const LOCAL_STORAGE_LAST_ROLE_USED = "lastRoleUsed";
const LOCAL_STORAGE_LAST_VIEW_BUYER = "lastViewVisitedBuyer";
const LOCAL_STORAGE_LAST_VIEW_WORKER = "lastViewVisitedWorker";
const LOCAL_STORAGE_IS_QA_VIEW = "isViewQA";

const getLocalItem = (key: string): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(key);
};

const setLocalItem = (key: string, value: string): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, value);
};

const removeLocalItem = (key: string): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(key);
};

export const getLastRoleUsed = (): "BUYER" | "GIG_WORKER" => {
  const role = getLocalItem(LOCAL_STORAGE_LAST_ROLE_USED);
  if (role === "BUYER" || role === "GIG_WORKER") {
    return role;
  }
  return "BUYER";
};

export const setLastRoleUsed = (role: "BUYER" | "GIG_WORKER"): void => {
  setLocalItem(LOCAL_STORAGE_LAST_ROLE_USED, role);
};

export const getLastViewVisitedBuyer = (): string | null => {
  return getLocalItem(LOCAL_STORAGE_LAST_VIEW_BUYER);
};

export const setLastViewVisitedBuyer = (view: string): void => {
  setLocalItem(LOCAL_STORAGE_LAST_VIEW_BUYER, view);
};

export const getLastViewVisitedWorker = (): string | null => {
  return getLocalItem(LOCAL_STORAGE_LAST_VIEW_WORKER);
};

export const setLastViewVisitedWorker = (view: string): void => {
  setLocalItem(LOCAL_STORAGE_LAST_VIEW_WORKER, view);
};

export const getIsQAView = (): boolean => {
  return getLocalItem(LOCAL_STORAGE_IS_QA_VIEW) === "true";
};

export const setIsQAView = (isQA: boolean): void => {
  setLocalItem(LOCAL_STORAGE_IS_QA_VIEW, isQA.toString());
};

export const clearUserPreferencesFromLocalStorage = (): void => {
  removeLocalItem(LOCAL_STORAGE_LAST_ROLE_USED);
  removeLocalItem(LOCAL_STORAGE_LAST_VIEW_BUYER);
  removeLocalItem(LOCAL_STORAGE_LAST_VIEW_WORKER);
  removeLocalItem(LOCAL_STORAGE_IS_QA_VIEW);
};
