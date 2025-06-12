"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user?.claims.role) {
      router.push("/signin");
    }
  }, [loading, user?.claims.role]);

  if (loading || !user) {
    return <div className="p-4">Loading...</div>;
  }

  return <>{children}</>;
};
