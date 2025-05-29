import React from 'react';
import styles from './AwardDisplayBadge.module.css';

interface AwardDisplayBadgeProps {
  icon: React.ElementType;
  textLines: string[];
}

const AwardDisplayBadge: React.FC<AwardDisplayBadgeProps> = ({ icon: Icon, textLines }) => {
  return (
    <div className={styles.awardBadge}>
      <Icon size={28} className={styles.awardIcon} color= '#eab308' strokeWidth = '3' />
      <div className={styles.awardTextContainer}>
        {textLines.map((line, index) => (
          <span key={index} className={styles.awardTextLine}>
            {line}
          </span>
        ))}
      </div>
    </div>
  );
};

export default AwardDisplayBadge; 