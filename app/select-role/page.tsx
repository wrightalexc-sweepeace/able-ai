"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/app/hooks/useAppContext";
import Logo from "@/app/components/brand/Logo";
import ActionButton from "./ActionButton";
import styles from "./SelectRolePage.module.css";
import Loader from "@/app/components/shared/Loader";

export default function SelectRolePage() {
  const router = useRouter();
  const { updateUserContext, isLoading: loadingAuth, user } = useAppContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not authenticated or auth state is still loading
  useEffect(() => {
    if (!loadingAuth && !user?.isAuthenticated) {
      console.log({ user})
      // router.push("/signin");
    }
    if (user?.isAuthenticated) {
      console.log({ user })
    }
  }, [user?.isAuthenticated, loadingAuth, router]);

  const handleRoleSelection = async (role: "BUYER" | "GIG_WORKER") => {
    if (!updateUserContext) {
      setError("User context is not available. Please try again.");
      console.error(
        "updateUserContext function is not available from useAppContext."
      );
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      // 1. Update in context (which should trigger backend update via API)
      await updateUserContext({ lastRoleUsed: role });

      // 2. Check if user have finished onboarding

      // 3. Navigate to the appropriate dashboard
      if (role === "BUYER") {
        router.push(`user/${user?.uid || 'this_user'}/buyer`); // Or your buyer landing page
      } else if (role === "GIG_WORKER") {
        router.push(`user/${user?.uid || 'this_user'}/worker`); // Or your worker landing page
      }
    } catch (err) {
      console.error("Error setting role:", err);
      setError("Failed to set your role. Please try again.");
      setIsLoading(false);
    }
  };

  if (loadingAuth) {
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
            bgColor="#7eeef9" // Light blue for "Hire"
            onClick={() => handleRoleSelection("BUYER")}
            disabled={isLoading}
          >
            Hire a Gig Worker
          </ActionButton>
          <ActionButton
            bgColor="#41a1e8" // Darker blue for "Find Work"
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
