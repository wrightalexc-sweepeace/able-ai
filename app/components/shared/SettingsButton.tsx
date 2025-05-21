// app/components/shared/SettingsButton.tsx
"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import styles from './SettingsButton.module.css';
// import { Settings } from 'lucide-react';
import Settings from '@mui/icons-material/Settings';

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
      <Settings sx={{color: "#fff"}} fontSize='large'/>
    </button>
  );
};
export default SettingsButton;