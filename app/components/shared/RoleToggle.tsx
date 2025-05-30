"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/app/hooks/useAppContext";
import styles from "./RoleToggle.module.css";
import { toast } from "sonner";

const RoleToggle: React.FC<{ lastViewVisited?: string }> = ({
  lastViewVisited,
}) => {
  const router = useRouter();
  const { isLoading, user } = useAppContext();
  const currentActiveRole = user?.isBuyerMode
    ? "BUYER"
    : user?.isWorkerMode
    ? "GIG_WORKER"
    : "QA";

  const handleToggle = async (newRole: "BUYER" | "GIG_WORKER") => {
    if (newRole === currentActiveRole && !lastViewVisited) return;

    try {
      // Redirect based on the new role
      router.push(newRole === "GIG_WORKER" ? "worker" : "buyer");
    } catch (error) {
      console.error("Failed to switch role:", error);
      toast.error("Failed to switch roles. Please try again.");
    }
  };

  if (user?.isAuthenticated) {
    if (user?.lastRoleUsed === "BUYER" && !user?.canBeGigWorker) {
      return null;
    }
    if (user?.lastRoleUsed === "GIG_WORKER" && !user?.canBeBuyer) {
      return null;
    }
  }
  return (
    <div className={styles.toggleContainer}>
      <label className={styles.switchLabel}>
        <span>
          Switch to {currentActiveRole === "BUYER" ? "worker" : "buyer"}
        </span>
        <input
          type="checkbox"
          onChange={() =>
            handleToggle(currentActiveRole === "BUYER" ? "GIG_WORKER" : "BUYER")
          }
          disabled={isLoading}
          className={styles.switchInput}
        />
        <span className={styles.switchSlider}></span>
      </label>
    </div>
  );
};
export default RoleToggle;
