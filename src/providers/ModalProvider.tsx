'use client';

import React from 'react';
import { ModalProvider as BaseModalProvider } from '@/contexts/ModalContext';
import { ModalProvider as PasswordModalProvider } from '@/contexts/PasswordModalContext';
import { DataSelectionProvider } from '@/providers/DataSelectionProvider'; 
import { ProjectSelectionModal } from '@/components/retrieval/ProjectSelectionModal';
import { DataSelectionModal } from '@/components/retrieval/DataSelectionModal';
import { SearchModal } from '@/components/retrieval/SearchModal';

interface ModalProviderProps {
  children: React.ReactNode;
}

export const ModalProvider: React.FC<ModalProviderProps> = ({ children }) => {
  return (
    <BaseModalProvider>
      <PasswordModalProvider>
        <DataSelectionProvider>
          {children}
          
          {/* Modals */}
          <ProjectSelectionModal />
          <DataSelectionModal />
          <SearchModal />
        </DataSelectionProvider>
      </PasswordModalProvider>
    </BaseModalProvider>
  );
};