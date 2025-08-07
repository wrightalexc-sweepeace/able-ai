"use client";

import React from 'react';
import styles from './EventDetailModal.module.css';
import { X, Clock, User, Calendar, MapPin, CheckCircle, AlertCircle, PlayCircle, CheckSquare, XCircle } from 'lucide-react';
import { CalendarEvent } from '@/app/types/CalendarEventTypes';
import { useRouter } from 'next/navigation';

interface EventDetailModalProps {
  event: CalendarEvent | null;
  isOpen: boolean;
  onClose: () => void;
  userRole: 'worker' | 'buyer';
}

const EventDetailModal: React.FC<EventDetailModalProps> = ({
  event,
  isOpen,
  onClose,
  userRole
}) => {
  const router = useRouter();

  if (!isOpen || !event) return null;

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (startDate: Date, endDate: Date) => {
    const startTime = startDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    const endTime = endDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    return `${startTime} - ${endTime}`;
  };

  const getStatusColor = (status: string | undefined) => {
    switch (status) {
      case 'ACCEPTED':
        return '#10b981'; // Green
      case 'OFFER':
        return '#6b7280'; // Gray
      case 'IN_PROGRESS':
        return '#f59e0b'; // Amber
      case 'COMPLETED':
        return '#10b981'; // Green
      case 'CANCELLED':
        return '#ef4444'; // Red
      default:
        return '#6b7280'; // Gray
    }
  };

  const getStatusText = (status: string | undefined) => {
    switch (status) {
      case 'ACCEPTED':
        return 'Accepted';
      case 'OFFER':
        return 'Offer';
      case 'IN_PROGRESS':
        return 'In Progress';
      case 'COMPLETED':
        return 'Completed';
      case 'CANCELLED':
        return 'Cancelled';
      default:
        return 'Unknown';
    }
  };

  const handleGoToOffer = () => {
    // Navigate to the offer view
    if (event.id) {
      router.push(`/user/current/${userRole}/gigs/${event.id}`);
    }
    onClose();
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>{event.title}</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.body}>
          <div className={styles.statusSection}>
            <div 
              className={styles.statusBadge}
              style={{ backgroundColor: getStatusColor(event.status) }}
            >
              {getStatusText(event.status)}
            </div>
          </div>

          <div className={styles.details}>
            <div className={styles.detailRow}>
              <Calendar className={styles.icon} size={16} />
              <span className={styles.label}>Date:</span>
              <span className={styles.value}>{formatDate(new Date(event.start))}</span>
            </div>

            <div className={styles.detailRow}>
              <Clock className={styles.icon} size={16} />
              <span className={styles.label}>Time:</span>
              <span className={styles.value}>
                {formatTime(new Date(event.start), new Date(event.end))}
              </span>
            </div>

            {event.location && (
              <div className={styles.detailRow}>
                <MapPin className={styles.icon} size={16} />
                <span className={styles.label}>Location:</span>
                <span className={styles.value}>{event.location}</span>
              </div>
            )}

            {userRole === 'worker' && event.buyerName && (
              <div className={styles.detailRow}>
                <User className={styles.icon} size={16} />
                <span className={styles.label}>Buyer:</span>
                <span className={styles.value}>{event.buyerName}</span>
              </div>
            )}

            {userRole === 'buyer' && event.workerName && (
              <div className={styles.detailRow}>
                <User className={styles.icon} size={16} />
                <span className={styles.label}>Worker:</span>
                <span className={styles.value}>{event.workerName}</span>
              </div>
            )}

            {event.description && (
              <div className={styles.descriptionSection}>
                <span className={styles.label}>Description:</span>
                <p className={styles.description}>{event.description}</p>
              </div>
            )}
          </div>

          {(event.status === 'ACCEPTED' || event.status === 'OFFER') && (
            <div className={styles.actions}>
              <button 
                className={styles.actionButton}
                onClick={handleGoToOffer}
              >
                Go to Offer
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventDetailModal; 