import styles from './GigActionButton.module.css';
import { useUser } from '@/app/context/UserContext';

interface ActionButtonProps {
    label: string;
    handleGigAction: () => void;
    isActive?: boolean;
    isDisabled?: boolean;
}

const GigActionButton = ({ label, handleGigAction, isActive, isDisabled }: ActionButtonProps) => {
  const {user} = useUser();
  return (
    <button 
      type="button"
      className={`${styles.actionButton} ${isActive ? (user?.isWorkerMode ? styles.activeWorker : styles.activeBuyer) : ''}`}
      onClick={handleGigAction}
      disabled={isDisabled}
    >
      { label }
    </button>
  );
};

export default GigActionButton;
