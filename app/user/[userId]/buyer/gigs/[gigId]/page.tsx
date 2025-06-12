"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Info, MessageSquare, Star, FileText, AlertCircle, Calendar } from "lucide-react";
import styles from "@/app/user/[userId]/worker/gigs/[gigId]/GigDetailsPage.module.css";
import pageStyles from "./GigDetails.module.css";
import { useUser } from "@/app/context/UserContext";
import { useParams } from "next/navigation"; // Added useParams
import Logo from "@/app/components/brand/Logo";
import Image from "next/image";

// Placeholder for gig and worker data
const gig = {
  title: "Bartender Gig",
  location: "The Green Tavern, Rye lane, Peckham, SE15 5AR",
  date: "2025-07-25",
  startTime: "18:00",
  endTime: "00:00",
  hourlyRate: 15,
  totalCost: 98.68,
  specialInstructions:
    "Ensure all glassware is polished and the bar is stocked before opening. Dress code: black shirt and trousers.",
  status: 1, // 1: accepted, 2: started, 3: mark as complete, 4: paid
};
const worker = {
  name: "Benji Asamoah",
  avatarUrl: "/images/benji.jpeg",
  gigs: 15,
  experience: 3,
  isStar: true,
};
const stepLabels = [
  "Gig accepted",
  "Benji has started the gig",
  "Mark as complete, pay Benji",
  "Gigee Paid",
];

export default function BuyerGigDetailsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const pageUserId = params.userId as string;

  const { user, loading: loadingAuth, updateUserContext } = useUser(); 
  const authUserId = user?.uid;

  useEffect(() => {
    if (loadingAuth) {
      return; // Wait for user context to load
    }

    // if (!user?.isAuthenticated) {
    //   router.push(`/signin?redirect=${encodeURIComponent(pathname)}`);
    //   return;
    // }

    // if (!authUserId) {
    //   console.error("User is authenticated but UID is missing. Redirecting to signin.");
    //   router.push(`/signin?redirect=${encodeURIComponent(pathname)}`);
    //   return;
    // }

    // // Authorization check: Ensure the authenticated user is accessing their own data
    // if (authUserId !== pageUserId) {
    //   console.warn(`Authorization Mismatch: Authenticated user ${authUserId} attempting to access page for ${pageUserId}. Redirecting.`);
    //   router.push("/signin?error=unauthorized");
    //   return;
    // }

    // Role check and context update
    if (user?.canBeBuyer || user?.isQA) { // Assuming QA users might also access buyer pages
      updateUserContext({
        lastRoleUsed: "BUYER",
        lastViewVisited: pathname,
      }).catch(err => {
        console.error("Failed to update user context with last visit/role:", err);
        // Non-critical error
      });
    } else {
      console.warn(`Role Mismatch: User ${authUserId} is not a Buyer or QA. Redirecting.`);
      // router.push("/select-role");
    }
  }, [user, loadingAuth, authUserId, pageUserId, router, pathname, updateUserContext]);

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Logo width={50} height={50} />
          <h1 className={styles.pageTitle}>{gig.title}</h1>
        </div>
        <button className={styles.chatButton} aria-label="Chat">
          <MessageSquare size={40} className={styles.icon} fill="#ffffff"/>
        </button>
      </header>

      {/* Gig Details Card */}
      <section className={styles.gigDetailsSection}>
        <div className={styles.gigDetailsHeader}>
           <h2 className={styles.sectionTitle}>Gig Details</h2>
           <Calendar size={26} color='#ffffff'/>
        </div>
        <div className={styles.gigDetailsRow}>
          <span className={styles.label}>Location:</span>
          <span className={styles.detailValue}>{gig.location}</span>
        </div>
        <div className={styles.gigDetailsRow}>
          <span className={styles.label}>Date:</span>
          <span className={styles.detailValue}>
            {new Date(gig.date).toLocaleDateString(undefined, {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
        </div>
        <div className={styles.gigDetailsRow}>
          <span className={styles.label}>Time:</span>
          <span className={styles.detailValue}>
            {gig.startTime} PM - {gig.endTime} AM
          </span>
        </div>
        <div className={styles.gigDetailsRow}>
          <span className={styles.label}>Pay per hour:</span>
          <span className={styles.detailValue}>£{gig.hourlyRate}</span>
        </div>
        <div className={styles.gigDetailsRow}>
          <span className={styles.label}>Total cost:</span>
          <span className={styles.detailValue}>
            incl Able fees +VAT and Stripe fees:{" "}
            <b>£{gig.totalCost.toFixed(2)}</b>
          </span>
        </div>
      </section>

      {/* Worker Card */}
      <section
        className={`${styles.gigDetailsSection} ${pageStyles.workerSection}`}
      >
        <Image
          src={worker.avatarUrl}
          className={pageStyles.workerAvatar}
          alt={worker.name}
          width={56}
          height={56}
        />
        <div className={pageStyles.workerDetailsContainer}>
          <div className={pageStyles.workerDetails}>
            <span className={pageStyles.workerName}>
              {worker.name}
            </span>
             {worker.gigs} Able gigs, {worker.experience} years experience
          </div>
          {worker.isStar && <Image src="/images/star.svg" alt="Star" width={56} height={50} />}
        </div>
      </section>

      {/* Special Instructions */}
      <section className={styles.instructionsSection}>
        <h2 className={styles.sectionTitle}>
          <Info size={18} />
          Special Instructions
        </h2>
        <p className={styles.specialInstructions}>{gig.specialInstructions}</p>
      </section>

      {/* Stepper/Status */}
      <section style={{ margin: "24px 0" }}>
        <ol style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {stepLabels.map((label, idx) => (
            <li
              key={label}
              style={{
                background: gig.status === idx + 1 ? "#5dade2" : "#23272b",
                color: gig.status === idx + 1 ? "#fff" : "#c2c2c2",
                borderRadius: 24,
                padding: "12px 0",
                marginBottom: 8,
                textAlign: "center",
                fontWeight: 600,
                fontSize: 16,
                border:
                  gig.status === idx + 1
                    ? "2px solid #5dade2"
                    : "1px solid #23272b",
                transition: "all 0.2s",
              }}
            >
              <span style={{ marginRight: 8, fontWeight: 700 }}>{idx + 1}</span>{" "}
              {label}
            </li>
          ))}
        </ol>
      </section>

      {/* Action Buttons */}
      <section className={styles.actionSection}>
        <button className={styles.negotiationButton} disabled>
          Cancel, amend gig timing or add tips
        </button>
        <div className={styles.secondaryActionsSection}>
          <Link
            href="/terms-of-service"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.secondaryActionButton}
          >
            <FileText size={16} style={{ marginRight: "8px" }} />
            Terms of Agreement
          </Link>
          <button className={styles.secondaryActionButton}>
            <AlertCircle size={16} style={{ marginRight: "8px" }} />
            Report an issue
          </button>
        </div>
      </section>
    </div>
  );
}
