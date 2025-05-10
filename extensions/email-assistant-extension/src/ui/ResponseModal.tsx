import React from 'react';

interface ResponseModalProps {
  response: string;
  onClose: () => void;
  onRegenerate: () => void;
  loading: boolean;
}

const ResponseModal: React.FC<ResponseModalProps> = ({ response, onClose, onRegenerate, loading }) => {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3 style={{ marginBottom: '1rem' }}>Generated Response</h3>

        <div className="response-box">
          {response
            .split('\n')
            .filter(line => line.trim() !== '')
            .map((line, idx) => (
              <p key={idx}>{line}</p>
            ))}
        </div>

        <div className="modal-actions">
          <button onClick={onClose} className="secondary-button">
            Close
          </button>
          <button onClick={onRegenerate} className="main-button" disabled={loading}>
            {loading ? 'Regenerating...' : 'Regenerate'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResponseModal;
