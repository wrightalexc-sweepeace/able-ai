"use client";

import React, { useState, FormEvent, ChangeEvent } from "react";
import { useRouter, useParams, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Feedback from "@/app/components/gigs/Feedback";

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

  const { user, loading: loadingAuth } = useAuth();
  const authUserId = user?.uid;

  const [formData, setFormData] = useState<FormData>({
    feedbackText: "",
    wouldWorkAgain: null,
    topCommunicator: false,
    teamBuilder: false,
    expensesText: "",
  });

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
    <Feedback />
  );
}
