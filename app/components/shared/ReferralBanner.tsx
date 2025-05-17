// app/components/shared/ReferralBanner.tsx
import React from 'react';
import styles from './ReferralBanner.module.css';
import { Gift } from 'lucide-react'; // Example icon

interface ReferralBannerProps {
  title?: string;
  description?: string;
  buttonText?: string;
  onButtonClick?: () => void;
}

const ReferralBanner: React.FC<ReferralBannerProps> = ({ title, description, buttonText, onButtonClick }) => {
  return (
    <div className={styles.banner}>
      <div className={styles.iconWrapper}>
        <Gift size={24} />
      </div>
      <div className={styles.textWrapper}>
        <h4 className={styles.title}>{title || "Refer a Business"}</h4>
        <p className={styles.description}>{description || "And earn £20 when they make their first hire!"}</p>
      </div>
      {onButtonClick && buttonText && (
        <button onClick={onButtonClick} className={styles.button}>
          {buttonText}
        </button>
      )}
    </div>
  );
};
export default ReferralBanner;