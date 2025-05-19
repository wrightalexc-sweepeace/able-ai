"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/app/hooks/useAppContext';
import Link from 'next/link';

// Import shared components (ensure paths are correct)
import AiSuggestionBanner from '@/app/components/shared/AiSuggestionBanner';
import IconGrid from '@/app/components/shared/IconGrid';
import ReferralBanner from '@/app/components/shared/ReferralBanner';
import RoleToggle from '@/app/components/shared/RoleToggle';
import SettingsButton from '@/app/components/shared/SettingsButton';

// Import Lucide icons as needed for the specific dashboard
import { Users, CalendarDays, CreditCard, LayoutDashboard, Bell } from 'lucide-react';

import styles from './HomePage.module.css'; // Create this CSS Module
import Image from 'next/image';

// Define this interface if you add the optional summary section
// interface UpcomingGigSummary {
//   id: string;
//   title: string;
//   partnerName: string; // Worker name for buyer, Buyer name for worker
//   dateTime: string;
//   link: string;
// }

export default function BuyerDashboardPage() { // Renamed for clarity
  const router = useRouter();
  const { isAuthenticated, isLoading: loadingAuth, isBuyerMode, isWorkerMode, user: userPublicProfile } = useAppContext();
  const currentActiveRole = isBuyerMode ? 'BUYER' : isWorkerMode ? 'GIG_WORKER' : 'UNKNOWN';
  const THIS_HOME_ROLE = 'BUYER';

  useEffect(() => {
    if (!loadingAuth) {
      if (!isAuthenticated) {
        router.replace('/signin');
      } else if (currentActiveRole !== THIS_HOME_ROLE) {
        // Attempt to switch or redirect based on actual capabilities
        if (userPublicProfile?.isGigWorker) { // Check if user *can* be a worker
          router.push('worker'); // Redirect to worker home
        } else {
          router.replace('/select-role'); // Fallback if current role doesn't match expected and cannot be worker
        }
      }
    }
  }, [isAuthenticated, loadingAuth, currentActiveRole, userPublicProfile, router, THIS_HOME_ROLE]);


  // Define actionItems specific to the role (Buyer)
  const actionItems = [
    { label: "Hire Talent", icon: <Users size={28} />, to: "/buyer/hire" },
    { label: "My Gigs & Bookings", icon: <CalendarDays size={28} />, to: "/buyer/calendar" },
    { label: "Payments & History", icon: <CreditCard size={28} />, to: "/buyer/payments" },
    { label: "Workforce Analytics", icon: <LayoutDashboard size={28} />, to: "/buyer/analytics" }, // Placeholder
  ];

  const handleReferralClick = () => {
    console.log(`${THIS_HOME_ROLE} referral button clicked`);
    // Implement referral logic or navigation
    // router.push('referrals');
  };

  // Optional: Fetch summary data for upcoming gigs/offers
  // const [summaryData, setSummaryData] = useState<UpcomingGigSummary[]>([]);
  // useEffect(() => {
  //   if (isAuthenticated && currentActiveRole === THIS_HOME_ROLE) {
  //     // API call to fetch summary data
  //   }
  // }, [isAuthenticated, currentActiveRole, THIS_HOME_ROLE]);

  if (loadingAuth || !isAuthenticated || currentActiveRole !== THIS_HOME_ROLE) {
    return <div className={styles.loadingContainer}>Loading Dashboard...</div>;
  }

  return (
    <div className={styles.container}>
      <header className={styles.pageHeader}>
        {/* <h1>Buyer</h1>
        {userPublicProfile?.displayName && (
            <p className={styles.welcomeMessage}>
                Welcome back, {userPublicProfile.displayName}!
            </p>
        )} */}
        <Image
          src="/images/ableai2.jpeg"
          alt="App Logo"
          width={73}
          height={74}
          className={styles.logo}
        />
         {/* Notification Icon */}
        {userPublicProfile?.uid && (
          <Link href={`/user/${userPublicProfile.uid}/notifications`} passHref>
            <button className={styles.notificationButton} aria-label="Notifications">
              <Bell size={45} />
            </button>
          </Link>
        )}
      </header>

      <AiSuggestionBanner
        title="Smart Hiring Tip ✨"
        message="We have 10 new bartenders who joined within 5 miles of you - would you like to see their profiles?"
      />

      <h2 className={styles.sectionTitle}>Manage Your Activity</h2>
      <IconGrid items={actionItems} />

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
        title="Refer a Business & Earn £5!"
        description="Help another business find great talent on Able AI and get rewarded."
        buttonText="Get My Referral Link"
        onButtonClick={handleReferralClick}
      />

      <footer className={styles.pageFooter}>
        <RoleToggle lastViewVisited="home" />
        <SettingsButton />
      </footer>
    </div>
  );
}