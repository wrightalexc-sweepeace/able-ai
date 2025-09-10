"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { MapPin, Calendar, Clock, DollarSign, X, Eye } from 'lucide-react';
import type { Suggestion, SuggestedAction } from './AIChatContainer';
import { useAuth } from '@/context/AuthContext';
import { getWorkerOffers } from '@/actions/gigs/get-worker-offers';
import styles from './AbleAIPage.module.css';

type WorkerGigOffer = {
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
  expiresAt?: string;
  status: string;
  fullDescriptionLink?: string;
  gigDescription?: string;
  notesForWorker?: string;
};

interface AIChatViewProps {
  suggestion: Suggestion | null;
  onActionClick: (action: SuggestedAction) => void;
}

const AIChatView: React.FC<AIChatViewProps> = ({ suggestion, onActionClick }) => {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const pageUserId = (params as Record<string, string | string[]>)?.userId;
  const resolvedUserId = Array.isArray(pageUserId) ? pageUserId[0] : pageUserId;
  
  // State for gigs and modal
  const [gigs, setGigs] = useState<WorkerGigOffer[]>([]);
  const [loadingGigs, setLoadingGigs] = useState(true);
  const [selectedGig, setSelectedGig] = useState<WorkerGigOffer | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch gigs from database
  useEffect(() => {
    const fetchGigs = async () => {
      if (!user?.uid) {
        console.log('No user UID available');
        return;
      }
      
      // Check QA mode
      const isViewQA = localStorage.getItem('isViewQA') === 'true';
      console.log('QA Mode enabled:', isViewQA);
      
      console.log('Fetching gigs for user:', user.uid);
      
      try {
        setLoadingGigs(true);
        const result = await getWorkerOffers(user.uid);
        
        console.log('getWorkerOffers result:', result);
        
        if (result.success && result.data) {
          // Get first 3 gigs (offers first, then accepted)
          const allGigs = [...result.data.offers, ...result.data.acceptedGigs];
          console.log('All gigs:', allGigs);
          setGigs(allGigs.slice(0, 3));
        } else {
          console.log('getWorkerOffers failed:', result.error);
        }
      } catch (error) {
        console.error('Error fetching gigs:', error);
      } finally {
        setLoadingGigs(false);
      }
    };

    fetchGigs();
  }, [user?.uid]);

  // Handle gig click
  const handleGigClick = (gig: WorkerGigOffer) => {
    setSelectedGig(gig);
    setIsModalOpen(true);
  };

  // Handle go to gig offers
  const handleGoToGigOffers = () => {
    if (resolvedUserId) {
      router.push(`/user/${resolvedUserId}/worker/offers`);
    }
    setIsModalOpen(false);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Chat with Able</h1>
        <div className={styles.aiAvatar}>
          <div className={styles.aiIcon}>🤖</div>
        </div>
      </div>

      {/* QA Mode Indicator */}
      <div className={styles.qaIndicator}>
        <span>QA Mode: {localStorage.getItem('isViewQA') === 'true' ? 'ON' : 'OFF'}</span>
        {localStorage.getItem('isViewQA') === 'true' && (
          <button 
            onClick={() => {
              localStorage.setItem('isViewQA', 'false');
              window.location.reload();
            }}
            className={styles.disableQAButton}
          >
            Disable QA Mode
          </button>
        )}
      </div>

      {/* Debug Info */}
      <div style={{ background: '#333', padding: '1rem', marginBottom: '1rem', borderRadius: '8px' }}>
        <p style={{ color: '#fff', margin: 0 }}>Debug Info:</p>
        <p style={{ color: '#ccc', margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>
          User UID: {user?.uid || 'None'}<br/>
          Loading Gigs: {loadingGigs ? 'Yes' : 'No'}<br/>
          Gigs Count: {gigs.length}<br/>
          Suggestion: {suggestion ? 'Present' : 'None'}
        </p>
        <button 
          onClick={() => {
            console.log('Manual gig fetch triggered');
            if (user?.uid) {
              getWorkerOffers(user.uid).then(result => {
                console.log('Manual fetch result:', result);
                if (result.success && result.data) {
                  const allGigs = [...result.data.offers, ...result.data.acceptedGigs];
                  setGigs(allGigs.slice(0, 3));
                }
              });
            }
          }}
          style={{ 
            background: '#60a5fa', 
            color: '#fff', 
            border: 'none', 
            padding: '0.5rem 1rem', 
            borderRadius: '6px', 
            cursor: 'pointer',
            marginTop: '0.5rem'
          }}
        >
          Test Fetch Gigs
        </button>
      </div>

      {/* Available Gigs Section */}
      <div className={styles.gigsSection}>
        <h2 className={styles.gigsSectionTitle}>Available Gigs:</h2>
        {loadingGigs ? (
          <div className={styles.gigsLoading}>Loading gigs...</div>
        ) : gigs.length > 0 ? (
          <div className={styles.gigsGrid}>
            {gigs.map((gig) => (
              <div 
                key={gig.id} 
                className={styles.gigCard}
                onClick={() => handleGigClick(gig)}
              >
                <div className={styles.gigHeader}>
                  <h3 className={styles.gigTitle}>{gig.role}</h3>
                  <span className={styles.gigStatus}>{gig.status}</span>
                </div>
                <div className={styles.gigDetails}>
                  <div className={styles.gigDetail}>
                    <MapPin size={14} />
                    <span>{gig.locationSnippet}</span>
                  </div>
                  <div className={styles.gigDetail}>
                    <DollarSign size={14} />
                    <span>£{gig.hourlyRate}/hour</span>
                  </div>
                  <div className={styles.gigDetail}>
                    <Calendar size={14} />
                    <span>{gig.dateString}</span>
                  </div>
                </div>
                {gig.gigDescription && (
                  <p className={styles.gigDescription}>{gig.gigDescription}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.noGigs}>
            No gigs available at the moment
            <br />
            <small style={{ color: '#888' }}>
              (This means either no gigs in database or fetch failed)
            </small>
          </div>
        )}
      </div>

      {/* Feedback Section */}
      <div className={styles.feedbackSection}>
        <p className={styles.feedbackText}>Was this helpful?</p>
        <div className={styles.feedbackButtons}>
          <button className={styles.helpfulButton}>Helpful</button>
          <button className={styles.notHelpfulButton}>Not helpful</button>
        </div>
      </div>

      {/* Chat Input */}
      <div className={styles.chatInput}>
        <div className={styles.userAvatar}>
          <span>N</span>
        </div>
        <input 
          type="text" 
          placeholder="Type your message..." 
          className={styles.messageInput}
        />
        <button className={styles.sendButton}>
          <Eye size={16} />
        </button>
      </div>

      {/* Gig Detail Modal */}
      {isModalOpen && selectedGig && (
        <div className={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>{selectedGig.role}</h3>
              <button 
                className={styles.closeButton}
                onClick={() => setIsModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.modalGigDetails}>
                <div className={styles.modalGigDetail}>
                  <MapPin size={16} />
                  <span>{selectedGig.locationSnippet}</span>
                </div>
                <div className={styles.modalGigDetail}>
                  <Calendar size={16} />
                  <span>{selectedGig.dateString}</span>
                </div>
                <div className={styles.modalGigDetail}>
                  <Clock size={16} />
                  <span>{selectedGig.timeString}</span>
                </div>
                <div className={styles.modalGigDetail}>
                  <DollarSign size={16} />
                  <span>£{selectedGig.hourlyRate}/hr</span>
                </div>
                {selectedGig.estimatedHours && (
                  <div className={styles.modalGigDetail}>
                    <span>Total: £{selectedGig.totalPay} ({selectedGig.estimatedHours}h)</span>
                  </div>
                )}
              </div>
              {selectedGig.gigDescription && (
                <div className={styles.modalDescription}>
                  <h4>Description</h4>
                  <p>{selectedGig.gigDescription}</p>
                </div>
              )}
              {selectedGig.notesForWorker && (
                <div className={styles.modalNotes}>
                  <h4>Notes for Worker</h4>
                  <p>{selectedGig.notesForWorker}</p>
                </div>
              )}
            </div>
            <div className={styles.modalFooter}>
              <button 
                className={styles.goToOffersButton}
                onClick={handleGoToGigOffers}
              >
                Go to Gig Offers
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIChatView; 