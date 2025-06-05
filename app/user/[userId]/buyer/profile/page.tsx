"use client";

import React, { ReactElement, useEffect, useState } from "react";
import { useRouter, useParams, usePathname } from "next/navigation";
import { useAppContext } from "@/app/hooks/useAppContext";
import Image from "next/image";
import { ThumbsUp, MessageSquareText, Users, Award, Film, Video, Loader2, Sparkles, MessageCircleCode } from "lucide-react";
import styles from "./BuyerProfilePage.module.css";
import StatisticItemDisplay from "@/app/components/profile/StatisticItemDisplay";
import AwardDisplayBadge from "@/app/components/profile/AwardDisplayBadge";
import ReviewCardItem from "@/app/components/shared/ReviewCardItem";

// Types
interface Badge {
    id: string;
    name: string;
    icon: React.ElementType;
}
interface Review {
    id: string;
    workerName: string;
    date: string;
    reviewText: string;
    rating: number;
    workerAvatarUrl?: string;
}
interface DashboardData {
    displayName: string;
    username: string;
    introVideoThumbnailUrl?: string;
    introVideoUrl?: string;
    businessName: string;
    businessLocation: string;
    userRoleInBusiness: string;
    statistics: Array<{
        icon: React.ElementType,
        value: string,
        label: string
    }>
    completedHires: number;
    typesOfStaffHired: string[];
    pieChartData?: Array<{ name: string; value: number; fill: string }>;
    barChartData?: Array<{ name: string; hires: number; spend?: number }>;
    badgesEarnedByTheirWorkers: Badge[];
    reviewsFromWorkers: Review[];
}

// Mock data for QA/testing
const mockDashboardData: DashboardData = {
    displayName: "Alexander Smith",
    username: "@AlexanderS",
    introVideoThumbnailUrl: "/images/benji.jpeg",
    introVideoUrl: "https://www.youtube.com/watch?v=some_video_id",
    businessName: "Friendship Cafe and Bar",
    businessLocation: "Soho, W1 56T",
    userRoleInBusiness: "Owner, manager",
    statistics: [
    {
      icon: ThumbsUp,
      value: "100%",
      label: "Would work with Alexandra again"
    },
    {
      icon: MessageCircleCode,
      value: "100%",
      label: "Response rate",
    }],
    completedHires: 150,
    typesOfStaffHired: ["Waiters", "Bartender", "Chef"],
    pieChartData: [
        { name: "Bartenders", value: 400, fill: "#FFBB28" },
        { name: "Waiters", value: 300, fill: "#00C49F" },
        { name: "Chefs", value: 300, fill: "#0088FE" },
        { name: "Event Staff", value: 200, fill: "#FF8042" },
    ],
    barChartData: [
        { name: "Jan", hires: 10, spend: 1500 },
        { name: "Feb", hires: 12, spend: 1800 },
        { name: "Mar", hires: 15, spend: 2200 },
        { name: "Apr", hires: 13, spend: 2000 },
    ],
    badgesEarnedByTheirWorkers: [
        { id: "b1", name: "Mixology Master Hired", icon: Award },
        { id: "b2", name: "Consistent Positive Feedback", icon: ThumbsUp },
        { id: "b3", name: "Top Venue Choice", icon: Sparkles }
    ],
    reviewsFromWorkers: [
        { id: "rw1", workerName: "Benji A.", date: "2023-10-15", reviewText: "Alexander is a great manager, very clear with instructions and fair. Always a pleasure to work for Friendship Cafe!", rating: 5, workerAvatarUrl: "/images/benji.jpeg" },
        { id: "rw2", workerName: "Sarah K.", date: "2023-09-20", reviewText: "Professional environment and prompt payment. Would definitely work with Alexander again.", rating: 4, workerAvatarUrl: "/images/jessica.jpeg" },
    ],
};


export default function BuyerProfilePage() {
    const router = useRouter();
    const params = useParams();
    const pathname = usePathname();
    const { user, isLoading: loadingAuth, updateUserContext } = useAppContext();
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!loadingAuth && user?.isAuthenticated) {
            if (user?.isQA) {
                setDashboardData(mockDashboardData);
                setIsLoadingData(false);
            } else {
                // TODO: Replace with real data fetching logic for non-QA users
                setDashboardData(null);
                setIsLoadingData(false);
            }
            if (user?.canBeBuyer || user?.isQA) {
                setDashboardData(mockDashboardData);
                setIsLoadingData(false);
                updateUserContext({
                    lastRoleUsed: "BUYER", // Ensure the context reflects the current role
                    lastViewVisited: pathname, // Update last view visited
                });
            } else {
                router.replace("/select-role");
            }
        }
    }, [user?.isAuthenticated, loadingAuth]);

    const handleAddTeamMember = () => {
        alert("Add team member functionality to be implemented.");
    };

    const handlePlayIntroVideo = () => {
        if (dashboardData?.introVideoUrl) {
            window.open(dashboardData.introVideoUrl, "_blank");
        } else {
            alert("Intro video not available.");
        }
    };

    if (loadingAuth || isLoadingData) {
        return (
            <div className={styles.loadingContainer}>
                <Loader2 className="animate-spin" size={32} /> Loading Dashboard...
            </div>
        );
    }
    if (error) {
        return (
            <div className={styles.container}>
                <div className={styles.pageWrapper}>
                    <p className={styles.errorMessage}>{error}</p>
                </div>
            </div>
        );
    }
    if (!dashboardData) {
        return (
            <div className={styles.container}>
                <div className={styles.pageWrapper}>
                    <p className={styles.errorMessage}>No dashboard data available.</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.pageWrapper}>
                {/* Profile Header */}
                <header className={styles.profileHeader}>
                    <h3 className={styles.profileHeaderName}>{dashboardData.displayName}</h3>
                    <p className={styles.profileHeaderUsername}>{dashboardData.username}</p>
                </header>

                {/* Intro & Business Card Section */}
                <section className={`${styles.section} ${styles.introBusinessCard}`}>
                    <div
                        className={styles.videoThumbnailContainer}
                        onClick={handlePlayIntroVideo}
                        role="button"
                        tabIndex={0}
                        onKeyPress={(e) => e.key === "Enter" && handlePlayIntroVideo()}
                    >
                        <span className={styles.videoThumbnailTitle}>Intro Video</span>
                        <div className={styles.videoPlaceholderImage}>
                            {dashboardData.introVideoThumbnailUrl ? (
                                <Image
                                    src={dashboardData.introVideoThumbnailUrl}
                                    alt="Intro video thumbnail"
                                    width ={116}
                                    height={116}
                                    style={{ objectFit: "cover" }}
                                    className={styles.actualVideoImage}
                                />
                            ) : (
                                <Film size={48} color="#0f0f0f" />
                            )}
                            <Video size={32} className={styles.playIconOverlay} />
                        </div>
                    </div>
                    <div className={styles.businessInfoCard}>
                        <h4>Business:</h4>
                        <p>
                            {dashboardData.businessName}
                            <br />
                            {dashboardData.businessLocation}
                        </p>
                        <h4>Role:</h4>
                        <p>{dashboardData.userRoleInBusiness}</p>
                    </div>
                </section>

                {/* Statistics Section */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Statistics</h2>
                    <div className={styles.statsGrid}>
                        {dashboardData.statistics.map((stat, index) => (
                            <StatisticItemDisplay 
                                key={index}
                                icon={stat.icon}
                                value={stat.value}
                                label={stat.label}
                            />
                        ))}
                    </div>
                </section>

                {/* Completed Hires Card */}
                <div className={styles.completedHiresCard}>
                    <div className={styles.completedHiresCount}>
                        <span className={styles.completedHiresLabel}>Completed Hires</span>
                        <span className={styles.completedHiresNumber}>{dashboardData.completedHires}</span>
                    </div>
                    <div className={styles.staffTypesList}>
                        <span className={styles.staffTypesTitle}>Types of Staff Hired:</span>
                        <ul>
                            {dashboardData.typesOfStaffHired.map((type) => (
                                <li key={type}>{type}</li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Workforce Analytics Section */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Workforce Analytics</h2>
                    <div className={styles.analyticsChartsContainer}>
                        <div className={styles.chartPlaceholder}>
                            {/* Pie Chart would go here */}
                            Pie Chart: Spend by Role (Placeholder)
                        </div>
                        <div className={styles.chartPlaceholder}>
                            {/* Bar Chart would go here */}
                            Bar Chart: Hires per Month (Placeholder)
                        </div>
                    </div>
                </section>

                {/* Badges Awarded Section */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Badges Awarded</h2>
                    <div className={styles.badgesGridDisplay}>
                        {dashboardData.badgesEarnedByTheirWorkers.map(( award) => (
                            <AwardDisplayBadge
                                key={award.id}
                                icon={award.icon}
                                textLines={award.name}
                                color="#eab308"
                        />
                        ))}
                    </div>
                </section>

                {/* Worker Reviews Section */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Worker Reviews</h2>
                    {dashboardData.reviewsFromWorkers.length > 0 ? (
                        <div className={styles.reviewsListContainer}>
                            {dashboardData.reviewsFromWorkers.slice(0, 2).map((review, index) => (
                                <ReviewCardItem 
                                    key={index} 
                                    reviewerName={review.workerName}
                                    date={review.date} 
                                    comment={review.reviewText}
                                />
                            ))}
                        </div>
                    ) : (
                        <p style={{ fontSize: "0.9rem", color: "#a0a0a0" }}>No worker reviews yet.</p>
                    )}
                </section>

                {/* Add Team Member Button
                <button onClick={handleAddTeamMember} className={styles.addTeamMemberButton}>
                    <Users size={20} /> Add team member to account
                </button> */}
            </div>
        </div>
    );
} 