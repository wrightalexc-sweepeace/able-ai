"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/app/components/brand/Logo";
import ActionButton from "./ActionButton";
import styles from "./SelectRolePage.module.css";
import Loader from "@/app/components/shared/Loader";
import { toast } from "sonner";
import { useAuth } from '@/context/AuthContext';
import { getIdTokenResult } from "firebase/auth";
import { updateLastRoleUsedFirebaseAction } from "@/actions/auth/singin";
import { getLastPathByRole } from "@/lib/redirect";

export default function SelectRolePage() {
  const router = useRouter();
  const { user, loading: loadingAuth } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loadingAuth) return;

    const lastRoleUsed = user?.claims?.lastRoleUsed;
    const lastPath = getLastPathByRole(lastRoleUsed);

    if (lastRoleUsed && lastPath) {
      router.push(lastPath);
    }
  }, [user, loadingAuth, router]);

  const handleRoleSelection = async (role: "BUYER" | "GIG_WORKER") => {
    if (!user) {
      setError("User context is not available. Please try again.");
      return;
    }
  
    setIsLoading(true);
    setError(null);
  
    try {
      
      const response = await updateLastRoleUsedFirebaseAction(user.uid, role);
  
      if (response?.error) {
        toast.error("Failed to update role: " + response.error);
        setIsLoading(false);
        return;
      }
  
      // Force refresh of token to get new claims
      const refreshedToken = await getIdTokenResult(user, true);
      const newClaims = refreshedToken.claims;

      
      // Save rute initial in the localstorage
      if (role === "BUYER") {
          const path = `user/${user.uid || "this_user"}/buyer/gigs/new`;
          localStorage.setItem("lastPathBuyer", path);
          
          router.push(path);
      } else if (role === "GIG_WORKER") {
        const isWorker = ["GIG_WORKER", "QA"].includes(newClaims.role);
        
        const path = isWorker
          ? `user/${user.uid || "this_user"}/worker`
          : `user/${user.uid || "this_user"}/worker/onboarding`;
 
          localStorage.setItem("lastPathGigWorker", path);
          router.push(path);
      }
    } catch (err) {
      console.error("Error setting role:", err);
      setError("Failed to set your role. Please try again.");
      setIsLoading(false);
    }
  };
  
  if (isLoading) {
    return <Loader />;
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.logoWrapper}>
          <Logo />
        </div>

        <div className={styles.greeting}>
          <p className={styles.intro}>
            Hello, I&apos;m Able, it&apos;s lovely to meet you.
          </p>
          <p className={styles.question}>What do you want to do today?</p>
        </div>

        {error && <p className={styles.errorMessage}>{error}</p>}

        <div className={styles.actions}>
          <ActionButton
            bgColor="#7eeef9"
            onClick={() => handleRoleSelection("BUYER")}
            disabled={isLoading}
          >
            Hire a Gig Worker
          </ActionButton>
          <ActionButton
            bgColor="#41a1e8"
            onClick={() => handleRoleSelection("GIG_WORKER")}
            disabled={isLoading}
          >
            Find Gig Work
          </ActionButton>
        </div>

        <p className={styles.note}>
          We are focusing on hospitality and events gigs right now... but add
          all your skills and watch this space as we enable gig work across
          industries.
        </p>
      </div>
    </div>
  );
}
