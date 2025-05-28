import React, { ReactNode } from 'react';
import styles from './ChatBotLayout.module.css';
import Logo from '../brand/Logo';
import TextAreaBubble from './TextAreaBubble';
import Image from 'next/image';

interface ChatBotLayoutProps {
  children: ReactNode;
  onScroll?: (event: React.UIEvent<HTMLDivElement>) => void;
  tag?: string;
  className?: string;
}

const ChatBotLayout = React.forwardRef<HTMLDivElement, ChatBotLayoutProps>(
  ({ children, onScroll, tag, className }, ref) => { // Destructure className
    return (
      <div className={`${styles.chatContainerWrapper} ${className}`}> {/* Apply className */}
        {/* {tag && <div className={styles.chatTag}>{tag}</div>} Render the tag */}
        <div className={styles.chatContainer} onScroll={onScroll} ref={ref}>
          <div className={styles.header}>
            <span className={styles.headerText}>Chat with me, Able</span>
            <Logo width={65} height={65} />
          </div>
          <div className={styles.chatContent}>{children}</div>
          <div className={styles.footer}>
            <TextAreaBubble placeholder='Chat with Able here ...' onKeyPress={(e) => {
              if (e.key === 'Enter') {
                const target = e.target as HTMLInputElement;
                // TODO: Send message to backend
                console.log('Send message to backend:', target.value);
                target.value = '';
              }
            }} />
            <Image src='/images/home.svg' width={40} height={40} alt='home' style={{ margin: 'auto' }} />
          </div>
        </div>
      </div>
    );
  }
);

ChatBotLayout.displayName = 'ChatBotLayout';
export default ChatBotLayout;