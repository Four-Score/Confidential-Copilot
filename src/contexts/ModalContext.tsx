'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { MODAL_ROUTES } from '@/constants/modalRoutes';

// Modal types for our application
export type ModalType = 
  | typeof MODAL_ROUTES.PROJECT_SELECTION
  | typeof MODAL_ROUTES.DATA_SELECTION
  | typeof MODAL_ROUTES.SEARCH_INTERFACE
  | null;

// Modal history for navigation
interface ModalHistoryEntry {
  type: ModalType;
  props?: Record<string, any>;
}

interface ModalContextType {
  // Current modal state
  currentModal: ModalType;
  modalProps: Record<string, any>;
  isModalOpen: boolean;
  
  // Animation state
  isAnimating: boolean;
  animationDirection: 'forward' | 'backward' | null;
  
  // Modal history for navigation
  modalHistory: ModalHistoryEntry[];
  
  // Actions
  openModal: (type: ModalType, props?: Record<string, any>) => void;
  closeModal: () => void;
  goBack: () => void;
  replaceModal: (type: ModalType, props?: Record<string, any>) => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentModal, setCurrentModal] = useState<ModalType>(null);
  const [modalProps, setModalProps] = useState<Record<string, any>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationDirection, setAnimationDirection] = useState<'forward' | 'backward' | null>(null);
  const [modalHistory, setModalHistory] = useState<ModalHistoryEntry[]>([]);

  // Open a new modal
  const openModal = (type: ModalType, props: Record<string, any> = {}) => {
    if (currentModal) {
      // Add current modal to history
      setModalHistory(prev => [...prev, { type: currentModal, props: modalProps }]);
    }
    
    setIsAnimating(true);
    setAnimationDirection('forward');
    
    // Set new modal
    setCurrentModal(type);
    setModalProps(props);
    setIsModalOpen(true);
    
    // End animation
    setTimeout(() => {
      setIsAnimating(false);
    }, 300); // Match CSS transition duration
  };

  // Close the current modal
  const closeModal = () => {
    setIsAnimating(true);
    
    // Animate out
    setTimeout(() => {
      setCurrentModal(null);
      setModalProps({});
      setIsModalOpen(false);
      setModalHistory([]);
      setIsAnimating(false);
      setAnimationDirection(null);
    }, 300); // Match CSS transition duration
  };

  // Go back to the previous modal
  const goBack = () => {
    if (modalHistory.length === 0) {
      closeModal();
      return;
    }

    setIsAnimating(true);
    setAnimationDirection('backward');
    
    // Get previous modal
    const prevModal = modalHistory[modalHistory.length - 1];
    setCurrentModal(prevModal.type);
    setModalProps(prevModal.props || {});
    
    // Remove from history
    setModalHistory(prev => prev.slice(0, -1));
    
    // End animation
    setTimeout(() => {
      setIsAnimating(false);
    }, 300); // Match CSS transition duration
  };

  // Replace current modal without affecting history
  const replaceModal = (type: ModalType, props: Record<string, any> = {}) => {
    setIsAnimating(true);
    setAnimationDirection('forward');
    
    // Replace current modal
    setCurrentModal(type);
    setModalProps(props);
    
    // End animation
    setTimeout(() => {
      setIsAnimating(false);
    }, 300);
  };

  return (
    <ModalContext.Provider
      value={{
        currentModal,
        modalProps,
        isModalOpen,
        isAnimating,
        animationDirection,
        modalHistory,
        openModal,
        closeModal,
        goBack,
        replaceModal,
      }}
    >
      {children}
    </ModalContext.Provider>
  );
};

// Custom hook to use the modal context
export const useModal = () => {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};