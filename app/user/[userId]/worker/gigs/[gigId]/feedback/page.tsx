"use client";

import React, { useState, useEffect, FormEvent, ChangeEvent } from "react";
import { useRouter, useParams, usePathname } from "next/navigation";
import { useUser } from "@/app/context/UserContext";
import styles from "./FeedbackPage.module.css";
import {
  ThumbsUp,
  ThumbsDown,
  Trophy,
  Star,
  Send,
} from "lucide-react";

interface GigDetails {
  id: string;
  role: string;
  duration: string;
  details: string;
  earnings: number;
}

interface FormData {
  feedbackText: string;
  wouldWorkAgain: boolean | null;
  topCommunicator: boolean;
  teamBuilder: boolean;
  expensesText: string;
}

const MockGigDetails: GigDetails = {
  id: "gig123",
  role: "Bartender",
  duration: "4 hours",
  details: "Completed gig on Monday, 9:00 am. Location: Central Train station",
  earnings: 80.0,
};

export default function WorkerFeedbackPage() {
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  const pageUserId = params.userId as string;
  const gigId = params.gigId as string;

  const { user, loading: loadingAuth, updateUserContext } = useUser();
  const authUserId = user?.uid;

  const [formData, setFormData] = useState<FormData>({
    feedbackText: "",
    wouldWorkAgain: null,
    topCommunicator: false,
    teamBuilder: false,
    expensesText: "",
  });

  useEffect(() => {
    if (loadingAuth) return;

    if (!user?.isAuthenticated) {
      router.push(`/signin?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    if (!authUserId) {
      console.error("User is authenticated but UID is missing. Redirecting to signin.");
      router.push(`/signin?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    if (authUserId !== pageUserId) {
      router.push('/signin?error=unauthorized');
      return;
    }

    if (!(user.canBeGigWorker || user.isQA)) {
      router.push('/select-role');
      return;
    }

    updateUserContext({
      lastRoleUsed: "GIG_WORKER",
      lastViewVisited: pathname,
    }).catch(err => {
      console.error("Failed to update user context for worker feedback page:", err);
      // Non-critical error
    });
  }, [user, loadingAuth, authUserId, pageUserId, router, pathname, updateUserContext]);

  const handleThumbsUp = () =>
    setFormData({ ...formData, wouldWorkAgain: true });
  const handleThumbsDown = () =>
    setFormData({ ...formData, wouldWorkAgain: false });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    console.log("Submitting feedback:", formData);
    router.push(`/user/${pageUserId}/worker/gigs/${gigId}/earnings`);
  };
  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, type, value } = e.target;
    const checked =
      type === "checkbox" ? (e.target as HTMLInputElement).checked : undefined;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // if (loading) {
  //     return <div className={styles.loadingContainer}>Loading...</div>;
  // }

  return (
    <div className={styles.container}>
      <div className={styles.pageWrapper}>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            Confirm Hours Worked & Feedback
          </h2>
          <div className={styles.gigSummaryCard}>
            <p>
              <strong>{MockGigDetails.role}</strong>
            </p>
            <p>{MockGigDetails.details}</p>
            <p>Duration: {MockGigDetails.duration}</p>
          </div>
          <p className={styles.earnings}>
            Earnings: £{MockGigDetails.earnings.toFixed(2)}
          </p>
        </section>

        <form onSubmit={handleSubmit}>
          <section className={styles.section}>
            <div className={styles.actionButtonWithNumber}>
              <div className={styles.actionNumber}>1</div>
              <label htmlFor="feedbackText" className={styles.sectionTitle}>
                Share your experience...Provide feedback to earn awards
              </label>
              <textarea
                id="feedbackText"
                name="feedbackText"
                className={styles.feedbackTextarea}
                placeholder="Share your experience..."
                value={formData.feedbackText}
                onChange={handleChange}
              />
            </div>
          </section>

          <section className={styles.section}>
            <div className={styles.actionButtonWithNumber}>
              <div className={styles.actionNumber}>2</div>
              <h3 className={styles.sectionTitle}>
                Would you work with this buyer again?
              </h3>
              <div className={styles.thumbsContainer}>
                <button
                  className={`${styles.thumbButton} ${
                    formData.wouldWorkAgain === true ? styles.selected : ""
                  }`}
                  onClick={handleThumbsUp}
                >
                  <ThumbsUp size={30} />
                </button>
                <button
                  className={`${styles.thumbButton} ${
                    formData.wouldWorkAgain === false ? styles.selected : ""
                  }`}
                  onClick={handleThumbsDown}
                >
                  <ThumbsDown size={30} />
                </button>
              </div>
            </div>
          </section>

          <section className={styles.section}>
            <div className={styles.actionButtonWithNumber}>
              <div className={styles.actionNumber}>3</div>
              <h3 className={styles.sectionTitle}>
                Would you like to award the buyer?
              </h3>
              <div className={styles.badgeContainer}>
                <button
                  className={`${styles.badgeButton} ${
                    formData.topCommunicator ? styles.selected : ""
                  }`}
                  onClick={() =>
                    setFormData({
                      ...formData,
                      topCommunicator: !formData.topCommunicator,
                    })
                  }
                >
                  <Trophy size={24} className={styles.badgeIcon} />
                  Top communicator
                </button>
                <button
                  className={`${styles.badgeButton} ${
                    formData.teamBuilder ? styles.selected : ""
                  }`}
                  onClick={() =>
                    setFormData({
                      ...formData,
                      teamBuilder: !formData.teamBuilder,
                    })
                  }
                >
                  <Star size={24} className={styles.badgeIcon} />
                  Team builder
                </button>
              </div>
            </div>
          </section>

          <section className={styles.section}>
            <div className={styles.actionButtonWithNumber}>
              <div className={styles.actionNumber}>4</div>
              <h3 className={styles.sectionTitle}>
                Log any expenses you incurred here
              </h3>
              <textarea
                id="expensesText"
                name="expensesText"
                className={styles.expensesInput}
                placeholder="Note & upload images of costs incurred for your taxes"
                value={formData.expensesText}
                onChange={handleChange}
              />
            </div>
          </section>

          <section className={styles.section}>
            <button className={styles.negotiationButton}>
              Ammend gig timing or add tips
            </button>
          </section>

          <section className={styles.section}>
            <div className={styles.actionButtonWithNumber}>
              <div className={styles.actionNumber}>5</div>
              <button className={styles.submitButton} type="submit">
                <Send size={18} /> Submit for payment
              </button>
            </div>
          </section>
        </form>
      </div>
    </div>
  );
}
