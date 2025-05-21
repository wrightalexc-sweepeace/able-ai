/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
// useAppContext might not be needed for the public view, but include for now if context is used elsewhere
// import { useAppContext } from '@/app/hooks/useAppContext';
import Link from 'next/link';

// --- SHARED & HELPER COMPONENTS ---
import PageCloseButton from '@/app/components/shared/PageCloseButton';
import SkillSpecificHeaderCard from '@/app/components/skills/SkillSpecificHeaderCard';
import InlineSummaryStats from '@/app/components/skills/InlineSummaryStats';
import PortfolioCarousel from '@/app/components/shared/PortfolioCarousel';
import CircularBadge from '@/app/components/shared/CircularBadge';
import ContentCard from '@/app/components/shared/ContentCard';
import TitledItemListCard from '@/app/components/shared/TitledItemListCard';
import ReviewCardItem from '@/app/components/shared/ReviewCardItem';
import RecommendationCardItem from '@/app/components/shared/RecommendationCardItem';

import { 
    Loader2, Star,
    Award as AwardIconLucide, // Using AwardIconLucide for potential badges
    MessageCircleCode // For reviews section icon
} from 'lucide-react';
import styles from './SkillSpecificPage.module.css';

// --- INTERFACES (Copied from plan) ---
interface SkillSpecificReview {
  id: string;
  reviewerName: string;
  date: string; // "YYYY-MM-DD"
  comment: string;
  // rating?: number; // If applicable
}

interface SkillSpecificRecommendation {
  id: string;
  recommenderName: string;
  date: string;
  comment: string;
}

interface SkillSpecificBadge {
  id: string;
  name: string;
  icon: React.ElementType; // Lucide icon or custom SVG
}

interface PortfolioMedia {
  id: string;
  type: 'image' | 'video';
  thumbnailUrl: string;
  fullUrl?: string; // For lightbox or separate page
  caption?: string;
}

interface PublicSkillProfile {
  workerId: string;
  workerName: string;
  workerProfileImageUrl?: string; // For the header image/video thumbnail
  skillId: string;
  skillName: string; // e.g., "Bartender"
  isFavoritedByCurrentUser?: boolean; // For the star icon state

  skillHashtags?: string[]; // For the blue pill badge, e.g., ["#licensedbarmanager", ...]
  
  skillRelatedReviewSummary?: string; // e.g., "Customer reviews: Profesional, charming and lively"

  // Skill-specific quick stats
  skillAbleGigs?: number | string;
  skillExperience?: string; // e.g., "8 years"
  skillEph?: number | string; // Hourly rate for this skill

  skillPortfolio?: PortfolioMedia[];
  
  skillRelevantBadges?: SkillSpecificBadge[];
  
  skillRelevantQualifications?: string[];
  
  skillTotalReviews?: number;
  skillReviews?: SkillSpecificReview[]; // Array of actual reviews for this skill
  
  skillRecommendations?: SkillSpecificRecommendation[];
}

// --- MOCK FUNCTION (Adapted from worker profile page) ---
async function fetchPublicSkillProfile(workerId: string, skillId: string): Promise<PublicSkillProfile | null> {
    console.log(`Fetching public profile for worker: ${workerId}, skill: ${skillId}`);
    await new Promise(resolve => setTimeout(resolve, 700)); // Simulate network delay

    // --- MOCK DATA --- Use skillId to return different data if needed
    if (workerId === "benji-asamoah-id" && skillId === "bartender-skill-id") {
        return {
            workerId: "benji-asamoah-id",
            workerName: "Benji Asamoah",
            workerProfileImageUrl: "/images/benji-profile-image.jpg", // Using the larger profile image
            skillId: "bartender-skill-id",
            skillName: "Bartender",
            isFavoritedByCurrentUser: true,
            skillHashtags: ["#licensedbarmanager", "#cocktailartist", "#mobilebar"],
            skillRelatedReviewSummary: "Customer reviews: Professional, charming and lively",
            skillAbleGigs: 15,
            skillExperience: "3 years",
            skillEph: 25,
            skillPortfolio: [
                { id: "p1", type: 'image', thumbnailUrl: "/images/mock-portfolio-1.jpg", caption: "Mixing drinks" },
                { id: "p2", type: 'image', thumbnailUrl: "/images/mock-portfolio-2.jpg", caption: "Event setup" },
                // Add more mock portfolio items
            ],
            skillRelevantBadges: [
                { id: "b1", name: "Always on time", icon: AwardIconLucide },
                { id: "b2", name: "Able Professional", icon: Star }, // Using Star icon as example
            ],
            skillRelevantQualifications: [
                "Licensed bar manager",
                "Advanced Mixology Course Certificate",
            ],
            skillTotalReviews: 13,
            skillReviews: [
                { id: "r1", reviewerName: "Alice B.", date: "2023-10-26", comment: "Benji was fantastic! Our guests loved his cocktails." },
                { id: "r2", reviewerName: "Charlie D.", date: "2023-11-15", comment: "Very professional and efficient." },
            ],
            skillRecommendations: [
                { id: "rec1", recommenderName: "David E.", date: "2023-09-01", comment: "Highly recommend Benji for any event." },
            ],
        };
    }
    // Return null for other IDs to simulate not found
    return null;
}

// --- COMPONENT ---
export default function PublicSkillProfilePage() {
  const router = useRouter();
  const params = useParams();
  const workerIdToView = params.workerId as string;
  const skillIdToView = params.skillId as string;

  // Use this if auth context is needed, e.g., for hire button logic
  // const { isAuthenticated, isLoading: loadingAuth, user: authUser } = useAppContext();

  const [skillProfile, setSkillProfile] = useState<PublicSkillProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (workerIdToView && skillIdToView) {
      setIsLoadingProfile(true);
      fetchPublicSkillProfile(workerIdToView, skillIdToView)
        .then(data => {
          if (data) setSkillProfile(data);
          else setError("Skill profile not found.");
        })
        .catch(err => {
          console.error("Error loading skill profile:", err);
          setError("Could not load skill profile.");
        })
        .finally(() => setIsLoadingProfile(false));
    } else {
      setError("Worker ID or Skill ID missing.");
      setIsLoadingProfile(false);
    }
  }, [workerIdToView, skillIdToView]);

  const handleHireWorkerForSkill = () => {
    if (!skillProfile) return; // Add authUser check if needed later
    // TODO: Implement actual hiring flow for this specific skill
    alert(`Initiate hiring flow for ${skillProfile.workerName} for skill: ${skillProfile.skillName}`);
    // Example navigation:
    // router.push(`/user/${authUser.uid}/buyer/book-gig?workerId=${skillProfile.workerId}&skillId=${skillProfile.skillId}`);
  };

  // Optional: Handle favorite toggle if the component is interactive
  const handleFavoriteToggle = () => {
      // TODO: Implement favorite/unfavorite logic via API
      console.log("Toggle favorite for skill:", skillProfile?.skillId);
  };

  if (isLoadingProfile) {
    return <div className={styles.pageLoadingContainer}><Loader2 className="animate-spin" size={48} /> Loading Skill Profile...</div>;
  }
  if (error) {
    return <div className={styles.pageWrapper}><p className={styles.errorMessage}>{error}</p></div>;
  }
  if (!skillProfile) {
    return <div className={styles.pageWrapper}><p className={styles.emptyState}>Skill profile not available.</p></div>;
  }

  return (
    <div className={styles.skillPageContainer}>
      
      {/* Close button */}
      <PageCloseButton onClick={() => router.back()} />

      {/* Skill Specific Header Card */}
      <SkillSpecificHeaderCard 
        workerName={skillProfile.workerName}
        skillName={skillProfile.skillName}
        profileImageUrl={skillProfile.workerProfileImageUrl}
        isFavorited={skillProfile.isFavoritedByCurrentUser}
        onFavoriteToggle={handleFavoriteToggle}
        hashtags={skillProfile.skillHashtags}
      />

      {/* Skill Related Review Summary */}
      {skillProfile.skillRelatedReviewSummary && (
        <p className={styles.reviewSummaryText}>{skillProfile.skillRelatedReviewSummary}</p>
      )}

      {/* Inline Summary Stats */}
      {(skillProfile.skillAbleGigs !== undefined || skillProfile.skillExperience || skillProfile.skillEph !== undefined) && (
        <InlineSummaryStats 
          ableGigs={skillProfile.skillAbleGigs}
          experience={skillProfile.skillExperience}
          eph={skillProfile.skillEph}
        />
      )}

      {/* Portfolio Carousel */}
      {skillProfile.skillPortfolio && skillProfile.skillPortfolio.length > 0 && (
        <PortfolioCarousel items={skillProfile.skillPortfolio} showPaperclipIcon />
      )}

      {/* Badges Awarded Section */}
      {skillProfile.skillRelevantBadges && skillProfile.skillRelevantBadges.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Badges Awarded</h2>
          <div className={styles.badgesContainer}>
            {skillProfile.skillRelevantBadges.map(badge => (
                <CircularBadge 
                    key={badge.id} 
                    icon={badge.icon} // Ensure icon is a valid Lucide component or similar
                    textLines={badge.name.split(' ')} // Split name into lines (basic example)
                />
            ))}
          </div>
        </section>
      )}

      {/* Qualifications and training Section */}
      {skillProfile.skillRelevantQualifications && skillProfile.skillRelevantQualifications.length > 0 && (
        <ContentCard title="Qualifications and training:">
          <ul className={styles.listSimple}> {/* Use a basic list style */} 
            {skillProfile.skillRelevantQualifications.map((q, index) => (
              <li key={index}>{q}</li>
            ))}
          </ul>
        </ContentCard>
      )}

      {/* Buyer Reviews Section */}
      {skillProfile.skillReviews && skillProfile.skillReviews.length > 0 && (
         <TitledItemListCard
            title={`${skillProfile.skillTotalReviews !== undefined ? skillProfile.skillTotalReviews : skillProfile.skillReviews.length} Buyer Reviews`}
            icon={MessageCircleCode} 
            items={skillProfile.skillReviews}
            renderItem={(review) => <ReviewCardItem key={review.id} reviewerName={review.reviewerName} date={review.date} comment={review.comment} />}
        />
      )}
      
      {/* Recommendations Section */}
      {skillProfile.skillRecommendations && skillProfile.skillRecommendations.length > 0 && (
         <TitledItemListCard
            title="Recommendations"
            items={skillProfile.skillRecommendations}
            renderItem={(rec) => <RecommendationCardItem key={rec.id} recommenderName={rec.recommenderName} date={rec.date} comment={rec.comment} />}
        />
      )}

      {/* Footer Action Bar */}
      <div className={styles.footerActionBar}>
        {/* TODO: Replace '£ Hire' with appropriate icon/text */} 
        <button onClick={handleHireWorkerForSkill} className={styles.primaryActionButton}> 
            Hire {skillProfile.workerName.split(' ')[0]} for {skillProfile.skillName}
        </button>
      </div>

    </div> 
  );
} 