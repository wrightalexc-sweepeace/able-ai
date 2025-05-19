"use client";

import React, { useState } from 'react';
import { Bot, Edit3 } from 'lucide-react'; // Icons: Bot for friendly face, Edit3 for pencil
import styles from './CancelOrAmendGigDetailsPage.module.css';
import { useAppContext } from '@/app/hooks/useAppContext'; // Import the hook

// Mock data - replace with actual props or state
const gigDetailsData = {
  location: 'The Green Tavern, Main Street, Springfield',
  date: 'Saturday, 12th November 2023',
  time: '6:00 PM - 1:00 AM',
  payPerHour: '20',
  totalPay: '140',
  summary: 'Add one more hour. Total gig value is now 140, with Able and payment provider fees of 14.',
};

export default function CancelOrAmendGigDetailsPage() {
  const [userMessage, setUserMessage] = useState('');
  const [isEditingDetails, setIsEditingDetails] = useState(false); // Add state for edit mode
  const [editedGigDetails, setEditedGigDetails] = useState(gigDetailsData); // State for edited details
  const { isBuyerMode, isWorkerMode } = useAppContext(); // Use the hook

  const handleEditDetails = () => {
    // Logic for editing gig details - perhaps opens a modal or navigates
    console.log("Edit details clicked");
    setIsEditingDetails(!isEditingDetails); // Toggle edit mode
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditedGigDetails(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = () => {
    // Logic for submitting the amendment/cancellation request
    console.log("Submit for Confirmation clicked. Message:", userMessage);
    console.log("Edited Gig Details:", editedGigDetails);
    // TODO: Call API to submit amendment request
  };

  return (
    <div className={styles.viewContainer}>
      <header className={styles.header}>
        <h1 className={styles.headerTitle}>Cancel or Amend Gig Details</h1>
        <hr className={styles.headerSeparator} />
      </header>

      <main>
        {/* Instruction Block */}
        <section className={`${styles.card} ${styles.instructionBlock}`}>
          <div className={styles.instructionIconContainer}>
            <Bot className={styles.instructionIcon} strokeWidth={1.5} />
          </div>
          <p className={styles.instructionText}>
            What changes would you like to make to the gig?{' '}
            <strong>Tell me or edit using the icon below</strong>
          </p>
        </section>

        {/* Text Input Block */}
        <section className={styles.card}>
          <label htmlFor="benjiMessage" className={styles.textInputBlockLabel}>
            Benji:
          </label>
          <textarea
            id="benjiMessage"
            name="benjiMessage"
            className={styles.textareaInput}
            value={userMessage}
            onChange={(e) => setUserMessage(e.target.value)}
            placeholder="e.g., Add one more hour to the gig or pay 22ph"
            rows={4}
          />
        </section>

        {/* Updated Gig Details Block */}
        <section className={styles.card}>
          <div className={styles.detailsHeader}>
            <h2 className={styles.detailsTitle}>Updated gig details:</h2>
            <Edit3 className={styles.editIcon} onClick={handleEditDetails} />
          </div>
          {
            isEditingDetails ? (
              /* Editable Form View */
              <div className={styles.detailsList}>
                <div className={styles.detailItem}>
                  <span className={styles.detailItemLabel}>Location:</span>
                  <input
                    type="text"
                    name="location"
                    value={editedGigDetails.location}
                    onChange={handleInputChange}
                    className={styles.textareaInput} // Reuse input style
                    disabled={isWorkerMode} // Disable for workers
                  />
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailItemLabel}>Date:</span>
                   <input
                    type="text"
                    name="date"
                    value={editedGigDetails.date}
                    onChange={handleInputChange}
                    className={styles.textareaInput} // Reuse input style
                     disabled={isWorkerMode} // Disable for workers
                  />
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailItemLabel}>Time:</span>
                   <input
                    type="text"
                    name="time"
                    value={editedGigDetails.time}
                    onChange={handleInputChange}
                    className={styles.textareaInput} // Reuse input style
                  />
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailItemLabel}>Pay per hour:</span>
                   <input
                    type="text"
                    name="payPerHour"
                    value={editedGigDetails.payPerHour}
                    onChange={handleInputChange}
                    className={styles.textareaInput} // Reuse input style
                     disabled={isWorkerMode} // Disable for workers
                  />
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailItemLabel}>Total Pay:</span>
                  <input
                    type="text"
                    name="totalPay"
                    value={editedGigDetails.totalPay}
                    onChange={handleInputChange}
                    className={styles.textareaInput} // Reuse input style
                     disabled={true} // Total pay likely calculated
                  />
                </div>
                 {/* Summary might be recalculated or hidden in edit mode */}
                 {/* <p className={styles.detailsSummaryText}>{editedGigDetails.summary}</p> */}
              </div>
            ) : (
              /* Read-only View */
              <div className={styles.detailsList}>
                <div className={styles.detailItem}>
                  <span className={styles.detailItemLabel}>Location:</span>
                  <span className={styles.detailItemValue}>{gigDetailsData.location}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailItemLabel}>Date:</span>
                  <span className={styles.detailItemValue}>{gigDetailsData.date}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailItemLabel}>Time:</span>
                  <span className={styles.detailItemValue}>{gigDetailsData.time}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailItemLabel}>Pay per hour:</span>
                  <span className={styles.detailItemValue}>{gigDetailsData.payPerHour}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailItemLabel}>Total Pay:</span>
                  <span className={styles.detailItemValue}>{gigDetailsData.totalPay}</span>
                </div>
              </div>
            )
          }
           {/* Always show summary in read-only mode, maybe hide in edit mode */}
           {!isEditingDetails && <p className={styles.detailsSummaryText}>{gigDetailsData.summary}</p>}
        </section>
      </main>

      {/* Action Button Area */}
      <button type="button" className={styles.submitButton} onClick={handleSubmit}>
        Submit for Confirmation
      </button>
    </div>
  );
} 