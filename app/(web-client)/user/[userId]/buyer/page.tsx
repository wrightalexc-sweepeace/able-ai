"use client";

import React, { useEffect, useState } from "react";
import {
  signOut as firebaseSignOut,
} from "firebase/auth";
import {
  Users,
  CalendarDays,
  CreditCard,
  LayoutDashboard,
  MessageCircle,
} from "lucide-react";

import AiSuggestionBanner from "@/app/components/shared/AiSuggestionBanner";
import IconGrid from "@/app/components/shared/IconGrid";
import ReferralBanner from "@/app/components/shared/ReferralBanner";
import RoleToggle from "@/app/components/shared/RoleToggle";
import SettingsButton from "@/app/components/shared/SettingsButton";
import Loader from "@/app/components/shared/Loader";
import Logo from "@/app/components/brand/Logo";

import styles from "./HomePage.module.css";
import { useAuth } from "@/context/AuthContext";
import { useAiSuggestionBanner } from "@/hooks/useAiSuggestionBanner";
import {
  getUnreadCountFromDB,
  resetUnreadCountInDB,
} from "@/actions/notifications/useUnreadNotifications";
import { getAllNotificationsAction } from "@/actions/notifications/notifications";
import ScreenHeaderWithBack from "@/app/components/layout/ScreenHeaderWithBack";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/firebase/clientApp";

export default function BuyerDashboardPage() {
  const { user: userPublicProfile } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const { user } = useAuth();
  const router = useRouter();
  const authUserToken = user?.token;

  async function fetchNotifications(token: string) {
    const { unreadCount } = await getAllNotificationsAction(token);

    setUnreadNotifications(unreadCount);
  }

  useEffect(() => {
    getUnreadCountFromDB().then(setUnreadCount).catch(console.error);
  }, []);

  const handleClick = async () => {
    await resetUnreadCountInDB();
    setUnreadCount(0);
  };

  const uid = userPublicProfile?.uid;

  useEffect(() => {
    if (user && authUserToken) {
      fetchNotifications(authUserToken).catch(async (err) => {
        console.error("Failed to fetch notifications:", err);
      });
    }
  }, [user, authUserToken]);

  // AI Suggestion Banner Hook
  const {
    suggestions: aiSuggestions,
    currentIndex,
    isLoading: isLoadingSuggestions,
    error: suggestionsError,
    dismissed: suggestionsDismissed,
    dismiss: dismissSuggestions,
    refresh: refreshSuggestions,
    goToNext,
    goToPrev,
  } = useAiSuggestionBanner({
    role: "buyer",
    userId: uid || "", // Ensure userId is not undefined
    context: {
      // Example context, replace with actual data
      lastGigPosted: "2 days ago",
      activeGigs: 3,
      platformTrends: [
        "increased demand for catering",
        "more remote work options",
      ],
    },
    enabled: !!uid, // Only enable if uid is available
  });

  // Define actionItems specific to the role (Buyer)
  const actionItems = [
    {
      label: "Dashboard",
      icon: <LayoutDashboard size={28} />,
      to: `/user/${uid}/buyer/profile`,
    },
    {
      label: "Hire",
      icon: <Users size={28} />,
      to: `/user/${uid}/buyer/gigs/new`,
    },
    {
      label: "Calendar & Gigs",
      icon: <CalendarDays size={28} />,
      to: `/user/${uid}/buyer/calendar`,
    },
    {
      label: "Payments & History",
      icon: <CreditCard size={28} />,
      to: `/user/${uid}/buyer/payments`,
    },
  ];

  if (!userPublicProfile) {
    return <Loader />;
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <ScreenHeaderWithBack
          isHomePage
          handleClick={handleClick}
          unreadCount={unreadCount}
          unreadNotifications={unreadNotifications}
        />
        {uid && (
          <AiSuggestionBanner
            suggestions={aiSuggestions}
            currentIndex={currentIndex}
            isLoading={isLoadingSuggestions}
            error={suggestionsError}
            dismissed={suggestionsDismissed} // Pass the dismissed state
            onDismiss={dismissSuggestions}
            onRefresh={refreshSuggestions}
            goToNext={goToNext}
            goToPrev={goToPrev}
            userId={uid}
          />
        )}
        <main className={styles.contentWrapper}>
          <IconGrid items={actionItems} color={"#7eeef9"} />
          <ReferralBanner role="BUYER" />
        </main>
        <footer className={styles.pageFooter}>
          <RoleToggle />
          <SettingsButton />
        </footer>
      </div>
    </div>
  );
}
