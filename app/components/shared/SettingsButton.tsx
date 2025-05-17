// app/components/shared/SettingsButton.tsx
"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import styles from './SettingsButton.module.css';
import { Settings } from 'lucide-react';

const SettingsButton: React.FC = () => {
  const router = useRouter();
  const handleClick = () => {
    router.push('settings'); // Navigate to a general settings page
  };

  return (
    <button
      onClick={handleClick}
      className={styles.settingsButton}
      aria-label="Settings"
    >
      <Settings size={20} />
    </button>
  );
};
export default SettingsButton;