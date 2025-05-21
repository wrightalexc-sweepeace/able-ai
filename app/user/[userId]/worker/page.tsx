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
// import NotifIcon from '@mui/icons-material/NotificationsSharp';

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

export default function WorkerDashboardPage() { // Renamed for clarity
  const router = useRouter();
  const { isAuthenticated, isLoading: loadingAuth, isBuyerMode, isWorkerMode, user: userPublicProfile } = useAppContext();
  const currentActiveRole = isBuyerMode ? 'BUYER' : isWorkerMode ? 'GIG_WORKER' : 'UNKNOWN';
  const THIS_HOME_ROLE = 'GIG_WORKER';

  useEffect(() => {
    if (!loadingAuth) {
      if (!isAuthenticated) {
        router.replace('/signin');
      } else if (currentActiveRole !== THIS_HOME_ROLE) {
        // Attempt to switch or redirect based on actual capabilities
        if (userPublicProfile?.isBuyer) { // Check if user *can* be a buyer
          router.push('buyer'); // Redirect to buyer home
        } else {
          router.replace('/select-role'); // Fallback if current role doesn't match expected and cannot be buyer
        }
      }
    }
  }, [isAuthenticated, loadingAuth, currentActiveRole, userPublicProfile, router, THIS_HOME_ROLE]);


  // Define actionItems specific to the role (Worker)
  const actionItems = [
    { label: "My Gigfolio", icon: <UserCircle size={28} />, to: "/worker/profile" },
    { label: "Gig Offers", icon: <Briefcase size={28} />, to: "/worker/offers" },
    { label: "My Calendar & Gigs", icon: <CalendarCheck2 size={28} />, to: "/worker/calendar" },
    { label: "Earnings & History", icon: <DollarSign size={28} />, to: "/worker/earnings" },
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
      <div className={styles.card}>
        <header className={styles.pageHeader}>
          {/* <h1>Worker</h1>
          {userPublicProfile?.displayName && (
              <p className={styles.welcomeMessage}>
                  Welcome back, {userPublicProfile.displayName}!
              </p>
          )} */}
        <Image
            src="/images/ableai2.jpeg"
            alt="App Logo"
            width={60}
            height={60}
            className={styles.logo}
          />
          {/* Notification Icon */}
          {userPublicProfile?.uid && (
            <Link href={`/user/${userPublicProfile.uid}/notifications`} passHref>
              <button className={styles.notificationButton} aria-label="Notifications">
                {/* <NotifIcon fontSize='large'/> */}
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
          title="Refer a Worker & Earn £5!"
          description="Know someone skilled? Invite them to Able AI and earn when they complete their first gig."
          buttonText="Share My Invite Link"
          onButtonClick={handleReferralClick}
        />

        <footer className={styles.pageFooter}>
          <RoleToggle lastViewVisited="home"/>
          <SettingsButton />
        </footer>
      </div>
    </div>
  );
}