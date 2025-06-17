// app/hooks/useAppContext.ts (example)
"use client";

import { User } from "firebase/auth";
import { useEffect, useState } from "react";

export interface ExtendedUser extends User {
  appRole?: "ADMIN" | "SUPER_ADMIN" | "QA" | "USER";
  lastRoleUsed?: "BUYER" | "GIG_WORKER";
  isBuyer?: boolean;
  isGigWorker?: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isQA: boolean;
  isBuyerMode: boolean; // Based on lastRoleUsed
  isWorkerMode: boolean; // Based on lastRoleUsed
  canBeBuyer: boolean; // User *can* be a buyer
  canBeGigWorker: boolean; // User *can* be a worker
  lastViewVisitedBuyer: string | null;
  lastViewVisitedWorker: string | null;
}

interface AppContextValue {
  user: ExtendedUser | null;
  isLoading: boolean;
  updateUserContext: (updates: {
    lastRoleUsed?: "BUYER" | "GIG_WORKER";
    lastViewVisited?: string;
  }) => Promise<{ ok: boolean; error?: string | unknown }>;
}

export function useAppContext() {
  const [user, setUser] = useState<ExtendedUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.uid && user?.isAuthenticated) {
      setIsLoading(false);
    }
  }, [user?.uid, user?.isAuthenticated]);
}
