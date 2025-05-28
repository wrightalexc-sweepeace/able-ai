"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAppContext } from "@/app/hooks/useAppContext";
import Avatar from "../../../../components/shared/Avatar";
import ContentCard from "../../../../components/shared/ContentCard";
import SkillsDisplayTable from "../../../../components/profile/SkillsDisplayTable";
import CheckboxDisplayItem from "../../../../components/profile/CheckboxDisplayItem";
import PillBadge from "../../../../components/shared/PillBadge";
import { BadgeCheck, CalendarDays, Loader2, MapPin, Pencil } from "lucide-react";
import styles from "./page.module.css";

// Mock data for QA testing
const qaMockProfileData = {
  id: "qa-worker-id",
  displayName: "QA Worker",
  userHandle: "@qaworker",
  profileHeadline: "Experienced Tester & Debugger",
  avatarUrl: "/images/benji.jpeg", // Use a placeholder image
  location: "Remote",
  isVerified: true,
  viewCalendarLink: "#qa-calendar",
  skills: [
    { name: "Manual Testing", ableGigs: 50, experience: "5 years", eph: 30 },
    { name: "Automated Testing", ableGigs: 20, experience: "3 years", eph: 40 },
    { name: "Debugging", ableGigs: 100, experience: "8 years", eph: 35 },
  ],
  qualifications: [
    "ISTQB Certified Tester",
    "Bachelor's Degree in Computer Science",
  ],
  equipment: [
    "Multiple Monitors", "High-Speed Internet", "Testing Rig",
  ],
  bio: "Dedicated QA professional ensuring high-quality software delivery.",
};

// Mock data fetch for the worker's own profile
async function fetchWorkerOwnedProfile(userId: string, isViewQA: boolean) {
  if (isViewQA) {
    console.log("Using QA mock data for worker profile.");
    // Assign the correct userId from the route to the mock data
    return { ...qaMockProfileData, id: userId };
  }
  
  // --- REAL DATA FETCH LOGIC GOES HERE IN A REAL APPLICATION ---
  console.log("Attempting to fetch real worker profile for userId:", userId);
  await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate fetch delay
  
  // For now, still return mock data if isViewQA is false for demonstration
  // In a real app, you would fetch data based on userId here.
  return { ...qaMockProfileData, id: userId }; // Still returning mock for demo
}

export default function WorkerOwnedProfilePage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.userId as string;
  // const { user, isLoading, isWorkerMode } = useAppContext();

  const [profile, setProfile] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Read isViewQA flag (example from local storage, could be context or query param)
  const isViewQA = typeof window !== 'undefined' ? localStorage.getItem('isViewQA') === 'true' : false;

  // useEffect(() => {
  //   // Redirect if not logged in, not the correct user, or not in worker mode
  //   if (!isLoading && (!user || (user.uid !== userId && !isViewQA) || !isWorkerMode)) {
  //     // Allow viewing mock data in QA mode even if userId doesn't match auth user
  //     if (!isViewQA) {
  //        router.replace("/signin");
  //     } else if (!isWorkerMode) { // Still require worker mode in QA view
  //        router.replace("/select-role"); // Or an appropriate redirect
  //     }
  //   }
  // }, [user, isLoading, isWorkerMode, userId, router, isViewQA]);

  useEffect(() => {
    if (userId) {
      setLoadingProfile(true);
      // Pass the isViewQA flag to the fetch function
      fetchWorkerOwnedProfile(userId, isViewQA)
        .then((data) => setProfile(data))
        .catch(() => setError("Could not load your profile."))
        .finally(() => setLoadingProfile(false));
    }
  }, [userId, isViewQA]); // Add isViewQA to dependency array

  // if (isLoading || loadingProfile) {
  //   return (
  //     <div className={styles.pageLoadingContainer}>
  //       <Loader2 className="animate-spin" size={48} /> Loading Profile...
  //     </div>
  //   );
  // }
  if (error) {
    return <div className={styles.pageWrapper}><p className={styles.errorMessage}>{error}</p></div>;
  }
  if (!profile) {
    return <div className={styles.pageWrapper}><p className={styles.emptyState}>Profile not available.</p></div>;
  }

  return (
    <div className={styles.profilePageContainer}>
      <div className={styles.profileHeaderSection}>
        <Avatar src={profile.avatarUrl} alt={profile.displayName} size={110} className={styles.avatarLarge} />
        <div className={styles.headerInfo}>
          <div className={styles.headerTopRow}>
            <h1 className={styles.workerName}>{profile.displayName}
              {profile.isVerified && <BadgeCheck size={20} className={styles.verifiedBadgeWorker} />}
            </h1>
            {profile.userHandle && <PillBadge text={profile.userHandle} variant="neutral" className={styles.userHandleBadge} />}
          </div>
          <div className={styles.profileHeadline}>{profile.profileHeadline}</div>
          {profile.location && (
            <div className={styles.locationInfo}><MapPin size={16} />{profile.location}</div>
          )}
          {profile.viewCalendarLink && (
            <a href={profile.viewCalendarLink} className={styles.viewCalendarLink}>
              <CalendarDays size={18} className={styles.calendarIcon} />
              <span>View calendar</span>
            </a>
          )}
        </div>
        <button className={styles.editProfileButton} onClick={() => router.push(`/user/${userId}/worker/profile/edit`)}>
          <Pencil size={18} /> Edit Profile
        </button>
      </div>

      <div className={styles.mainContentWrapper}>
        {profile.skills && profile.skills.length > 0 && (
          <SkillsDisplayTable skills={profile.skills} />
        )}
        {profile.qualifications && profile.qualifications.length > 0 && (
          <ContentCard title="Qualifications:">
            <ul className={styles.listSimple}>
              {profile.qualifications.map((q: string, index: number) => (
                <li key={index}>{q}</li>
              ))}
            </ul>
          </ContentCard>
        )}
        {profile.equipment && profile.equipment.length > 0 && (
          <ContentCard title="Equipment">
            <div className={styles.equipmentListContainer}>
              {profile.equipment.map((item: string, index: number) => (
                <CheckboxDisplayItem key={index} label={item} />
              ))}
            </div>
          </ContentCard>
        )}
        {profile.bio && (
          <ContentCard title="About Me">
            <p className={styles.bioText}>{profile.bio}</p>
          </ContentCard>
        )}
      </div>
    </div>
  );
} 