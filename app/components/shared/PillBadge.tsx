import React from 'react';
import styles from './PillBadge.module.css';

interface PillBadgeProps {
  text: string;
  variant?: 'dark' | 'neutral' | 'light';
  className?: string;
}

const PillBadge: React.FC<PillBadgeProps> = ({ text, variant = 'neutral', className = '' }) => {
  return (
    <span className={`${styles.badge} ${styles[variant]} ${className}`}>
      {text}
    </span>
  );
};

export default PillBadge; 