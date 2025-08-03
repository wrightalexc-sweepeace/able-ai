import React from 'react';

interface SanitizedConfirmationBubbleProps {
  fieldName: string;
  sanitizedValue: string | unknown;
  originalValue?: string | unknown;
  onConfirm: (fieldName: string, sanitized: string | unknown) => void;
  onReformulate?: (fieldName: string) => void;
  showReformulate?: boolean;
  isProcessing?: boolean;
  role?: 'BUYER' | 'GIG_WORKER';
}

const SanitizedConfirmationBubble: React.FC<SanitizedConfirmationBubbleProps> = ({
  fieldName,
  sanitizedValue,
  originalValue,
  onConfirm,
  onReformulate,
  showReformulate = false,
  isProcessing: externalIsProcessing = false,
  role = 'BUYER' // Default to buyer for safety
}) => {
  const [internalIsProcessing, setInternalIsProcessing] = React.useState(false);
  const isProcessing = externalIsProcessing || internalIsProcessing;

  // Determine colors based on role
  const isBuyer = role === 'BUYER';
  const primaryColor = isBuyer ? 'var(--secondary-color)' : 'var(--primary-color)';
  const primaryDarkerColor = isBuyer ? 'var(--secondary-darker-color)' : 'var(--primary-darker-color)';
  const primaryColorRgba = isBuyer ? 'rgba(126, 238, 249, ' : 'rgba(65, 161, 232, ';
  const primaryDarkerColorRgba = isBuyer ? 'rgba(91, 192, 232, ' : 'rgba(37, 99, 235, ';

  const handleConfirm = () => {
    if (isProcessing) return;
    setInternalIsProcessing(true);
    onConfirm(fieldName, sanitizedValue);
  };

  const handleReformulate = () => {
    if (isProcessing) return;
    setInternalIsProcessing(true);
    onReformulate?.(fieldName);
  };
  return (
    <div style={{ 
      background: '#1a1a1a', 
      borderRadius: 12, 
      padding: 16, 
      margin: '16px 0', 
      boxShadow: `0 4px 20px ${primaryDarkerColorRgba}0.3), 0 0 0 1px ${primaryDarkerColorRgba}0.1)`, 
      border: `2px solid ${primaryDarkerColor}`,
      animation: 'slideInScalePrimary 0.6s ease-out',
      opacity: 0,
      animationFillMode: 'forwards',
      transform: 'scale(0.95)',
      transformOrigin: 'center',
      position: 'relative'
    }}>
      <style>{`
        @keyframes slideInScalePrimary {
          0% {
            opacity: 0;
            transform: scale(0.95) translateY(20px);
            box-shadow: 0 4px 20px ${primaryDarkerColorRgba}0.1), 0 0 0 1px ${primaryDarkerColorRgba}0.05);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.02) translateY(-2px);
            box-shadow: 0 8px 30px ${primaryDarkerColorRgba}0.4), 0 0 0 2px ${primaryDarkerColorRgba}0.2);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
            box-shadow: 0 4px 20px ${primaryDarkerColorRgba}0.3), 0 0 0 1px ${primaryDarkerColorRgba}0.1);
          }
        }
        
        @keyframes primaryPulse {
          0%, 100% {
            box-shadow: 0 4px 20px ${primaryDarkerColorRgba}0.3), 0 0 0 1px ${primaryDarkerColorRgba}0.1);
          }
          50% {
            box-shadow: 0 6px 25px ${primaryDarkerColorRgba}0.5), 0 0 0 2px ${primaryDarkerColorRgba}0.2);
          }
        }
      `}</style>
      <div style={{ 
        marginBottom: 8, 
        color: '#ffffff', 
        fontWeight: 600, 
        fontSize: '14px'
      }}>
        This is what you wanted?
      </div>
             <div style={{ 
         marginBottom: 16, 
         fontStyle: 'italic',
         color: '#e5e5e5', 
         fontSize: '15px', 
         lineHeight: '1.4' 
       }}>
         {(() => {
           if (typeof sanitizedValue === 'object' && sanitizedValue !== null) {
             // Handle coordinate objects
             if ('lat' in sanitizedValue && 'lng' in sanitizedValue) {
               return `Lat: ${(sanitizedValue as { lat: number; lng: number }).lat.toFixed(6)}, Lng: ${(sanitizedValue as { lat: number; lng: number }).lng.toFixed(6)}`;
             }
             return JSON.stringify(sanitizedValue);
           }
           
           const valueStr = String(sanitizedValue || '');
           
           // Check if this is a video URL
           if (typeof sanitizedValue === 'string' && sanitizedValue.startsWith('http') && 
               (sanitizedValue.includes('.webm') || sanitizedValue.includes('.mp4') || sanitizedValue.includes('.mov'))) {
             return (
               <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                 <span style={{ color: '#ffffff', fontWeight: 600 }}>Video uploaded ✓</span>
                 <video 
                   controls 
                   style={{ 
                     maxWidth: '100%', 
                     maxHeight: '200px', 
                     borderRadius: '8px',
                     border: `2px solid ${primaryDarkerColor}`,
                     boxShadow: `0 2px 10px ${primaryDarkerColorRgba}0.2)`
                   }}
                   preload="metadata"
                 >
                   <source src={sanitizedValue} type="video/webm" />
                   <source src={sanitizedValue} type="video/mp4" />
                   Your browser does not support the video tag.
                 </video>
               </div>
             );
           }
           
           return valueStr;
         })()}
       </div>
      <div style={{ display: 'flex', gap: 12 }}>
        <button
          style={{ 
            background: isProcessing ? '#555' : primaryColor, 
            color: '#000', 
            border: 'none', 
            borderRadius: 8, 
            padding: '8px 16px', 
            fontWeight: 600, 
            fontSize: '14px', 
            cursor: isProcessing ? 'not-allowed' : 'pointer', 
            transition: 'all 0.3s ease',
            transform: 'scale(1)',
            opacity: isProcessing ? 0.6 : 1,
            boxShadow: isProcessing ? 'none' : `0 2px 8px ${primaryColorRgba}0.4)`,
            textShadow: '0 0 5px rgba(0, 0, 0, 0.3)'
          }}
          onClick={handleConfirm}
          disabled={isProcessing}
          onMouseOver={(e) => {
            if (!isProcessing) {
              e.currentTarget.style.background = primaryDarkerColor;
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = `0 4px 12px ${primaryColorRgba}0.6)`;
            }
          }}
          onMouseOut={(e) => {
            if (!isProcessing) {
              e.currentTarget.style.background = primaryColor;
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = `0 2px 8px ${primaryColorRgba}0.4)`;
            }
          }}
        >
          {isProcessing ? 'Processing...' : 'Confirm'}
        </button>
        {showReformulate && onReformulate && (
          <button
            style={{ 
              background: isProcessing ? '#555' : 'transparent', 
              color: isProcessing ? '#999' : primaryColor, 
              border: `2px solid ${primaryColor}`, 
              borderRadius: 8, 
              padding: '8px 16px', 
              fontWeight: 600, 
              fontSize: '14px', 
              cursor: isProcessing ? 'not-allowed' : 'pointer', 
              transition: 'all 0.3s ease',
              transform: 'scale(1)',
              opacity: isProcessing ? 0.6 : 1,
              boxShadow: isProcessing ? 'none' : `0 2px 8px ${primaryColorRgba}0.3)`,
              textShadow: isProcessing ? 'none' : `0 0 5px ${primaryColorRgba}0.4)`
            }}
            onClick={handleReformulate}
            disabled={isProcessing}
            onMouseOver={(e) => { 
              if (!isProcessing) {
                e.currentTarget.style.background = primaryColor; 
                e.currentTarget.style.color = '#000'; 
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = `0 4px 12px ${primaryColorRgba}0.5)`;
                e.currentTarget.style.textShadow = '0 0 5px rgba(0, 0, 0, 0.3)';
              }
            }}
            onMouseOut={(e) => { 
              if (!isProcessing) {
                e.currentTarget.style.background = 'transparent'; 
                e.currentTarget.style.color = primaryColor; 
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = `0 2px 8px ${primaryColorRgba}0.3)`;
                e.currentTarget.style.textShadow = `0 0 5px ${primaryColorRgba}0.4)`;
              }
            }}
          >
            {isProcessing ? 'Processing...' : 'Reformulate'}
          </button>
        )}
      </div>
    </div>
  );
};

export default SanitizedConfirmationBubble;