'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { PasswordPromptModal } from '@/components/auth/PasswordPromptModal';

interface ModalContextType {
  showPasswordPrompt: () => void;
  hidePasswordPrompt: () => void;
}

const ModalContext = createContext<ModalContextType | null>(null);

export const useModalContext = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModalContext must be used within a ModalProvider');
  }
  return context;
};

export const ModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isPasswordPromptOpen, setIsPasswordPromptOpen] = useState(false);

  const showPasswordPrompt = () => setIsPasswordPromptOpen(true);
  const hidePasswordPrompt = () => setIsPasswordPromptOpen(false);

  // Listen for the custom event to show the password prompt
  useEffect(() => {
    const handleShowPasswordPrompt = () => {
      showPasswordPrompt();
    };

    window.addEventListener('cc-show-password-prompt', handleShowPasswordPrompt);

    return () => {
      window.removeEventListener('cc-show-password-prompt', handleShowPasswordPrompt);
    };
  }, []);

  return (
    <ModalContext.Provider value={{ showPasswordPrompt, hidePasswordPrompt }}>
      {children}
      <PasswordPromptModal 
        isOpen={isPasswordPromptOpen} 
        onClose={hidePasswordPrompt} 
      />
    </ModalContext.Provider>
  );
};