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
import { UserCircle, Briefcase, CalendarCheck2, DollarSign } from 'lucide-react';

import styles from './HomePage.module.css'; // Create this CSS Module
import Image from 'next/image';
import Loader from '@/app/components/shared/Loader';
import Logo from '@/app/components/brand/Logo';

// Define this interface if you add the optional summary section
// interface UpcomingGigSummary {
//   id: string;
//   title: string;
//   partnerName: string; // Worker name for buyer, Buyer name for worker
//   dateTime: string;
//   link: string;
// }

export default function WorkerDashboardPage() { // Renamed for clarity
  const router = useRouter();
  // const { isAuthenticated, isLoading: loadingAuth, isBuyerMode, isWorkerMode, user: userPublicProfile } = useAppContext();
  const currentActiveRole = 'GIG_WORKER';
  const THIS_HOME_ROLE = 'GIG_WORKER';

  // useEffect(() => {
  //   if (!loadingAuth) {
  //     if (!isAuthenticated) {
  //       router.replace('/signin');
  //     } else if (currentActiveRole !== THIS_HOME_ROLE) {
  //       // Attempt to switch or redirect based on actual capabilities
  //       if (userPublicProfile?.isBuyer) { // Check if user *can* be a buyer
  //         router.push('buyer'); // Redirect to buyer home
  //       } else {
  //         router.replace('/select-role'); // Fallback if current role doesn't match expected and cannot be buyer
  //       }
  //     }
  //   }
  // }, [isAuthenticated, loadingAuth, currentActiveRole, userPublicProfile, router, THIS_HOME_ROLE]);

  const uid = 'test';
  // Define actionItems specific to the role (Worker)
  const actionItems = [
    { label: "Gigfolio", icon: <UserCircle size={28} />, to: `/user/${uid}/worker/profile` },
    { label: "Offers", icon: <Briefcase size={28} />, to: `/user/${uid}/worker/offers` },
    { label: "Calendar & Gigs", icon: <CalendarCheck2 size={28} />, to: `/user/${uid}/worker/calendar` },
    { label: "Earnings & History", icon: <DollarSign size={28} />, to: `/user/${uid}/worker/earnings` },
  ];


  // Optional: Fetch summary data for upcoming gigs/offers
  // const [summaryData, setSummaryData] = useState<UpcomingGigSummary[]>([]);
  // useEffect(() => {
  //   if (isAuthenticated && currentActiveRole === THIS_HOME_ROLE) {
  //     // API call to fetch summary data
  //   }
  // }, [isAuthenticated, currentActiveRole, THIS_HOME_ROLE]);

  // if (loadingAuth || !isAuthenticated || currentActiveRole !== THIS_HOME_ROLE) {
  //   return <Loader />
  // }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <header className={styles.pageHeader}>
          {/* <h1>Worker</h1>
          {userPublicProfile?.displayName && (
              <p className={styles.welcomeMessage}>
                  Welcome back, {userPublicProfile.displayName}!
              </p>
          )} */}
        <Logo width={60} height={60} />
          {/* Notification Icon */}
          {uid && (
            <Link href={`/user/${uid}/notifications`} passHref>
              <button className={styles.notificationButton} aria-label="Notifications">
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
          // title="Gig Opportunity Alert 💡"
          message="Hi! If you can be available next Tuesday, you are 75% likely to get a shift."
        />

        {/* <h2 className={styles.sectionTitle}>Manage Your Activity</h2> */}
        <IconGrid items={actionItems} />

        {/* Optional Summary Section - Example Structure
        {summaryData.length > 0 && (
          <section className={styles.summarySection}>
            <h2 className={styles.sectionTitle}>
              Your Next Gig
            </h2>
            <ul className={styles.summaryList}>
              {summaryData.slice(0,3).map(item => ( // Show first 3
                  <li key={item.id}><Link href={item.link}>{item.title} with {item.partnerName} on {item.dateTime}</Link></li>
              ))}
            </ul>
            {summaryData.length > 3 && <Link href='/worker/calendar' className={styles.viewAllLink}>View All</Link>>}
          </section>
        )}
        */}


        <ReferralBanner
          title="Refer a worker and earn £5!"
        />

        <footer className={styles.pageFooter}>
          <RoleToggle />
          <SettingsButton />
        </footer>
      </div>
    </div>
  );
}