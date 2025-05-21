// app/components/shared/AiSuggestionBanner.tsx
import React from 'react';
import styles from './AiSuggestionBanner.module.css';
import { Lightbulb } from 'lucide-react';

interface AiSuggestionBannerProps {
  title?: string;
  message?: string;
  children?: React.ReactNode;
}

const AiSuggestionBanner: React.FC<AiSuggestionBannerProps> = ({ title, children, message }) => {
  return (
    <div className={styles.suggestionBanner}>
      {/* <Lightbulb size={24} className={styles.suggestionIcon} /> */}
      <div className={styles.suggestionContent}>
        {/* {title && <h4 className={styles.suggestionTitle}>{title}</h4>} */}
        <p className={styles.suggestionText}>{children || message}</p>
      </div>
    </div>
  );
};
export default AiSuggestionBanner;