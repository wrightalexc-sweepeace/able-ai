import React, { ReactNode } from 'react';
import styles from './ChatBotLayout.module.css';

interface ChatBotLayoutProps {
  children: ReactNode;
  onScroll?: (event: React.UIEvent<HTMLDivElement>) => void;
  tag?: string; // Added tag prop
}

const ChatBotLayout = React.forwardRef<HTMLDivElement, ChatBotLayoutProps>(
  ({ children, onScroll, tag }, ref) => { // Added tag to destructuring
    return (
      <div className={styles.chatContainerWrapper}> {/* Outer wrapper for background */}
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