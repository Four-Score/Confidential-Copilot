'use client';

import React, { useEffect } from 'react';
import { DataSelectionProvider as BaseDataSelectionProvider, useDataSelection } from '@/contexts/DataSelectionContext';
import { SelectedDocument } from '@/contexts/DataSelectionContext';

interface DataSelectionProviderProps {
  children: React.ReactNode;
}

// Wrapper for the DataSelectionProvider that adds persistence
export const DataSelectionProvider: React.FC<DataSelectionProviderProps> = ({ children }) => {
  return (
    <BaseDataSelectionProvider>
      <PersistenceLayer>
        {children}
      </PersistenceLayer>
    </BaseDataSelectionProvider>
  );
};

// Inner component to handle persistence without re-rendering the entire tree
const PersistenceLayer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { 
    selectedDocuments, 
    selectedProjectId,
    selectedProjectName,
    selectProject,
    clearProjectSelection,
    clearDocumentSelection,
    selectAllDocuments
  } = useDataSelection();

  // Load persisted data on mount
  useEffect(() => {
    try {
      // Load selected project
      const persistedProject = localStorage.getItem('selectedProject');
      if (persistedProject) {
        const { id, name } = JSON.parse(persistedProject);
        if (id && name) {
          selectProject(id, name);
        }
      }
      
      // Load selected documents
      const persistedDocuments = localStorage.getItem('selectedDocuments');
      if (persistedDocuments) {
        const documents: SelectedDocument[] = JSON.parse(persistedDocuments);
        if (Array.isArray(documents) && documents.length > 0) {
          // If documents exist but no project, clear them
          if (!selectedProjectId) {
            clearDocumentSelection();
          } else {
            // Otherwise, load them
            selectAllDocuments(documents);
          }
        }
      }
    } catch (error) {
      console.error('Error loading persisted selection data:', error);
      // Clear local storage in case of corrupt data
      localStorage.removeItem('selectedProject');
      localStorage.removeItem('selectedDocuments');
    }
  }, []);

  // Save project selection changes to localStorage
  useEffect(() => {
    if (selectedProjectId && selectedProjectName) {
      localStorage.setItem('selectedProject', JSON.stringify({
        id: selectedProjectId,
        name: selectedProjectName
      }));
    } else {
      localStorage.removeItem('selectedProject');
      // Also clear documents if no project is selected
      localStorage.removeItem('selectedDocuments');
    }
  }, [selectedProjectId, selectedProjectName]);

  // Save document selection changes to localStorage
  useEffect(() => {
    if (selectedDocuments.length > 0) {
      localStorage.setItem('selectedDocuments', JSON.stringify(selectedDocuments));
    } else {
      localStorage.removeItem('selectedDocuments');
    }
  }, [selectedDocuments]);

  return <>{children}</>;
};