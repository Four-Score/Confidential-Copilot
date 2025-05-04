'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  showCloseButton?: boolean;
  className?: string;
  width?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  allowClickOutside?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  title,
  showCloseButton = true,
  className = '',
  width = 'md',
  allowClickOutside = true,
}) => {
  const [mounted, setMounted] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  
  // Width class mapping
  const widthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-4xl',
  };

  // Handle mounting for SSR
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Handle escape key press
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden'; // Prevent scrolling when modal is open
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'auto'; // Re-enable scrolling when modal closes
    };
  }, [isOpen]);

  // Focus trap inside modal
  useEffect(() => {
    if (!isOpen || !modalRef.current) return;

    const focusableElements = modalRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    if (firstElement) {
      firstElement.focus();
    }

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleTabKey);
    return () => {
      document.removeEventListener('keydown', handleTabKey);
    };
  }, [isOpen]);

  // Handle animation on close
  const handleClose = () => {
    if (!allowClickOutside) return;
    
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 300); // Match this with CSS transition duration
  };

  // Don't render anything on server or if not mounted
  if (!mounted) return null;

  // Portal for accessibility and proper stacking
  return createPortal(
    isOpen ? (
      <div 
        className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${isClosing ? 'animate-fade-out' : 'animate-fade-in'}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
      >
        {/* Overlay */}
        <div 
          className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity ${isClosing ? 'opacity-0' : 'opacity-100'}`} 
          onClick={handleClose}
        />
        
        {/* Modal Content */}
        <div 
          ref={modalRef}
          className={`
            ${widthClasses[width]} w-full bg-white rounded-lg shadow-xl z-10 overflow-hidden
            ${className}
          `}
          onClick={e => e.stopPropagation()}
        >
          {/* Optional Title Bar */}
          {(title || showCloseButton) && (
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
              {title && <h3 id="modal-title" className="text-lg font-semibold">{title}</h3>}
              {showCloseButton && (
                <button
                  type="button"
                  onClick={handleClose}
                  className="text-gray-400 hover:text-gray-700 focus:outline-none"
                  aria-label="Close"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          )}
          
          {/* Modal Body */}
          <div className={!title && !showCloseButton ? 'pt-6' : ''}>
            {children}
          </div>
        </div>
      </div>
    ) : null,
    document.body
  );
};