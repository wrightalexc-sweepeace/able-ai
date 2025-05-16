// app/select-role/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; // App Router navigation
import { useAppContext } from "@/app/hooks/useAppContext";
import { useFirebaseAuth } from "@/app/hooks/useFirebaseAuth";
import Logo from "@/app/components/brand/Logo"; // Reusing Logo
import ActionButton from "./ActionButton";
import styles from "./SelectRolePage.module.css";

export default function SelectRolePage() {
  const router = useRouter();
  const { user, loading: loadingAuth, idToken } = useFirebaseAuth();
  const { updateUserContext } = useAppContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isViewQA = React.useMemo(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("isViewQA") === "true";
  }, []);

  // Redirect if not authenticated or auth state is still loading
  useEffect(() => {
    if (!loadingAuth && !isViewQA && !user) {
      router.push("/signin"); // Or your login page
    }
  }, [user, loadingAuth, router, isViewQA]);

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
      await updateUserContext({ lastRoleUsed: role }, idToken);

      // 2. Save to localStorage for immediate persistence on the client
      if (typeof window !== "undefined") {
        localStorage.setItem("currentActiveRole", role);
      }

      // 3. Navigate to the appropriate dashboard
      if (role === "BUYER") {
        router.push("/buyer/dashboard"); // Or your buyer landing page
      } else if (role === "GIG_WORKER") {
        router.push("/worker/dashboard"); // Or your worker landing page
      }
    } catch (err) {
      console.error("Error setting role:", err);
      setError("Failed to set your role. Please try again.");
      setIsLoading(false);
    }
    // setLoading(false) will be handled by navigation or if error occurs
  };

  if (!isViewQA && (loadingAuth || (!loadingAuth && !user))) {
    // Show a loading spinner or skeleton screen while auth is checked
    return (
      <div className={styles.container}>
        <p className={styles.loadingText}>Loading...</p>
      </div>
    );
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
