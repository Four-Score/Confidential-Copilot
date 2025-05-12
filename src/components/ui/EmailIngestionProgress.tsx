import React from 'react';

interface EmailIngestionProgressProps {
  queueLength: number;
  processedCount: number;
  isProcessing: boolean;
}

const EmailIngestionProgress: React.FC<EmailIngestionProgressProps> = ({
  queueLength,
  processedCount,
  isProcessing
}) => {
  if (queueLength === 0) return null;

  const percent = Math.round((processedCount / queueLength) * 100);

  return (
    <div style={{
      background: '#f0f4ff',
      border: '1px solid #ccc',
      padding: '12px 16px',
      marginBottom: '20px',
      borderRadius: '8px'
    }}>
      <p style={{ margin: 0 }}>
        Processing {processedCount} of {queueLength} queued email{queueLength !== 1 ? 's' : ''}...
      </p>
      <div style={{
        marginTop: 8,
        height: 8,
        background: '#d9e4ff',
        borderRadius: 4,
        overflow: 'hidden'
      }}>
        <div style={{
          height: '100%',
          width: `${percent}%`,
          background: '#3b82f6',
          transition: 'width 0.4s ease'
        }} />
      </div>
      {isProcessing && <p style={{ fontSize: '12px', color: '#666' }}>Encrypting & uploading...</p>}
    </div>
  );
};

export default EmailIngestionProgress;
