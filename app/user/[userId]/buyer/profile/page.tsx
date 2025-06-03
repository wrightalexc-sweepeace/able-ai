"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams, usePathname } from "next/navigation";
import { useAppContext } from "@/app/hooks/useAppContext";
import Image from "next/image";
import { ThumbsUp, MessageSquareText, Users, Award, Film, Video, Loader2, Sparkles } from "lucide-react";
import styles from "./BuyerProfilePage.module.css";

// Types
interface Badge {
    id: string;
    name: string;
    icon?: React.ReactNode;
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
    stats: {
        wouldWorkAgainPercent: number;
        responseRatePercent: number;
    };
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
    stats: { wouldWorkAgainPercent: 100, responseRatePercent: 100 },
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
        { id: "b1", name: "Mixology Master Hired", icon: <Award size={24} /> },
        { id: "b2", name: "Consistent Positive Feedback", icon: <ThumbsUp size={24} /> },
        { id: "b3", name: "Top Venue Choice", icon: <Sparkles size={24} /> },
    ],
    reviewsFromWorkers: [
        { id: "rw1", workerName: "Benji A.", date: "2023-10-15", reviewText: "Alexander is a great manager, very clear with instructions and fair. Always a pleasure to work for Friendship Cafe!", rating: 5, workerAvatarUrl: "/images/benji.jpeg" },
        { id: "rw2", workerName: "Sarah K.", date: "2023-09-20", reviewText: "Professional environment and prompt payment. Would definitely work with Alexander again.", rating: 4, workerAvatarUrl: "/images/jessica.jpeg" },
    ],
};

interface ReviewCardProps {
    review: {
        id: string;
        author: { name: string; profileImage?: string };
        rating: number;
        comment: string;
        createdAt: string;
    };
}

function ReviewCard({ review }: ReviewCardProps) {
    return (
        <div style={{ background: "#232323", borderRadius: 8, padding: 16, display: "flex", gap: 12 }}>
            {review.author?.profileImage && (
                <Image src={review.author.profileImage} alt={review.author.name} width={40} height={40} style={{ borderRadius: "50%" }} />
            )}
            <div>
                <div style={{ fontWeight: 600, color: "#fff", fontSize: 15 }}>{review.author?.name}</div>
                <div style={{ color: "#a0a0a0", fontSize: 13 }}>{review.createdAt}</div>
                <div style={{ marginTop: 6, color: "#e0e0e0", fontSize: 14 }}>{review.comment}</div>
            </div>
        </div>
    );
}

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
                    <h1 className={styles.profileHeaderName}>{dashboardData.displayName}</h1>
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
                                    fill
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
                        <div className={styles.statItemCard}>
                            <ThumbsUp size={32} className={styles.statIcon} />
                            <div className={styles.statTextContent}>
                                <p className={styles.statValue}>{dashboardData.stats.wouldWorkAgainPercent}%</p>
                                <p className={styles.statLabel}>
                                    Would work with {dashboardData.displayName.split(" ")[0]} again
                                </p>
                            </div>
                        </div>
                        <div className={styles.statItemCard}>
                            <MessageSquareText size={32} className={styles.statIcon} />
                            <div className={styles.statTextContent}>
                                <p className={styles.statValue}>{dashboardData.stats.responseRatePercent}%</p>
                                <p className={styles.statLabel}>Response rate</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Completed Hires Card */}
                <div className={styles.completedHiresCard}>
                    <div className={styles.completedHiresCount}>
                        <span className={styles.completedHiresNumber}>{dashboardData.completedHires}</span>
                        <span className={styles.completedHiresLabel}>Completed Hires</span>
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
                    <h2 className={styles.sectionTitle}>Badges Highlights</h2>
                    <div className={styles.badgesGridDisplay}>
                        {dashboardData.badgesEarnedByTheirWorkers.map((badge) => (
                            <div key={badge.id} className={styles.badgeDisplayItem}>
                                <span className={styles.badgeDisplayIcon}>{badge.icon || <Award size={20} />}</span>
                                {badge.name}
                            </div>
                        ))}
                    </div>
                </section>

                {/* Worker Reviews Section */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>What Workers Say About You</h2>
                    {dashboardData.reviewsFromWorkers.length > 0 ? (
                        <div className={styles.reviewsListContainer}>
                            {dashboardData.reviewsFromWorkers.slice(0, 2).map((review) => (
                                <ReviewCard
                                    key={review.id}
                                    review={{
                                        id: review.id,
                                        author: { name: review.workerName, profileImage: review.workerAvatarUrl },
                                        rating: review.rating,
                                        comment: review.reviewText,
                                        createdAt: review.date,
                                    }}
                                />
                            ))}
                        </div>
                    ) : (
                        <p style={{ fontSize: "0.9rem", color: "#a0a0a0" }}>No worker reviews yet.</p>
                    )}
                </section>

                {/* Add Team Member Button */}
                <button onClick={handleAddTeamMember} className={styles.addTeamMemberButton}>
                    <Users size={20} /> Add team member to account
                </button>
            </div>
        </div>
    );
} 