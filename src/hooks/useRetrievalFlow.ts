'use client';

import { useModal } from '@/contexts/ModalContext';
import { useDataSelection } from '@/contexts/DataSelectionContext';
import { MODAL_ROUTES } from '@/constants/modalRoutes';
import { SelectedDocument } from '@/contexts/DataSelectionContext';

/**
 * Hook providing utility functions for the retrieval flow
 */
export const useRetrievalFlow = () => {
  const { openModal } = useModal();
  const { 
    selectedProjectId,
    selectedProjectName,
    selectedDocuments,
    clearProjectSelection,
    clearDocumentSelection
  } = useDataSelection();
  
  /**
   * Start the retrieval flow from the beginning
   */
  const startRetrievalFlow = () => {
    openModal(MODAL_ROUTES.PROJECT_SELECTION, { currentView: MODAL_ROUTES.PROJECT_SELECTION });
  };
  
  /**
   * Skip directly to document selection for a specific project
   */
  const startDocumentSelection = (projectId: string, projectName: string) => {
    openModal(MODAL_ROUTES.DATA_SELECTION, { 
      currentView: MODAL_ROUTES.DATA_SELECTION,
      projectId,
      projectName
    });
  };
  
  /**
   * Skip directly to search with pre-selected documents
   */
  const startSearch = (documents: SelectedDocument[]) => {
    if (!selectedProjectId || documents.length === 0) return false;
    
    openModal(MODAL_ROUTES.SEARCH_INTERFACE, { 
      currentView: MODAL_ROUTES.SEARCH_INTERFACE,
      projectId: selectedProjectId,
      projectName: selectedProjectName
    });
    
    return true;
  };
  
  /**
   * Reset the retrieval flow state
   */
  const resetRetrievalState = () => {
    clearProjectSelection();
    clearDocumentSelection();
  };
  
  /**
   * Get the current state of the retrieval flow
   */
  const getRetrievalState = () => {
    return {
      hasProject: !!selectedProjectId,
      projectId: selectedProjectId,
      projectName: selectedProjectName,
      documentsSelected: selectedDocuments.length,
      selectedDocuments
    };
  };
  
  return {
    startRetrievalFlow,
    startDocumentSelection,
    startSearch,
    resetRetrievalState,
    getRetrievalState
  };
};