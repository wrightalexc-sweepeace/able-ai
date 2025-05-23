// app/components/shared/ReferralBanner.tsx
import React, { useState } from 'react';
import styles from './ReferralBanner.module.css';
import { Gift } from 'lucide-react'; // Example icon

interface ReferralBannerProps {
  title?: string;
  description?: string;
  buttonText?: string;
  onButtonClick?: () => void;
}

const ReferralBanner: React.FC<ReferralBannerProps> = ({ title }) => {
  const [tooltipText, setTooltipText] = useState("Click to copy");

  const handleReferralClick = () => {
    // copy the referal link when clicked
    navigator.clipboard.writeText("Referrral link copied to clipboard");
      setTooltipText("Copied!");
      setTimeout(() => setTooltipText("Click to copy"), 2000);
      console.log("Referral link copied to clipboard");
      // alert('Referral link copied to clipboard!');
  };

  return (
    <button className={`${styles.banner} ${styles.button}`} onClick={handleReferralClick}>
      <div className={styles.iconWrapper}>
        <Gift size={24} />
      </div>
      <div className={styles.textWrapper}>
        <h4 className={styles.title}>{title || "Refer a Business"}</h4>
        {/* <p className={styles.description}>{description || "And earn £20 when they make their first hire!"}</p> */}
      </div>
       <span className={styles.tooltip}>
          {tooltipText}
        </span>
      {/* {onButtonClick && buttonText && (
        <button onClick={onButtonClick} className={styles.button}>
          {buttonText}
        </button>
      )} */}
    </button>
  );
};
export default ReferralBanner;