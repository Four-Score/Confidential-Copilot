import React, { useState } from 'react';

interface ProjectNamePopupProps {
  onSubmit: (projectName: string) => Promise<boolean>;
  onClose: () => void;
}

const ProjectNamePopup: React.FC<ProjectNamePopupProps> = ({ onSubmit, onClose }) => {
  const [projectName, setProjectName] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    const trimmedName = projectName.trim();
    if (!trimmedName) {
      setError('Project name cannot be empty.');
      return;
    }

    setSubmitting(true);
    setError('');

    const result = await onSubmit(trimmedName);

    if (!result) {
      setError('❌ Could not find or save project. Try again.');
    } else {
      setSuccess(true);
      setTimeout(onClose, 1200);
    }

    setSubmitting(false);
  };

  return (
    <div style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      zIndex: 1000,
    }}>
      <div style={{
        backgroundColor: '#002D72',
        color: 'white',
        padding: '2rem',
        borderRadius: '0.75rem',
        width: '90%',
        maxWidth: '400px',
        position: 'relative',
        textAlign: 'center',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
      }}>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '0.5rem',
              right: '0.75rem',
              background: 'transparent',
              color: 'white',
              border: 'none',
              fontSize: '1.25rem',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            ×
          </button>
        )}
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>Enter Project Name</h2>
        <p style={{ marginBottom: '1rem', fontSize: '0.9rem', color: '#D1D5DB' }}>This helps organize your saved summaries.</p>

        <input
          type="text"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          placeholder="e.g., Client Outreach"
          style={{
            width: '100%',
            padding: '0.5rem',
            borderRadius: '0.375rem',
            border: 'none',
            marginBottom: '0.75rem',
            color: 'black'
          }}
          disabled={submitting || success}
        />

        {error && <p style={{ color: '#F87171', fontSize: '0.85rem', marginBottom: '0.5rem' }}>{error}</p>}
        {success && <p style={{ color: '#34D399', fontSize: '0.85rem', marginBottom: '0.5rem' }}>✅ Saved successfully!</p>}

        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
          <button
            onClick={onClose}
            style={{
              padding: '0.5rem 1.25rem',
              borderRadius: '0.375rem',
              backgroundColor: '#6B7280',
              color: 'white',
              border: 'none',
              cursor: 'pointer'
            }}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            style={{
              backgroundColor: 'white',
              color: '#002D72',
              padding: '0.5rem 1.25rem',
              borderRadius: '0.375rem',
              fontWeight: 'bold',
              border: 'none',
              cursor: 'pointer'
            }}
            disabled={submitting}
          >
            {submitting ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectNamePopup;
