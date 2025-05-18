import React from 'react';
import styles from '../legal.module.css';

export default function PrivacyPage() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Privacy Policy</h1>

      <div className={styles.content}>
        <p>Able AI is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and share your personal information.</p>
        <p>We collect information such as your name, email address, and payment information when you create an account and use our services.</p>
        <p>We use this information to provide you with our services, process payments, and communicate with you.</p>
        {/* Add more privacy policy content here */}
      </div>
    </div>
  );
} 