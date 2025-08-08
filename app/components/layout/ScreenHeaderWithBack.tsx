import React from 'react';
import { ArrowLeft } from 'lucide-react';
import styles from './ScreenHeaderWithBack.module.css';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import Logo from '../brand/Logo';
import { usePathname } from 'next/navigation';
import Image from 'next/image';



interface ScreenHeaderWithBackProps {
  title?: string;
  onBackClick: () => void;
}

const ScreenHeaderWithBack: React.FC<ScreenHeaderWithBackProps> = ({ title, onBackClick }) => {
  const { user } = useAuth();
  const route = usePathname();
  const isHomePage = route === `/user/${user?.uid}/buyer` || route === `/user/${user?.uid}/worker`;
  const isChatPage = route.includes('/able-ai');

  return (
    <header className={styles.header}>
      {!isHomePage && (
        <button onClick={onBackClick} className={styles.backButton} aria-label="Go back">
          <ArrowLeft size={20}/>
        </button>
      )}
      {title && <h1 className={styles.title}>{title}</h1>}
      <Link href={`/users/${user?.uid}/able-ai`} className={styles.chat}>
          {!isChatPage && <span>Chat with Able</span>} <Logo width={50} height={50} />  
      </Link>
    {/* <button
                className={styles.notificationButton}
                aria-label="Notifications"
              >
                <Image
                  src="/images/notifications.svg"
                  alt="Notifications"
                  width={40}
                  height={40}
                />
              </button> */}
    
    </header>
  );
};
export default ScreenHeaderWithBack; 