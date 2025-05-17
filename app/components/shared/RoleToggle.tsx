// app/components/shared/RoleToggle.tsx
"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/app/hooks/useAppContext';
import styles from './RoleToggle.module.css';
import { Users, Briefcase } from 'lucide-react';
import { useFirebaseAuth } from '@/app/hooks/useFirebaseAuth';

const RoleToggle: React.FC<{ lastViewVisited?: string }> = ({ lastViewVisited }) => {
    const router = useRouter();
    const { user, loading: loadingFirebaseAuth, idToken } = useFirebaseAuth();
    const { updateUserContext, isLoading: loadingAuth, isBuyerMode, isWorkerMode, canBeBuyer, canBeGigWorker } = useAppContext();
    const currentActiveRole = isBuyerMode ? 'BUYER' : isWorkerMode ? 'GIG_WORKER' : 'UNKNOWN';

    const handleToggle = async (newRole: 'BUYER' | 'GIG_WORKER') => {
        if (newRole === currentActiveRole || !updateUserContext) return;

        try {
            // Assuming setCurrentActiveRole updates the context and potentially the backend
            await updateUserContext({ lastRoleUsed: newRole, lastViewVisited: lastViewVisited ?? 'home' }, idToken);
            // Save to localStorage for immediate client-side persistence
            if (typeof window !== 'undefined') {
                localStorage.setItem('currentActiveRole', newRole);
            }
            // Redirect based on the new role
            if (newRole === 'BUYER') {
                router.push('buyer'); // Or just router.refresh() if already in /buyer
            } else {
                router.push('worker'); // Or just router.refresh() if already in /worker
            }
        } catch (error) {
            console.error("Failed to switch role:", error);
            // Optionally show an error to the user
        }
    };

    //   // Only show toggle if user can be both
    //   if (!canBeBuyer || !canBeGigWorker) {
    //     return null;
    //   }

    return (
        <div className={styles.toggleContainer}>
            <button
                onClick={() => handleToggle('BUYER')}
                className={`${styles.toggleButton} ${currentActiveRole === 'BUYER' ? styles.active : styles.inactive}`}
                aria-pressed={currentActiveRole === 'BUYER'}
            >
                <Users size={16} />
                <span>Buyer</span>
            </button>
            <button
                onClick={() => handleToggle('GIG_WORKER')}
                className={`${styles.toggleButton} ${currentActiveRole === 'GIG_WORKER' ? styles.active : styles.inactive}`}
                aria-pressed={currentActiveRole === 'GIG_WORKER'}
            >
                <Briefcase size={16} />
                <span>Worker</span>
            </button>
        </div>
    );
};
export default RoleToggle;