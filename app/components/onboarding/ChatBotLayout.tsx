import React, { ReactNode } from 'react';
import styles from './ChatBotLayout.module.css';

interface ChatBotLayoutProps {
  children: ReactNode;
  onScroll?: (event: React.UIEvent<HTMLDivElement>) => void;
  tag?: string; // Added tag prop
  className?: string; // Add className prop
}

const ChatBotLayout = React.forwardRef<HTMLDivElement, ChatBotLayoutProps>(
  ({ children, onScroll, tag, className }, ref) => { // Destructure className
    return (
      <div className={`${styles.chatContainerWrapper} ${className}`}> {/* Apply className */}
        {tag && <div className={styles.chatTag}>{tag}</div>} {/* Render the tag */}
        <div className={styles.chatContainer} onScroll={onScroll} ref={ref}>
          <div className={styles.chatContent}>{children}</div>
        </div>
      </div>
    );
  }
);

ChatBotLayout.displayName = 'ChatBotLayout';
export default ChatBotLayout;