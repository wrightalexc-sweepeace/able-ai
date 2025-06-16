"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const RouteTracker = () => {
  const { user } = useAuth();
  const pathname = usePathname();
  const previousPathRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user?.claims?.lastRoleUsed) return;

    const role = user.claims.lastRoleUsed;
    const previousPath = previousPathRef.current;

    if (previousPath && previousPath !== pathname) {
      if (role === "GIG_WORKER") {
        localStorage.setItem("lastPathGigWorker", previousPath);
      }

      if (role === "BUYER") {
        localStorage.setItem("lastPathBuyer", previousPath);
      }
    }

    previousPathRef.current = pathname;
  }, [pathname, user?.claims?.lastRoleUsed]);

  return null;
};

export default RouteTracker;
