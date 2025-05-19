"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAppContext } from '@/app/hooks/useAppContext';
import Link from 'next/link';

import {
  ArrowLeft, Home, UserCircle, CalendarDays, Clock, MapPin, PoundSterling, Info, MessageSquare, Edit3, AlertCircle, Share2, FileText, PlayCircle, CheckCircle, XCircle, Loader2
} from 'lucide-react';

import styles from './GigDetailsPage.module.css';

// Define interface for Gig details
interface GigDetails {
  id: string;
  role: string; // e.g., Bartender
  gigTitle: string; // e.g., "at The Grand Cafe" or full title if preferred
  buyerName: string;
  buyerAvatarUrl?: string;
  date: string; // ISO
  startTime: string; // ISO
  endTime: string; // ISO
  duration?: string; // e.g., "5 hours" - can be calculated
  location: string;
  hourlyRate: number;
  estimatedEarnings: number;
  specialInstructions?: string;
  status: 'ACCEPTED' | 'IN_PROGRESS' | 'AWAITING_BUYER_CONFIRMATION' | 'COMPLETED' | 'CANCELLED'; // From Prisma enum
  // Add other relevant fields
}

// Mock function to fetch gig details - replace with actual API call
async function fetchWorkerGigDetails(userId: string, gigId: string): Promise<GigDetails | null> {
  console.log("Fetching gig details for worker:", userId, "gig:", gigId);
  // API call: GET /api/gigs/worker/${gigId} (ensure backend auth checks worker owns this gig)
  // Or: GET /api/gigs/${gigId} and then verify workerId matches on client
  await new Promise(resolve => setTimeout(resolve, 700));

  // Example Data (should match the actual GigDetails interface)
  if (gigId === "gig123-accepted") {
    return {
      id: "gig123-accepted", role: "Lead Bartender", gigTitle: "Corporate Mixer Event",
      buyerName: "Innovate Solutions Ltd.", buyerAvatarUrl: "/images/logo-placeholder.svg",
      date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // In 2 days
      startTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).setHours(18,0,0,0).toString(),
      endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).setHours(23,0,0,0).toString(),
      location: "123 Business Rd, Tech Park, London, EC1A 1BB",
      hourlyRate: 25, estimatedEarnings: 125,
      specialInstructions: "Focus on high-quality cocktails. Dress code: smart black. Setup starts 30 mins prior. Contact person on site: Jane (07xxxxxxxxx).",
      status: "ACCEPTED",
    };
  }
  if (gigId === "gig456-inprogress") {
     return {
      id: "gig456-inprogress", role: "Event Server", gigTitle: "Wedding Reception",
      buyerName: "Alice & Bob",
      date: new Date().toISOString(), // Today
      startTime: new Date().setHours(16,0,0,0).toString(),
      endTime: new Date().setHours(22,0,0,0).toString(),
      location: "The Manor House, Countryside Lane, GU21 5ZZ",
      hourlyRate: 18, estimatedEarnings: 108,
      specialInstructions: "Silver service required. Liaise with the event coordinator Sarah upon arrival.",
      status: "IN_PROGRESS",
    };
  }
  return null; // Or throw an error
}


// Helper to format date and time
const formatGigDate = (isoDate: string) => new Date(isoDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
const formatGigTime = (isoTime: string) => new Date(isoTime).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: true });
const calculateDuration = (startIso: string, endIso: string): string => {
    const startDate = new Date(startIso);
    const endDate = new Date(endIso);
    const diffMs = endDate.getTime() - startDate.getTime();
    if (diffMs <= 0) return "N/A";
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    let durationStr = "";
    if (hours > 0) durationStr += `${hours} hour${hours > 1 ? 's' : ''}`;
    if (minutes > 0) durationStr += ` ${minutes} minute${minutes > 1 ? 's' : ''}`;
    return durationStr.trim() || "N/A";
};


export default function WorkerGigDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const pageUserId = params.userId as string;
  const gigId = params.gigId as string;

  const { isLoading, isAuthenticated, user, isWorkerMode } = useAppContext();

  const [gig, setGig] = useState<GigDetails | null>(null);
  const [isLoadingGig, setIsLoadingGig] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Auth check
  useEffect(() => {
    if (!isLoading) {
    //   if (!isAuthenticated || user?.uid !== pageUserId || !isWorkerMode) {
    //     router.replace('/signin');
    //   }
    }
  }, [isAuthenticated, isLoading, user, pageUserId, isWorkerMode, router]);

  // Fetch gig details
  useEffect(() => {
    if (isAuthenticated && user?.uid && gigId) {
      setIsLoadingGig(true);
      fetchWorkerGigDetails(user.uid, gigId)
        .then(data => {
          if (data) {
            setGig(data);
          } else {
            setError("Gig not found or access denied.");
          }
        })
        .catch(err => {
          console.error("Failed to fetch gig details:", err);
          setError("Could not load gig details.");
        })
        .finally(() => setIsLoadingGig(false));
    }
  }, [isAuthenticated, user, gigId]);

  const handleGigAction = async (action: 'start' | 'complete' | 'requestAmendment' | 'reportIssue' | 'delegate') => {
    if (!gig) return;
    setIsActionLoading(true);
    setError(null);
    console.log(`Performing action: ${action} for gig: ${gig.id}`);
    // TODO: API call to backend, e.g., POST /api/gigs/worker/${gig.id}/action
    // Body: { action: 'start' } or { action: 'complete', details: {...} }
    try {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API
      // On success, update gig state locally or refetch
      if (action === 'start' && gig) {
        setGig({ ...gig, status: 'IN_PROGRESS' });
        // Show success message
      } else if (action === 'complete' && gig) {
        setGig({ ...gig, status: 'AWAITING_BUYER_CONFIRMATION' });
        // Potentially navigate to feedback screen: router.push(`/user/${user?.uid}/worker/gigs/${gig.id}/feedback`);
      }
      // Handle other actions
    } catch (err: any) {
      setError(err.message || `Failed to ${action} gig.`);
    } finally {
      setIsActionLoading(false);
    }
  };
  
  const getStatusBadgeClass = (status: GigDetails['status']) => {
    switch (status) {
        case 'ACCEPTED': return styles.statusAccepted;
        case 'IN_PROGRESS': return styles.statusInProgress;
        case 'AWAITING_BUYER_CONFIRMATION': return styles.statusAwaitingConfirmation;
        case 'COMPLETED': return styles.statusCompleted;
        case 'CANCELLED': return styles.statusCancelled;
        default: return '';
    }
  }

  if (isLoading || isLoadingGig) {
    return <div className={styles.loadingContainer}><Loader2 className="animate-spin" size={32} /> Loading Gig Details...</div>;
  }

  if (error) {
    return <div className={styles.container}><div className={styles.pageWrapper}><p className={styles.errorMessage}>{error}</p></div></div>;
  }

  if (!gig) {
    return <div className={styles.container}><div className={styles.pageWrapper}><p className={styles.emptyState}>Gig details not found.</p></div></div>;
  }

  const gigDuration = calculateDuration(gig.startTime, gig.endTime);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button onClick={() => router.back()} className={styles.backButton} aria-label="Go back">
          <ArrowLeft size={24} />
        </button>
        <h1 className={styles.pageTitle}>{gig.role} - {gig.gigTitle}</h1>
        <span className={`${styles.statusBadge} ${getStatusBadgeClass(gig.status)}`}>{gig.status.replace('_', ' ')}</span>
         {/* Kept chat button from previous version, styled with new .chatButton */}
        <button onClick={() => router.push(`/chat?gigId=${gig.id}`)} className={styles.chatButton}>
            <MessageSquare size={18} className={styles.icon} /> Chat
        </button>
      </header>

      {/* Core Gig Info Section - Adapted to new structure */}
      <section className={styles.gigDetailsSection}>
        <h2 className={styles.sectionTitle}><Info size={18}/>Gig Details</h2>
        <div className={styles.gigDetailsRow}>
          <span className={styles.label}>Buyer:</span>
          <span className={styles.detailValue}>{gig.buyerName}</span>
        </div>
        <div className={styles.gigDetailsRow}>
          <span className={styles.label}>Location:</span>
          <span className={styles.detailValue}>
              {gig.location}
              <a href={`https://maps.google.com/?q=${encodeURIComponent(gig.location)}`} target="_blank" rel="noopener noreferrer" style={{marginLeft: '0.5rem'}}>(View Map)</a>
          </span>
        </div>
        <div className={styles.gigDetailsRow}>
          <span className={styles.label}>Date:</span>
          <span className={styles.detailValue}>{formatGigDate(gig.date)}</span>
        </div>
        <div className={styles.gigDetailsRow}>
          <span className={styles.label}>Time:</span>
          <span className={styles.detailValue}>{formatGigTime(gig.startTime)} - {formatGigTime(gig.endTime)} ({gigDuration})</span>
        </div>
        <div className={styles.gigDetailsRow}>
          <span className={styles.label}>Hourly Rate:</span>
          <span className={styles.detailValue}>£{gig.hourlyRate.toFixed(2)}/hr</span>
        </div>
         <div className={styles.gigDetailsRow}>
          <span className={styles.label}>Estimated Earnings:</span>
          <span className={styles.detailValue}>£{gig.estimatedEarnings.toFixed(2)} + tips</span>
        </div>
         {/* Hiring Manager Info - Placeholder as it's not in current GigDetails interface */}
         {/*
         <div className={styles.gigDetailsRow}>
          <span className={styles.label}>Hiring Manager:</span>
          <span className={styles.detailValue}>N/A</span>
         </div>
         */}
      </section>

       {/* Negotiation Button - Kept from new structure */}
       {/* Added a check to only show if gig is accepted */}
       {gig.status === 'ACCEPTED' && (
        <button className={styles.negotiationButton}>
          Negotiate, cancel or change gig details
        </button>
       )}

      {/* Special Instructions Section */}
      {gig.specialInstructions && (
        <section className={styles.instructionsSection}>
          <h2 className={styles.sectionTitle}><Info size={18}/>Special Instructions</h2>
          <p className={styles.specialInstructions}>{gig.specialInstructions}</p>
        </section>
      )}

      {/* Primary Actions Section - Adapted to new structure */}
      <section className={styles.actionSection}>
        {gig.status === 'ACCEPTED' && (
          <button onClick={() => handleGigAction('start')} className={`${styles.actionButton} ${styles.actionButtonPrimary}`} disabled={isActionLoading}>
            {isActionLoading ? <Loader2 className="animate-spin"/> : <PlayCircle className={styles.icon}/>} Mark as Started
          </button>
        )}
        {gig.status === 'IN_PROGRESS' && (
          <button onClick={() => handleGigAction('complete')} className={`${styles.actionButton} ${styles.actionButtonPrimary}`} disabled={isActionLoading}>
           {isActionLoading ? <Loader2 className="animate-spin"/> : <CheckCircle className={styles.icon}/>} Mark as Completed
          </button>
        )}
        {gig.status === 'AWAITING_BUYER_CONFIRMATION' && (
          <p className={styles.actionInfoText}>Waiting for buyer to confirm completion.</p>
        )}
         {gig.status === 'COMPLETED' && (
          <p className={`${styles.actionInfoText}`} style={{color: 'var(--success-color)'}}><CheckCircle size={18} style={{marginRight: '8px'}}/> Gig completed successfully!</p>
        )}
        {gig.status === 'CANCELLED' && (
          <p className={`${styles.actionInfoText}`} style={{color: 'var(--error-color)', backgroundColor: 'rgba(239,68,68,0.1)'}}><XCircle size={18} style={{marginRight: '8px'}}/> This gig was cancelled.</p>
        )}
         {/* Add other action buttons based on status if needed, following the .actionButton pattern */}
      </section>

      {/* Secondary Actions Section - Adapted to new structure */}
      {(gig.status === 'ACCEPTED' || gig.status === 'IN_PROGRESS') && ( /* Only show if gig is not completed or cancelled */
          <section className={`${styles.secondaryActionsSection}`}> {/* Using secondaryActionsSection class */}
              <button onClick={() => handleGigAction('requestAmendment')} className={styles.secondaryActionButton} disabled={isActionLoading}>
                  <Edit3 size={16} style={{marginRight: '8px'}}/> Request Gig Amendment
              </button>
              <button onClick={() => handleGigAction('reportIssue')} className={styles.secondaryActionButton} disabled={isActionLoading}>
                  <AlertCircle size={16} style={{marginRight: '8px'}}/> Report an Issue
              </button>
              {/* <button onClick={() => handleGigAction('delegate')} className={styles.secondaryActionButton} disabled={isActionLoading}>
                  <Share2 size={16} style={{marginRight: '8px'}}/> Delegate Gig
              </button> */}
          </section>
      )}
       {/* Terms link - Adapted to new structure */}
       <section className={styles.secondaryActionsSection}> {/* Placed in a separate section to always show */}
          <Link href="/terms-of-service" target="_blank" rel="noopener noreferrer" className={styles.secondaryActionButton}>
              <FileText size={16} style={{marginRight: '8px'}}/>Terms of agreement
          </Link>
       </section>

      {/* Footer (Home Button) */}
      <footer className={styles.footer}>
        <Link href={`/user/${user?.uid}/worker`} passHref>
          <button className={styles.homeButton} aria-label="Go to Home">
              <Home size={24} />
          </button>
        </Link>
      </footer>
    </div>
  );
} 