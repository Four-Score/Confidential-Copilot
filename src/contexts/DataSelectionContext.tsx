'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

// Document type distinction
export type DocumentSourceType = 'encrypted' | 'unencrypted';

// Selected document interface
export interface SelectedDocument {
  id: string;
  name: string;
  type: DocumentSourceType;
}

interface DataSelectionContextType {
  // Selected project
  selectedProjectId: string | null;
  selectedProjectName: string | null;
  
  // Selected documents
  selectedDocuments: SelectedDocument[];
  
  // Actions
  selectProject: (id: string, name: string) => void;
  clearProjectSelection: () => void;
  
  addDocument: (doc: SelectedDocument) => void;
  removeDocument: (id: string) => void;
  toggleDocument: (doc: SelectedDocument) => void;
  clearDocumentSelection: () => void;
  selectAllDocuments: (docs: SelectedDocument[]) => void;
  
  // Utility functions
  isDocumentSelected: (id: string) => boolean;
  hasSelectedDocuments: () => boolean;
}

const DataSelectionContext = createContext<DataSelectionContextType | undefined>(undefined);

export const DataSelectionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedProjectName, setSelectedProjectName] = useState<string | null>(null);
  const [selectedDocuments, setSelectedDocuments] = useState<SelectedDocument[]>([]);

  // Project selection
  const selectProject = (id: string, name: string) => {
    setSelectedProjectId(id);
    setSelectedProjectName(name);
    // Clear document selections when changing projects
    clearDocumentSelection();
  };

  const clearProjectSelection = () => {
    setSelectedProjectId(null);
    setSelectedProjectName(null);
    clearDocumentSelection();
  };

  // Document selection
  const addDocument = (doc: SelectedDocument) => {
    setSelectedDocuments(prev => {
      if (prev.some(d => d.id === doc.id)) return prev;
      return [...prev, doc];
    });
  };

  const removeDocument = (id: string) => {
    setSelectedDocuments(prev => prev.filter(doc => doc.id !== id));
  };

  const toggleDocument = (doc: SelectedDocument) => {
    const isSelected = selectedDocuments.some(d => d.id === doc.id);
    if (isSelected) {
      removeDocument(doc.id);
    } else {
      addDocument(doc);
    }
  };

  const clearDocumentSelection = () => {
    setSelectedDocuments([]);
  };

  const selectAllDocuments = (docs: SelectedDocument[]) => {
    // Filter out any already selected documents to avoid duplicates
    const newDocs = docs.filter(
      doc => !selectedDocuments.some(d => d.id === doc.id)
    );
    setSelectedDocuments(prev => [...prev, ...newDocs]);
  };

  // Utility functions
  const isDocumentSelected = (id: string) => {
    return selectedDocuments.some(doc => doc.id === id);
  };

  const hasSelectedDocuments = () => {
    return selectedDocuments.length > 0;
  };

  return (
    <DataSelectionContext.Provider
      value={{
        selectedProjectId,
        selectedProjectName,
        selectedDocuments,
        selectProject,
        clearProjectSelection,
        addDocument,
        removeDocument,
        toggleDocument,
        clearDocumentSelection,
        selectAllDocuments,
        isDocumentSelected,
        hasSelectedDocuments,
      }}
    >
      {children}
    </DataSelectionContext.Provider>
  );
};

// Custom hook to use the data selection context
export const useDataSelection = () => {
  const context = useContext(DataSelectionContext);
  if (context === undefined) {
    throw new Error('useDataSelection must be used within a DataSelectionProvider');
  }
  return context;
};