"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAppContext } from '@/app/hooks/useAppContext';
import Image from 'next/image';
import Link from 'next/link';

// --- SHARED & HELPER COMPONENTS ---
import Avatar from '@/app/components/shared/Avatar';
import PillBadge from '@/app/components/shared/PillBadge';
import ContentCard from '@/app/components/shared/ContentCard';
import SkillsDisplayTable from '@/app/components/profile/SkillsDisplayTable';
import StatisticItemDisplay from '@/app/components/profile/StatisticItemDisplay';
import AwardDisplayBadge from '@/app/components/profile/AwardDisplayBadge';
import CheckboxDisplayItem from '@/app/components/profile/CheckboxDisplayItem';

import {
  ArrowLeft, MessageSquare, Briefcase, Star, Award as AwardIconLucide, CalendarDays, Sparkles, ListChecks, Video, BadgeCheck, UserCircle, Eye, Loader2,
  ThumbsUp, MessageCircleCode, MapPin, Share2, X
} from 'lucide-react';
import styles from './page.module.css'; // Use page.module.css

// --- INTERFACE (Adapted for image elements) ---
interface Skill {
  name: string;
  ableGigs?: number | string;
  experience?: string;
  eph?: number | string;
}

interface Statistic {
  id: string;
  icon: React.ElementType;
  value: string;
  label: string;
  iconColor?: string;
}

interface Award {
  id: string;
  icon: React.ElementType;
  textLines: string[];
}

interface PublicWorkerProfile {
  id: string;
  displayName: string;
  userHandle?: string;
  profileHeadline?: string;
  bio?: string;
  avatarUrl?: string;
  profileImageUrl?: string;
  qrCodeUrl?: string;
  location?: string;

  primaryRole?: string;

  statistics?: Statistic[];

  skills: Skill[];

  awards?: Award[];
  feedbackSummary?: string;

  qualifications?: string[];
  equipment?: string[];

  ableGigsCompleted?: number;
  averageRating?: number;
  reviewCount?: number;
  generalAvailability?: string;
  experienceYears?: number | string;
  isVerified?: boolean;
  viewCalendarLink?: string;
}

// --- MOCK FUNCTION (Updated with new data points) ---
async function fetchPublicWorkerProfile(workerIdToView: string): Promise<PublicWorkerProfile | null> {
  console.log("Fetching public profile for worker:", workerIdToView);
  await new Promise(resolve => setTimeout(resolve, 700));
  if (workerIdToView === "benji-asamoah-id") {
    return {
      id: "benji-asamoah-id",
      displayName: "Benji Asamoah",
      userHandle: "@benjiasamoah",
      profileHeadline: "Expert Mixologist & Event Bartender",
      avatarUrl: "/images/avatar-benji.jpg",
      profileImageUrl: "/images/benji-profile-image.jpg",
      qrCodeUrl: "/images/sample-qr-code.png",
      location: "Streatham, London",
      isVerified: true,
      viewCalendarLink: "#view-calendar",

      statistics: [
        { id: "s1", icon: ThumbsUp, value: "100%", label: "Would work with Benji again" },
        { id: "s2", icon: MessageCircleCode, value: "100%", label: "Response rate" },
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
        "Camera gear", "Laptop", "Smartphone", "Uniform", "Bicycle", "Car"
      ],
    };
  }
  return null;
}

// --- COMPONENT ---
export default function PublicWorkerProfilePage() {
  const router = useRouter();
  const params = useParams();
  const workerProfileIdToView = params.workerId as string;

  const { isAuthenticated, isLoading: loadingAuth, user: authUser } = useAppContext();

  const [workerProfile, setWorkerProfile] = useState<PublicWorkerProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (workerProfileIdToView) {
      setIsLoadingProfile(true);
      fetchPublicWorkerProfile(workerProfileIdToView)
        .then(data => {
          if (data) setWorkerProfile(data);
          else setError("Worker profile not found.");
        })
        .catch(err => {
          console.error("Error loading worker profile:", err);
          setError("Could not load worker profile.");
        })
        .finally(() => setIsLoadingProfile(false));
    } else {
      setError("Worker ID missing.");
      setIsLoadingProfile(false);
    }
  }, [workerProfileIdToView]);

  const handleHireWorker = () => {
    if (!workerProfile || !authUser?.uid) return; // Ensure authUser is available for booking
    router.push(`/user/${authUser.uid}/buyer/book-gig?workerId=${workerProfile.id}`);
  };

  const handleSendMessage = () => {
    if (!workerProfile) return;
    // Placeholder for message functionality
    console.log(`Initiate chat with ${workerProfile.displayName}`);
    // router.push(`/chat?contactId=${workerProfile.id}`); // Example chat route
  };

  if (loadingAuth || isLoadingProfile) {
    return <div className={styles.pageLoadingContainer}><Loader2 className="animate-spin" size={48} /> Loading Profile...</div>;
  }
  if (error) {
    return <div className={styles.pageWrapper}><p className={styles.errorMessage}>{error}</p></div>;
  }
  if (!workerProfile) {
    return <div className={styles.pageWrapper}><p className={styles.emptyState}>Worker profile not available.</p></div>;
  }

  return (
    <div className={styles.profilePageContainer}>
      {/* Close button from image */}
      <button onClick={() => router.back()} className={styles.pageCloseButton} aria-label="Close profile">
        <X size={24} />
      </button>

      {/* Top Section (Benji Image Style - Profile Image/Video, QR, Location) */}
      <div className={styles.profileHeaderImageSection}>
        <div className={styles.profileImageVideo}>
          {workerProfile.profileImageUrl ? (
            <Avatar src={workerProfile.profileImageUrl} alt={`${workerProfile.displayName}'s profile`} size={200} className={styles.mainProfileVisual} />
          ) : (
            <div className={`${styles.mainProfileVisual} ${styles.mainProfileVisualPlaceholder}`}><UserCircle size={80} /></div>
          )}
          {/* Add play icon if it's a video */}
        </div>
        <div className={styles.profileHeaderRightCol}>
          {workerProfile.qrCodeUrl && (
            <Image src={workerProfile.qrCodeUrl} alt="QR Code" width={90} height={90} className={styles.qrCode} />
          )}
          <div className={styles.locationShareContainer}>
            {workerProfile.location && (
              <div className={styles.locationInfo}>
                <MapPin size={16} />
                <span>{workerProfile.location}</span>
              </div>
            )}
            <button className={styles.shareProfileButton} aria-label="Share profile" onClick={() => alert('Share functionality coming soon!')}>
              <Share2 size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* User Info Bar (Benji Image Style - Name, Handle, Calendar) */}
      <div className={styles.userInfoBar}>
        <div className={styles.userInfoLeft}>
          <h1 className={styles.workerName}>
            {workerProfile.displayName}
            {workerProfile.isVerified && <BadgeCheck size={22} className={styles.verifiedBadgeWorker} />}
          </h1>
          {workerProfile.userHandle && (
            <PillBadge text={workerProfile.userHandle} variant="neutral" className={styles.userHandleBadge} />
          )}
        </div>
        {workerProfile.viewCalendarLink && (
          <Link href={workerProfile.viewCalendarLink} className={styles.viewCalendarLink} aria-label="View calendar">
            <CalendarDays size={20} className={styles.calendarIcon} />
            <span>View calendar</span>
          </Link>
        )}
      </div>

      {/* Main content wrapper */}
      <div className={styles.mainContentWrapper}>

        {/* Statistics Section (Benji Image Style) */}
        {workerProfile.statistics && workerProfile.statistics.length > 0 && (
          <ContentCard title="Statistics" className={styles.statisticsCard}>
            <div className={styles.statisticsItemsContainer}>
              {workerProfile.statistics.map(stat => (
                <StatisticItemDisplay
                  key={stat.id}
                  icon={stat.icon}
                  value={stat.value}
                  label={stat.label}
                  iconColor={stat.iconColor}
                />
              ))}
            </div>
          </ContentCard>
        )}

        {/* Skills Section (Benji Image Style - Blue Card) */}
        {workerProfile.skills && workerProfile.skills.length > 0 && (
          <SkillsDisplayTable skills={workerProfile.skills} />
        )}

        {/* Awards & Feedback Section (Benji Image Style) */}
        {(workerProfile.awards || workerProfile.feedbackSummary) && ( // Only show section if there are awards or feedback
          <div className={styles.awardsFeedbackGrid}>
            {workerProfile.awards && workerProfile.awards.length > 0 && (
              <ContentCard title="Awards:" className={styles.awardsCard}>
                <div className={styles.awardsContainer}>
                  {workerProfile.awards.map(award => (
                    <AwardDisplayBadge
                      key={award.id}
                      icon={award.icon}
                      textLines={award.textLines}
                    />
                  ))}
                </div>
              </ContentCard>
            )}
            {workerProfile.feedbackSummary && (
              <ContentCard title="Feedback:" className={styles.feedbackCard}>
                <p className={styles.feedbackText}>{workerProfile.feedbackSummary}</p>
              </ContentCard>
            )}
          </div>
        )}

        {/* Qualifications Section (Benji Image Style) */}
        {workerProfile.qualifications && workerProfile.qualifications.length > 0 && (
          <ContentCard title="Qualifications:">
            <ul className={styles.listSimple}>
              {workerProfile.qualifications.map((q, index) => (
                <li key={index}>{q}</li>
              ))}
            </ul>
          </ContentCard>
        )}

        {/* Equipment Section (Benji Image Style) */}
        {workerProfile.equipment && workerProfile.equipment.length > 0 && (
          <ContentCard title="Equipment">
            <div className={styles.equipmentListContainer}>
              {workerProfile.equipment.map((item, index) => (
                <CheckboxDisplayItem key={index} label={item} />
              ))}
            </div>
          </ContentCard>
        )}

        {/* Bio Text (if used) */}
        {workerProfile.bio && (
            <ContentCard title={`About ${workerProfile.displayName.split(' ')[0]}`}>
                <p className={styles.bioText}>{workerProfile.bio}</p>
            </ContentCard>
        )}

      </div> {/* End Main Content Wrapper */}

      {/* --- Footer Action Bar (from first "Benji" image) --- */}
      <div className={styles.footerActionBar}>
          <button onClick={handleHireWorker} className={styles.primaryActionButton}>
              £ Hire {workerProfile.displayName.split(' ')[0]}
          </button>
      </div>

    </div> // End Profile Page Container
  );
} 