"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import ChatBotLayout from "@/app/components/onboarding/ChatBotLayout";
import MessageBubble from "@/app/components/onboarding/MessageBubble";
import RehireWorkerCard from "@/app/components/buyer/RehireWorkerCard";
import Link from "next/link";
import { Home, Loader2 } from "lucide-react";
import styles from "./RehirePage.module.css";
import RehireView from "./RehireView";

const BOT_AVATAR_SRC = "/images/logo-placeholder.svg";

export interface OriginalGigInfo {
  workerName: string;
  role: string;
  originalDate: string;
  originalLocation: string;
}
export interface RehireWorkerData {
  workerId: string;
  name: string;
  avatarUrl?: string;
  role: string;
  ableGigs: number;
  experienceYears: string | number;
  reviewKeywords: string[];
  proposedHourlyRate: number;
  proposedHours: number;
  platformFeePercent: number;
  paymentProviderFeeFixed: number;
  paymentProviderFeePercent: number;
}

interface RehireContainerProps {
  initialData: {
    originalGig: OriginalGigInfo;
    workerForRehire: RehireWorkerData;
  } | null;
  userId: string;
  gigId: string;
}

const RehireContainer: React.FC<RehireContainerProps> = ({ initialData, userId, gigId }) => {
  const { user, loading: loadingAuth } = useAuth();
  const chatContainerRef = useRef<HTMLDivElement>(null) as React.RefObject<HTMLDivElement>;

  const [originalGigInfo, setOriginalGigInfo] = useState<OriginalGigInfo | null>(initialData ? initialData.originalGig : null);
  const [workerToRehire, setWorkerToRehire] = useState<RehireWorkerData | null>(initialData ? initialData.workerForRehire : null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<
    Array<{
      id: number;
      type: "bot" | "userAction";
      content: string | React.ReactNode;
    }>
  >(
    initialData
      ? [
          {
            id: 1,
            type: "bot",
            content: `Awesome, you want to rehire ${initialData.originalGig.workerName} for a ${initialData.originalGig.role} shift, similar to your gig on ${initialData.originalGig.originalDate} at ${initialData.originalGig.originalLocation}? (Proposing a 4 hour shift for next Friday at 6pm - you can edit this.)`,
          },
          {
            id: 2,
            type: "bot",
            content: `Perfect, ${initialData.originalGig.workerName} is generally available. Click the card to edit details or book them now!`,
          },
        ]
      : []
  );

  // Scroll to bottom for chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleEditDetails = () => {
    if (!workerToRehire) return;
    alert("Gig detail editing form would open here. You'd adjust proposed date, time, hours.");
  };

  const handleBookWorker = async () => {
    if (!workerToRehire || !originalGigInfo) return;
    setIsBooking(true);
    setError(null);
    const bookingPayload = {
      buyerUserId: user?.uid || userId,
      workerId: workerToRehire.workerId,
      role: workerToRehire.role,
      proposedDate: "Next Friday",
      proposedStartTime: "18:00",
      proposedHours: workerToRehire.proposedHours,
      proposedRate: workerToRehire.proposedHourlyRate,
      location: originalGigInfo.originalLocation,
    };
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setChatMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          type: "bot",
          content: `Great! ${workerToRehire.name} has been booked for the new gig. Details are in your calendar.`,
        },
      ]);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
        setChatMessages((prev) => [
          ...prev,
          { id: Date.now(), type: "bot", content: `Error: ${err.message}` },
        ]);
      } else {
        setError("An unknown error occurred while booking the worker.");
        setChatMessages((prev) => [
          ...prev,
          { id: Date.now(), type: "bot", content: "Error: An unknown error occurred." },
        ]);
      }
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <RehireView
      loadingAuth={loadingAuth}
      isLoadingData={isLoadingData}
      error={error}
      originalGigInfo={originalGigInfo}
      workerToRehire={workerToRehire}
      chatMessages={chatMessages}
      chatContainerRef={chatContainerRef}
      handleEditDetails={handleEditDetails}
      handleBookWorker={handleBookWorker}
      isBooking={isBooking}
      userId={user?.uid || userId}
    />
  );
};

export default RehireContainer; 