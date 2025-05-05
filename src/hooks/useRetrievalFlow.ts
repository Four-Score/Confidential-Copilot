'use client';

import { useModal } from '@/contexts/ModalContext';
import { useDataSelection } from '@/contexts/DataSelectionContext';
import { useSearch } from '@/contexts/SearchContext';
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
  
  // Add search context integration
  const {
    setQuery,
    executeSearch,
    clearSearchResults,
    resetSearch: resetSearchState
  } = useSearch();
  
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
   * @param documents Selected documents for search
   * @param initialQuery Optional initial search query
   * @returns Boolean indicating success
   */
  const startSearch = (documents: SelectedDocument[], initialQuery?: string) => {
    if (!selectedProjectId || documents.length === 0) return false;
    
    // Clear previous search results
    clearSearchResults();
    
    // Set initial query if provided
    if (initialQuery) {
      setQuery(initialQuery);
    }
    
    openModal(MODAL_ROUTES.SEARCH_INTERFACE, { 
      currentView: MODAL_ROUTES.SEARCH_INTERFACE,
      projectId: selectedProjectId,
      projectName: selectedProjectName
    });
    
    // Extract document IDs for search
    const documentIds = documents.map(doc => doc.id);
    
    // Initialize search if query is provided
    if (initialQuery) {
      executeSearch(selectedProjectId, documentIds);
    }
    
    return true;
  };
  
  /**
   * Execute search with current selections and query
   * @param query The search query text
   * @returns Promise that resolves when search completes
   */
  const executeSearchWithCurrentSelections = async (query: string) => {
    if (!selectedProjectId || selectedDocuments.length === 0) return false;
    
    setQuery(query);
    const documentIds = selectedDocuments.map(doc => doc.id);
    await executeSearch(selectedProjectId, documentIds);
    
    return true;
  };
  
  /**
   * Reset the retrieval flow state
   */
  const resetRetrievalState = () => {
    clearProjectSelection();
    clearDocumentSelection();
    resetSearchState();
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
  
  /**
   * Get the search results
   */
  const getSearchResults = () => {
    return {
      query: useSearch().query,
      results: useSearch().results,
      isLoading: useSearch().isLoading,
      error: useSearch().error
    };
  };
  
  return {
    startRetrievalFlow,
    startDocumentSelection,
    startSearch,
    resetRetrievalState,
    getRetrievalState,
    executeSearchWithCurrentSelections,
    clearSearchResults,
    getSearchResults
  };
};