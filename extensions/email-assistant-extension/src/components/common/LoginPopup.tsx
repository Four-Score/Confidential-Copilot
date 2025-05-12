import React from 'react';

interface LoginPopupProps {
  title?: string;
  message?: string;
  buttonText?: string;
  onClose?: () => void;
  onLogin?: () => void;
}

export default function LoginPopup({
  title = 'Login Required',
  message = 'Please sign in to continue using Confidential Copilot features.',
  buttonText = 'Log In',
  onClose,
  onLogin,
}: LoginPopupProps) {
  const handleLogin = () => {
    if (onLogin) {
      onLogin();
    } else {
      window.open('http://localhost:3000/connect-extension', '_blank');
    }
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
        backgroundColor: 'var(--primary-blue)',
        color: 'var(--text-white)',
        padding: '2rem',
        borderRadius: '0.75rem',
        width: '90%',
        maxWidth: '400px',
        position: 'relative',
        textAlign: 'center',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
      }}>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '0.5rem',
              right: '0.75rem',
              background: 'transparent',
              color: 'var(--text-white)',
              border: 'none',
              fontSize: '1.25rem',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            ×
          </button>
        )}
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>{title}</h2>
        <p style={{ marginBottom: '1.5rem' }}>{message}</p>
        <button
          onClick={handleLogin}
          style={{
            backgroundColor: 'var(--text-white)',
            color: 'var(--primary-blue)',
            padding: '0.5rem 1.5rem',
            borderRadius: '0.375rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            border: 'none'
          }}
        >
          {buttonText}
        </button>
      </div>
    </div>
  );
}
