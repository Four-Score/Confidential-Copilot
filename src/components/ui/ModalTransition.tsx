'use client';

import React from 'react';
import styles from '@/styles/transitions.module.css';
import { useModal } from '@/contexts/ModalContext';

interface ModalTransitionProps {
  children: React.ReactNode;
  show: boolean;
  type: string;
}

export const ModalTransition: React.FC<ModalTransitionProps> = ({
  children,
  show,
  type
}) => {
  const { animationDirection, isAnimating, currentModal } = useModal();
  
  // Don't render if not showing and not the current modal type
  if (!show && currentModal !== type && !isAnimating) return null;
  
  // Determine the animation class based on direction and show state
  const getAnimationClass = () => {
    if (!isAnimating) return '';
    
    if (animationDirection === 'forward') {
      return show ? styles.slideInRight : styles.slideOutLeft;
    } else if (animationDirection === 'backward') {
      return show ? styles.slideInLeft : styles.slideOutRight;
    }
    
    return '';
  };
  
  return (
    <div className={`${getAnimationClass()}`}>
      {children}
    </div>
  );
};