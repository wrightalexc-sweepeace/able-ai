import React from 'react';
import styles from './MessageBubble.module.css';

interface ReferenceMessageBubbleProps {
  content: string;
}

const ReferenceMessageBubble: React.FC<ReferenceMessageBubbleProps> = ({ content }) => {
  // debug logs removed
  
  // Function to make URLs clickable with copy/share functionality
  const makeUrlsClickable = (text: string) => {
  // debug log removed
    
    // URL regex that handles localhost and various URL formats
    const urlRegex = /(https?:\/\/[^\s\n]+)/g;
    
    // If no URLs found, return the original text
    if (!text.match(urlRegex)) {
  // debug log removed
      return text;
    }
    
  // debug log removed
    const parts = text.split(urlRegex);
    
    return parts.map((part, index) => {
      if (urlRegex.test(part)) {
  // debug log removed
        return (
          <div key={index} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', margin: '4px 0' }}>
            <a
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: '#41a1e8',
                textDecoration: 'underline',
                wordBreak: 'break-all'
              }}
            >
              {part}
            </a>
            <button
              onClick={() => {
                navigator.clipboard.writeText(part);
                alert('Link copied to clipboard!');
              }}
              style={{
                background: 'transparent',
                border: '1px solid #41a1e8',
                borderRadius: '4px',
                padding: '2px 6px',
                color: '#41a1e8',
                fontSize: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = '#41a1e8';
                e.currentTarget.style.color = 'white';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#41a1e8';
              }}
              title="Copy link"
            >
              Copy
            </button>
            {navigator.share && (
              <button
                onClick={() => {
                  navigator.share({
                    title: 'Worker Reference Link',
                    text: 'Please use this link to provide a reference:',
                    url: part
                  });
                }}
                style={{
                  background: 'transparent',
                  border: '1px solid #10b981',
                  borderRadius: '4px',
                  padding: '2px 6px',
                  color: '#10b981',
                  fontSize: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = '#10b981';
                  e.currentTarget.style.color = 'white';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#10b981';
                }}
                title="Share link"
              >
                  Share
                </button>
            )}
          </div>
        );
      }
      return part;
    });
  };

  return (
    <div className={`${styles.messageWrapper} ${styles.alignBot}`} data-role="GIG_WORKER">
      {/* No avatar for reference messages */}
      <div className={`${styles.bubble} ${styles.bubbleBot}`} style={{ border: '3px solid red', background: 'yellow' }}>
        <div style={{ color: 'red', fontWeight: 'bold', marginBottom: '8px' }}>🎯 REFERENCE MESSAGE BUBBLE ACTIVE! 🎯</div>
        {makeUrlsClickable(content)}
      </div>
    </div>
  );
};

export default ReferenceMessageBubble;
