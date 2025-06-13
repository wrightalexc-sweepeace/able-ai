"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const RouteTracker = () => {
  const { user } = useAuth();
  const pathname = usePathname();

  useEffect(() => {
    if (!user?.claims?.lastRoleUsed) return;

    const role = user.claims.lastRoleUsed;
    if (role === "GIG_WORKER" || role === "BUYER") {
      localStorage.setItem(`lastPath_${role}`, pathname);
    }
  }, [pathname, user?.claims?.lastRoleUsed]);

  return null;
};

export default RouteTracker;
