// app/components/shared/RoleToggle.tsx
"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/app/hooks/useAppContext';
import styles from './RoleToggle.module.css';

const RoleToggle: React.FC<{ lastViewVisited?: string }> = ({ lastViewVisited }) => {
    const router = useRouter();
    const { updateUserContext, user } = useAppContext();
    const currentActiveRole = user?.isBuyerMode ? 'BUYER' : user?.isWorkerMode ? 'GIG_WORKER' : 'QA';

    const handleToggle = async (newRole: 'BUYER' | 'GIG_WORKER') => {
        if (newRole === currentActiveRole && !lastViewVisited) return;

        try {
            const newAppRole = newRole === 'BUYER' ? 'worker' : 'buyer';
            // Assuming setCurrentActiveRole updates the context and potentially the backend
            await updateUserContext({ lastRoleUsed: newRole, lastViewVisited: lastViewVisited ?? newAppRole });
            // Save to localStorage for immediate client-side persistence
            if (typeof window !== 'undefined') {
                localStorage.setItem('currentActiveRole', newRole);
            }
            // Redirect based on the new role
            router.push(newAppRole);
        } catch (error) {
            console.error("Failed to switch role:", error);
            // Optionally show an error to the user
        }
    };

    return (
        <div className={styles.toggleContainer}>
            <label className={styles.switchLabel}>
            <span>Switch to {currentActiveRole === 'BUYER' ? 'seller' : 'buyer'}</span>
            <input
                type="checkbox"
                onChange={() =>
                handleToggle(currentActiveRole === 'BUYER' ? 'GIG_WORKER' : 'BUYER')
                }
                className={styles.switchInput}
            />
            <span className={styles.switchSlider}></span>
            </label>
            
        </div>
    );
};
export default RoleToggle;