"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAppContext } from '@/app/hooks/useAppContext';
import Link from 'next/link';

import GigOfferCard from '@/app/components/shared/GigOfferCard'; // Assuming shared location
import AcceptedGigCard from '@/app/components/shared/AcceptedGigCard'; // Import new component
import AiSuggestionBanner from '@/app/components/shared/AiSuggestionBanner';
import { Home, ArrowLeft, Filter, Loader2, Inbox } from 'lucide-react';
import styles from './OffersPage.module.css'; // Import styles

interface GigOffer {
  id: string;
  role: string;
  buyerName: string;
  locationSnippet: string;
  dateString: string;
  timeString: string;
  hourlyRate: number;
  estimatedHours?: number;
  totalPay?: number;
  tipsExpected?: boolean;
  expiresAt?: string; // ISO string for countdown
  status?: 'pending' | 'expired' | 'accepted' | string; // Added 'accepted' status
  fullDescriptionLink?: string; // For view details
}

// Mock function to fetch data - returns both offers and accepted gigs
async function fetchWorkerData(userId: string, filters?: any): Promise<{ offers: GigOffer[], acceptedGigs: GigOffer[] }> {
  console.log("Fetching worker data for workerId:", userId, "with filters:", filters);
  await new Promise(resolve => setTimeout(resolve, 700));

  const mockOffers: GigOffer[] = [
    { id: 'offer1', role: 'Bartender', buyerName: 'Central Park Bar', locationSnippet: 'Central Park, Beaumont Place', dateString: '14/07/25', timeString: '3:00 PM - 7:00 PM', hourlyRate: 20, totalPay: 80, tipsExpected: true, expiresAt: new Date(Date.now() + 1000 * 60 * 34).toISOString(), status: 'pending', fullDescriptionLink: '/gigs/offer1-details' },
    { id: 'offer2', role: 'Waiter', buyerName: 'Downtown Soho', locationSnippet: 'Downtown, Soho', dateString: '15/07/25', timeString: '5:00 PM - 7:00 PM', hourlyRate: 15, totalPay: 30, expiresAt: new Date(Date.now() + 1000 * 87).toISOString(), status: 'pending' },
    // Add more pending offers if needed
  ].sort((a,b) => (a.expiresAt && b.expiresAt) ? new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime() : (a.expiresAt ? -1 : 1) ); // Sort by soonest to expire

  const mockAcceptedGigs: GigOffer[] = [
    { id: 'accepted1', role: 'Security Guard', buyerName: 'Event X', locationSnippet: 'Event Hall, City Center', dateString: '20/07/25', timeString: '8:00 PM - 11:00 PM', hourlyRate: 25, estimatedHours: 3, status: 'accepted' },
    { id: 'accepted2', role: 'Usher', buyerName: 'Concert Y', locationSnippet: 'Arena, Suburb', dateString: '21/07/25', timeString: '7:00 PM - 10:00 PM', hourlyRate: 18, estimatedHours: 3, status: 'accepted' },
    // Add more accepted gigs if needed
  ].sort((a, b) => new Date(a.dateString + ' ' + a.timeString.split(' - ')[0]).getTime() - new Date(b.dateString + ' ' + b.timeString.split(' - ')[0]).getTime()); // Sort accepted by date/time

  return { offers: mockOffers, acceptedGigs: mockAcceptedGigs };
}


export default function WorkerOffersPage() {
  const router = useRouter();
  const params = useParams();
  const pageUserId = params.userId as string;

  const { isAuthenticated, isLoading, user, isWorkerMode } = useAppContext(); // Adjusted destructuring

  const [offers, setOffers] = useState<GigOffer[]>([]);
  const [acceptedGigs, setAcceptedGigs] = useState<GigOffer[]>([]); // New state for accepted gigs
  const [isLoadingData, setIsLoadingData] = useState(true); // Renamed loading state
  const [error, setError] = useState<string | null>(null);
  const [processingOfferId, setProcessingOfferId] = useState<string | null>(null);
  const [processingAction, setProcessingAction] = useState<'accept' | 'decline' | null>(null);

  // Auth check
  useEffect(() => {
    if (!isLoading) { // Use isLoading
       // if (!isAuthenticated || user?.uid !== pageUserId || !isWorkerMode) { // Use user?.uid and isWorkerMode
       //   router.replace('/signin');
       // }
    }
  }, [isAuthenticated, isLoading, user?.uid, pageUserId, isWorkerMode, router]); // Added user?.uid and isWorkerMode dependencies

  // Fetch worker data (offers and accepted gigs)
  useEffect(() => {
    if (isAuthenticated && user?.uid) { // Use user?.uid
      setIsLoadingData(true); // Use renamed loading state
      fetchWorkerData(user.uid) // Use user.uid and new function
        .then(data => {
          setOffers(data.offers); // Set offers
          setAcceptedGigs(data.acceptedGigs); // Set accepted gigs
          setError(null);
        })
        .catch(err => {
          console.error("Failed to fetch worker data:", err);
          setError("Could not load gig data. Please try again."); // Updated error message
        })
        .finally(() => setIsLoadingData(false)); // Use renamed loading state
    }
  }, [isAuthenticated, user?.uid]); // Added user?.uid dependency


  const handleAcceptOffer = async (offerId: string) => {
    setProcessingOfferId(offerId);
    setProcessingAction('accept');
    console.log("Accepting offer:", offerId);
    // TODO: API call to POST /api/gigs/offers/{offerId}/accept
    try {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API
      // On success from API:
      setOffers(prev => prev.filter(o => o.id !== offerId)); // Remove from list
      // Show success toast/message: "Offer accepted! Added to your calendar."
      // router.push(`/user/${authUserId}/worker/gigs/${acceptedGigId}`); // Navigate to accepted gig details
    } catch (err) {
      console.error("Error accepting offer:", err);
      // Show error toast/message
    } finally {
      setProcessingOfferId(null);
      setProcessingAction(null);
    }
  };

  const handleDeclineOffer = async (offerId: string) => {
    setProcessingOfferId(offerId);
    setProcessingAction('decline');
    console.log("Declining offer:", offerId);
    // TODO: API call to POST /api/gigs/offers/{offerId}/decline
    try {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API
      // On success from API:
      setOffers(prev => prev.filter(o => o.id !== offerId)); // Remove from list
      // Show success toast/message: "Offer declined."
    } catch (err) {
      console.error("Error declining offer:", err);
      // Show error toast/message
    } finally {
      setProcessingOfferId(null);
      setProcessingAction(null);
    }
  };

  const handleViewDetails = (offerId: string) => {
    const offer = offers.find(o => o.id === offerId);
    if (offer?.fullDescriptionLink) {
      router.push(offer.fullDescriptionLink);
    } else {
      alert("Full details view not available for this offer yet.");
      // Or open a modal with more info if data is present in offer object
    }
  };

  if (isLoading || (!isAuthenticated && !isLoading) || (user?.uid && user.uid !== pageUserId) ) { // Use isLoading and user?.uid
    return <div className={styles.loadingContainer}><Loader2 className="animate-spin" size={32} /> Loading...</div>;
  }

  return (
    <div className={styles.container}> {/* Use styles */}
      <div className={styles.pageWrapper}> {/* Use styles */}
        <header className={styles.header}> {/* Use styles */}
          {/*<button onClick={() => router.back()} className={styles.backButton} aria-label="Go back">
            <ArrowLeft size={24} />
          </button>*/}
          <h1 className={styles.pageTitle}>Gig Offers</h1> {/* Use styles */}
          {/*<button onClick={() => alert("Filter functionality to be implemented")} className={styles.filterButton}>
            <Filter size={16} /> Filter
          </button>*/}
        </header>

        <div className={styles.infoBanner}> {/* Use styles */}
          <img src="/avatar.png" alt="Avatar" className={styles.avatar} /> {/* Use styles */}
          <p>Accept these gigs within the time shown or we will offer them to someone else!</p>
        </div>

        {isLoadingData ? ( // Use renamed loading state
          <div className={styles.loadingContainer}><Loader2 className="animate-spin" size={28}/> Loading offers...</div> // Use styles
        ) : error ? (
          <div className={styles.emptyState}>{error}</div> // Use styles
        ) : offers.filter(o => o.status !== 'expired'/* && timeLeft !== "Expired" Re-check expiry with timeLeft state */).length === 0 && acceptedGigs.length === 0 ? ( // Check both lists
          <div className={styles.emptyState}> {/* Use styles */}
            <Inbox size={48} style={{marginBottom: '1rem', color: '#525252'}}/>
            No new gig offers or upcoming accepted gigs available right now. Make sure your Gigfolio and availability are up to date!
          </div>
        ) : (
          <div className={styles.offerList}> {/* Use styles */}
            {/* Pending Offers Section */}
            {offers.filter(o => o.status !== 'expired').length > 0 && (
                <div className={styles.offersSection}> {/* New div for offers section */}
                    <h2 className={styles.sectionTitle}>New Gig Offers</h2> {/* Title for offers */}
                    {offers.filter(o => o.status !== 'expired').map(offer => (
                    <GigOfferCard
                        key={offer.id}
                        offer={offer}
                        onAccept={handleAcceptOffer}
                        onDecline={handleDeclineOffer}
                        onViewDetails={handleViewDetails}
                        isProcessingAccept={processingOfferId === offer.id && processingAction === 'accept'}
                        isProcessingDecline={processingOfferId === offer.id && processingAction === 'decline'}
                    />
                    ))}
                </div>
            )}

            {/* Accepted Upcoming Gigs Section */}
            {acceptedGigs.length > 0 && (
                <div className={styles.acceptedSection}> {/* New div for accepted section */}
                    <h2 className={styles.sectionTitle}>Accepted Upcoming Gigs</h2> {/* Title for accepted */}
                    {acceptedGigs.map(gig => (
                        <AcceptedGigCard // Use the new component
                            key={gig.id}
                            gig={gig} // Pass the gig data
                            onViewDetails={handleViewDetails} // Only view details for accepted
                            // Removed onAccept and onDecline as they are not needed here
                        />
                    ))}
                </div>
            )}
          </div>
        )}

        <footer className={styles.footer}> {/* Use styles */}
          <Link href={`/user/${user?.uid}/worker`} passHref> {/* Use user?.uid */}
            <button className={styles.homeButton} aria-label="Go to Home"> {/* Use styles */}
                <Home size={24} />
            </button>
          </Link>
        </footer>
      </div>
    </div>
  );
} 