import React from 'react';
import styles from './StripeLinkBubble.module.css';

interface StripeLinkBubbleProps {
    id?: string;
    name?: string;
    label?: string;
    stripeLink?: string;
    disabled?: boolean;
}

const StripeLinkBubble: React.FC<StripeLinkBubbleProps> = ({ id, name, label, stripeLink, disabled }) => {
    // This is a mock implementation. Replace with a real Stripe onboarding link later.
    return (
        <div className={styles.stripeLinkBubbleWrapper}>
            {label && <label htmlFor={id || name} className={styles.label}>{label}</label>}
            <div className={styles.stripeLinkPlaceholder}>
                <p>[Stripe Onboarding Link Placeholder]</p>
                {stripeLink ? (
                    <a href={stripeLink} target="_blank" rel="noopener noreferrer" className={disabled ? styles.disabledLink : ""}>
                        Connect to Stripe
                    </a>
                ) : (
                    <p>No Stripe link available.</p>
                )}
            </div>
        </div>
    );
};

export default StripeLinkBubble;