"use client";
import React, { useEffect } from 'react';
import { X, MapPin, CalendarDays, Clock, DollarSign, User, FileText, AlertTriangle } from 'lucide-react';
import styles from './GigDetailsModal.module.css';
import { WorkerGigOffer } from '@/actions/gigs/get-worker-offers';

interface GigDetailsModalProps {
  gig: WorkerGigOffer | null;
  isOpen: boolean;
  onClose: () => void;
  onAccept?: (gigId: string) => void;
  onDecline?: (gigId: string) => void;
  isProcessingAccept?: boolean;
  isProcessingDecline?: boolean;
}

const GigDetailsModal: React.FC<GigDetailsModalProps> = ({
  gig,
  isOpen,
  onClose,
  onAccept,
  onDecline,
  isProcessingAccept = false,
  isProcessingDecline = false,
}) => {
  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !gig) return null;

  const totalPayDisplay = gig.totalPay
    ? `£${gig.totalPay.toFixed(2)} + tips`
    : gig.estimatedHours
      ? `Est. £${(gig.hourlyRate * gig.estimatedHours).toFixed(2)} + tips`
      : `£${gig.hourlyRate.toFixed(2)}/hr + tips`;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        {/* Close button */}
        <button className={styles.closeButton} onClick={onClose}>
          <X size={24} />
        </button>

        {/* Modal header */}
        <div className={styles.modalHeader}>
          <h2 className={styles.gigTitle}>{gig.role}</h2>
          <div className={styles.statusBadge}>
            <span className={styles.statusText}>{gig.status}</span>
          </div>
        </div>

        {/* Gig details */}
        <div className={styles.gigDetails}>
          <div className={styles.detailRow}>
            <MapPin size={20} className={styles.detailIcon} />
            <div className={styles.detailContent}>
              <span className={styles.detailLabel}>Location</span>
              <span className={styles.detailValue}>{gig.locationSnippet}</span>
            </div>
          </div>

          <div className={styles.detailRow}>
            <CalendarDays size={20} className={styles.detailIcon} />
            <div className={styles.detailContent}>
              <span className={styles.detailLabel}>Date</span>
              <span className={styles.detailValue}>{gig.dateString}</span>
            </div>
          </div>

          <div className={styles.detailRow}>
            <Clock size={20} className={styles.detailIcon} />
            <div className={styles.detailContent}>
              <span className={styles.detailLabel}>Time</span>
              <span className={styles.detailValue}>{gig.timeString}</span>
            </div>
          </div>

          <div className={styles.detailRow}>
            <DollarSign size={20} className={styles.detailIcon} />
            <div className={styles.detailContent}>
              <span className={styles.detailLabel}>Payment</span>
              <span className={styles.detailValue}>{totalPayDisplay}</span>
            </div>
          </div>

          {gig.estimatedHours && (
            <div className={styles.detailRow}>
              <Clock size={20} className={styles.detailIcon} />
              <div className={styles.detailContent}>
                <span className={styles.detailLabel}>Duration</span>
                <span className={styles.detailValue}>{gig.estimatedHours} hours</span>
              </div>
            </div>
          )}

          {gig.buyerName && (
            <div className={styles.detailRow}>
              <User size={20} className={styles.detailIcon} />
              <div className={styles.detailContent}>
                <span className={styles.detailLabel}>Posted by</span>
                <span className={styles.detailValue}>{gig.buyerName}</span>
              </div>
            </div>
          )}
        </div>

        {/* Gig description */}
        {gig.gigDescription && (
          <div className={styles.descriptionSection}>
            <div className={styles.sectionHeader}>
              <FileText size={20} className={styles.sectionIcon} />
              <h3 className={styles.sectionTitle}>Description</h3>
            </div>
            <p className={styles.descriptionText}>{gig.gigDescription}</p>
          </div>
        )}

        {/* Notes for worker */}
        {gig.notesForWorker && (
          <div className={styles.notesSection}>
            <div className={styles.sectionHeader}>
              <AlertTriangle size={20} className={styles.sectionIcon} />
              <h3 className={styles.sectionTitle}>Notes for Worker</h3>
            </div>
            <p className={styles.notesText}>{gig.notesForWorker}</p>
          </div>
        )}

        {/* Action buttons */}
        {onAccept && onDecline && (
          <div className={styles.actionButtons}>
            <button
              className={`${styles.actionButton} ${styles.acceptButton}`}
              onClick={() => onAccept(gig.id)}
              disabled={isProcessingAccept || isProcessingDecline}
            >
              {isProcessingAccept ? 'Accepting...' : 'Accept Offer'}
            </button>
            <button
              className={`${styles.actionButton} ${styles.declineButton}`}
              onClick={() => onDecline(gig.id)}
              disabled={isProcessingAccept || isProcessingDecline}
            >
              {isProcessingDecline ? 'Declining...' : 'Decline'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GigDetailsModal;
