"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams, usePathname } from "next/navigation";
import { useAppContext } from "@/app/hooks/useAppContext";
import {
  // BadgeCheck,
  // CalendarDays,
  // Loader2,
  // MapPin,
  // Pencil,
  ThumbsUp,
  MessageCircleCode,
  Award as AwardIconLucide,
  UserCircle,
} from "lucide-react";
import styles from "./page.module.css";
import WorkerProfile from "@/app/components/profile/WorkerProfile";

// Mock data for QA testing
const qaMockProfileData = {
  id: "benji-asamoah-id",
  displayName: "Benji Asamoah",
  userHandle: "@benjiasamoah",
  profileHeadline: "Expert Mixologist & Event Bartender",
  avatarUrl: "/images/avatar-benji.jpg",
  profileImageUrl: "/images/benji.jpeg",
  qrCodeUrl: "/images/qr.svg",
  location: "Streatham, London",
  isVerified: true,
  viewCalendarLink: "#view-calendar",

  statistics: [
    {
      id: "s1",
      icon: ThumbsUp,
      value: "100%",
      label: "Would work with Benji again",
    },
    {
      id: "s2",
      icon: MessageCircleCode,
      value: "100%",
      label: "Response rate",
    },
  ],
  skills: [
    { name: "Bartender", ableGigs: 15, experience: "3 years", eph: 15 },
    { name: "Waiter", ableGigs: 2, experience: "8 years", eph: 15 },
    { name: "Graphic Designer", ableGigs: 1, experience: "7 years", eph: 22 },
  ],
  awards: [
    { id: "a1", icon: AwardIconLucide, textLines: ["Always on", "time"] },
    { id: "a2", icon: UserCircle, textLines: ["Able", "Professional"] },
  ],
  feedbackSummary: "Professional, charming and lively",
  qualifications: [
    "Bachelor's Degree in Graphic Design",
    "Licensed bar manager",
    "Drivers license",
  ],
  equipment: [
    "Camera gear",
    "Laptop",
    "Smartphone",
    "Uniform",
    "Bicycle",
    "Car",
  ],
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
  const pathname = usePathname();
  const userId = params.userId as string;

  const { isLoading: loadingAuth, user, updateUserContext } = useAppContext();

  const [profile, setProfile] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isSelfView = true;

  const handleAddSkill = () => {
    const newSkill = {
      name: "developer",
      ableGigs: 2,
      experience: "3 years",
      eph: 20,
    };
    setProfile({
      ...profile,
      skills: [...(profile.skills || []), newSkill],
    });
  };

  useEffect(() => {
    if (!loadingAuth && user?.isAuthenticated) {
      if (user?.canBeBuyer || user?.isQA) {
        updateUserContext({
          lastRoleUsed: "GIG_WORKER",
          lastViewVisited: pathname,
        });
      } else {
        router.replace("/select-role");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingAuth, user?.isAuthenticated]);

  useEffect(() => {
    if (userId) {
      setLoadingProfile(true);
      // Pass the isViewQA flag to the fetch function
      fetchWorkerOwnedProfile(userId, !!user?.isQA)
        .then((data) => setProfile(data))
        .catch(() => setError("Could not load your profile."))
        .finally(() => setLoadingProfile(false));
    }
  }, [userId, user?.isQA]);

  // if (isLoading || loadingProfile) {
  //   return (
  //     <div className={styles.pageLoadingContainer}>
  //       <Loader2 className="animate-spin" size={48} /> Loading Profile...
  //     </div>
  //   );
  // }
  if (error) {
    return (
      <div className={styles.pageWrapper}>
        <p className={styles.errorMessage}>{error}</p>
      </div>
    );
  }
  if (!profile) {
    return (
      <div className={styles.pageWrapper}>
        <p className={styles.emptyState}>Profile not available.</p>
      </div>
    );
  }

  return (
    <div className={styles.profilePageContainer}>
      {/* <div className={styles.profileHeaderSection}>
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
      </div> */}
      <WorkerProfile
        workerProfile={profile}
        isSelfView={isSelfView}
        handleAddSkill={handleAddSkill}
      />
    </div>
  );
}
