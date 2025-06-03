"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Info, MessageSquare, Star, FileText, AlertCircle } from "lucide-react";
import styles from "@/app/user/[userId]/worker/gigs/[gigId]/GigDetailsPage.module.css";
import { useAppContext } from "@/app/hooks/useAppContext";

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
  const { isLoading: loadingAuth, user, updateUserContext } = useAppContext();

  useEffect(() => {
    if (!loadingAuth && user?.isAuthenticated) {
      if (user?.canBeBuyer || user?.isQA) {
        updateUserContext({
          lastRoleUsed: "BUYER", // Ensure the context reflects the current role
          lastViewVisited: pathname, // Update last view visited
        });
      } else {
        router.replace("/select-role");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.isAuthenticated, loadingAuth]);

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: "#222",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
              marginRight: 12,
            }}
          >
            <span role="img" aria-label="gig">
              🧑‍🎤
            </span>
          </div>
          <h1 className={styles.pageTitle}>{gig.title}</h1>
        </div>
        <button className={styles.chatButton} aria-label="Chat">
          <MessageSquare size={22} className={styles.icon} />
        </button>
      </header>

      {/* Gig Details Card */}
      <section className={styles.gigDetailsSection}>
        <h2 className={styles.sectionTitle}>
          <Info size={18} />
          Gig Details
        </h2>
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
        className={styles.gigDetailsSection}
        style={{ display: "flex", alignItems: "center", gap: 16 }}
      >
        <img
          src={worker.avatarUrl}
          alt={worker.name}
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            objectFit: "cover",
            marginRight: 12,
          }}
        />
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontWeight: 600, fontSize: "1.1rem" }}>
              {worker.name}
            </span>
            {worker.isStar && <Star size={20} color="#5dade2" fill="#5dade2" />}
          </div>
          <div style={{ color: "#a0a0a0", fontSize: 14 }}>
            {worker.gigs} Able gigs, {worker.experience} years experience
          </div>
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
