import styles from './GigActionButton.module.css';

interface ActionButtonProps {
    label: string;
    handleGigAction: () => void;
    isActive?: boolean;
    isDisabled?: boolean;
}

const GigActionButton = ({ label, handleGigAction, isActive, isDisabled }: ActionButtonProps) => {
  return (
    <button 
      type="button"
      className={`${styles.actionButton} ${isActive ? styles.active : ''}`}
      onClick={handleGigAction}
      disabled={isDisabled}
    >
      { label }
    </button>
  );
};

export default GigActionButton
