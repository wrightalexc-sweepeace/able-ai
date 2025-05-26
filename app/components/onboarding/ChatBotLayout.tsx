import React, { ReactNode } from 'react';
import styles from './ChatBotLayout.module.css';
import Logo from '../brand/Logo';
// import InputBubble from './InputBubble';
import TextAreaBubble from './TextAreaBubble';
import Image from 'next/image';

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
        {/* {tag && <div className={styles.chatTag}>{tag}</div>} Render the tag */}
        <div className={styles.chatContainer} onScroll={onScroll} ref={ref}>
          <div className={styles.header}>
            <span className={styles.headerText}>Chat with me, Able</span>
            <Logo width={65} height={65} />
          </div>
          <div className={styles.chatContent}>{children}</div>
          {/* <InputBubble placeholder='Chat with Able here ...'/> */}
          <div className={styles.footer}>
            <TextAreaBubble placeholder='Chat with Able here ...'/>
            <Image src='/images/home.svg' width={40} height={40} alt='home' style={{margin: 'auto'}} />
          </div>
        </div>
      </div>
    );
  }
);

ChatBotLayout.displayName = 'ChatBotLayout';
export default ChatBotLayout;