"use client";

import React, { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getLastRoleUsed } from "@/lib/last-role-used";

const RouteTracker = () => {
  const { user } = useAuth();
  const pathname = usePathname();
  const previousPathRef = useRef<string | null>(null);
  const [lastRole, setLastRole] = React.useState<"BUYER" | "GIG_WORKER" | null>(null);

  useEffect(() => {

    if (!user?.claims?.lastRoleUsed) return;

    const role = getLastRoleUsed();
    setLastRole(role);
    const previousPath = previousPathRef.current;

    if (previousPath && previousPath !== pathname) {
      if (lastRole === "GIG_WORKER") {
        localStorage.setItem("lastPathGigWorker", previousPath);
      }

      if (lastRole === "BUYER") {
        localStorage.setItem("lastPathBuyer", previousPath);
      }
    }

    previousPathRef.current = pathname;
  }, [pathname, user?.claims?.lastRoleUsed]);

  return null;
};

export default RouteTracker;
