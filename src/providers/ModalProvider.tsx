'use client';

import React from 'react';
import { ModalProvider as BaseModalProvider } from '@/contexts/ModalContext';
import { DataSelectionProvider } from '@/providers/DataSelectionProvider'; // Update this import
import { ProjectSelectionModal } from '@/components/retrieval/ProjectSelectionModal';
import { DataSelectionModal } from '@/components/retrieval/DataSelectionModal';
import { SearchModal } from '@/components/retrieval/SearchModal';

interface ModalProviderProps {
  children: React.ReactNode;
}

export const ModalProvider: React.FC<ModalProviderProps> = ({ children }) => {
  return (
    <BaseModalProvider>
      <DataSelectionProvider>
        {children}
        
        {/* Modals */}
        <ProjectSelectionModal />
        <DataSelectionModal />
        <SearchModal />
      </DataSelectionProvider>
    </BaseModalProvider>
  );
};