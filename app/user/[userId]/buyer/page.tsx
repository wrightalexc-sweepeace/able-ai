"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAppContext } from "@/app/hooks/useAppContext";
import Link from "next/link";

// Import shared components (ensure paths are correct)
import AiSuggestionBanner from "@/app/components/shared/AiSuggestionBanner";
import IconGrid from "@/app/components/shared/IconGrid";
import ReferralBanner from "@/app/components/shared/ReferralBanner";
import RoleToggle from "@/app/components/shared/RoleToggle";
import SettingsButton from "@/app/components/shared/SettingsButton";

// Import Lucide icons as needed for the specific dashboard
import { Users, CalendarDays, CreditCard, LayoutDashboard } from "lucide-react";

import styles from "./HomePage.module.css"; // Create this CSS Module
import Image from "next/image";
import Loader from "@/app/components/shared/Loader";
import Logo from "@/app/components/brand/Logo"; // Assuming you have a Logo component
import { Toaster } from "sonner";

// Define this interface if you add the optional summary section
// interface UpcomingGigSummary {
//   id: string;
//   title: string;
//   partnerName: string; // Worker name for buyer, Buyer name for worker
//   dateTime: string;
//   link: string;
// }

export default function BuyerDashboardPage() {
  // Renamed for clarity
  const router = useRouter();
  const pathname = usePathname();
  const {
    isLoading: loadingAuth,
    user: userPublicProfile,
    updateUserContext,
  } = useAppContext();

  useEffect(() => {
    if (!loadingAuth && userPublicProfile?.isAuthenticated) {
      if (userPublicProfile?.canBeBuyer) {
        updateUserContext({
          lastRoleUsed: "BUYER", // Ensure the context reflects the current role
          lastViewVisited: pathname, // Update last view visited
        });
      } else {
        router.replace("/select-role");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userPublicProfile?.isAuthenticated, loadingAuth]);

  const uid = userPublicProfile?.uid;

  // Define actionItems specific to the role (Buyer)
  const actionItems = [
    {
      label: "Dashboard",
      icon: <LayoutDashboard size={28} />,
      to: `/user/${uid}/buyer/analytics`,
    },
    { label: "Hire", icon: <Users size={28} />, to: "/onboard-buyer" },
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

  // Optional: Fetch summary data for upcoming gigs/offers
  // const [summaryData, setSummaryData] = useState<UpcomingGigSummary[]>([]);
  // useEffect(() => {
  //   if (isAuthenticated && currentActiveRole === THIS_HOME_ROLE) {
  //     // API call to fetch summary data
  //   }
  // }, [isAuthenticated, currentActiveRole, THIS_HOME_ROLE]);

  if (loadingAuth || !userPublicProfile?.isAuthenticated) {
    return <Loader />;
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <header className={styles.pageHeader}>
          {/* <h1>Buyer</h1>
          {userPublicProfile?.displayName && (
              <p className={styles.welcomeMessage}>
                  Welcome back, {userPublicProfile.displayName}!
              </p>
          )} */}
          {/* <Image
            src="/images/ableai2.jpeg"
            alt="App Logo"
            width={60}
            height={60}
            className={styles.logo}
          /> */}
          <Logo width={60} height={60} />
          {/* Notification Icon */}
          {userPublicProfile?.uid && (
            <Link
              href={`/user/${userPublicProfile.uid}/notifications`}
              passHref
            >
              <button
                className={styles.notificationButton}
                aria-label="Notifications"
              >
                <Image
                  src="/images/notifications.svg"
                  alt="Notifications"
                  width={45}
                  height={45}
                />
              </button>
            </Link>
          )}
        </header>

        <AiSuggestionBanner
          // title="Smart Hiring Tip ✨"
          message="We have 10 new bartenders who joined within 5 miles of you - would you like to see their profiles?"
        />

        {/* <h2 className={styles.sectionTitle}>Manage Your Activity</h2> */}
        <IconGrid items={actionItems} color={"#7eeef9"} />

        {/* Optional Summary Section - Example Structure
        {summaryData.length > 0 && (
          <section className={styles.summarySection}>
            <h2 className={styles.sectionTitle}>
              Upcoming Gigs
            </h2>
            <ul className={styles.summaryList}>
              {summaryData.slice(0,3).map(item => ( // Show first 3
                  <li key={item.id}><Link href={item.link}>{item.title} with {item.partnerName} on {item.dateTime}</Link></li>
              ))}
            </ul>
            {summaryData.length > 3 && <Link href='/buyer/calendar' className={styles.viewAllLink}>View All</Link>}
          </section>
        )}
        */}

        <ReferralBanner
          title="Refer a business and earn £5!"
          className={styles.customHover}
        />

        <footer className={styles.pageFooter}>
          <RoleToggle />
          <SettingsButton />
        </footer>
      </div>
      <Toaster />
    </div>
  );
}
