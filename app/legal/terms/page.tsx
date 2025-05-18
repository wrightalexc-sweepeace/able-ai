import React from 'react';
import styles from '../legal.module.css';

export default function TermsPage() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Terms of Agreement</h1>

      <div className={styles.content}>
        <p>By purchasing the time of this gig worker, you agree to adhere to Able AI's terms and conditions.</p>
        <p>Your payment is secure and processed by Stripe at the end of the gig, when both parties mark the gig is complete.</p>

        <p>Please adhere to Able values:</p>
        <ul className={styles.list}>
          <li className={styles.listItem}>Be good</li>
          <li className={styles.listItem}>Be fair</li>
          <li className={styles.listItem}>Be kind</li>
        </ul>
      </div>
    </div>
  );
} 