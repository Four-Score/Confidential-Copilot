'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { ModalTransition } from '@/components/ui/ModalTransition';
import { useModal } from '@/contexts/ModalContext';
import { useDataSelection } from '@/contexts/DataSelectionContext';
import { Button } from '@/components/ui/Button';
import { MODAL_ROUTES } from '@/constants/modalRoutes';
import { SearchResults } from '@/components/search/SearchResults';
import { useVectorSearch } from '@/hooks/useVectorSearch';

export const SearchModal: React.FC = () => {
  // Context hooks
  const { isModalOpen, closeModal, goBack, modalProps } = useModal();
  const { 
    selectedProjectId, 
    selectedProjectName,
    selectedDocuments,
    hasSelectedDocuments 
  } = useDataSelection();
  
  // Vector search hook
  const {
    search,
    isLoading,
    error,
    results,
    resetSearch,
    searchConfig,
    updateSearchConfig
  } = useVectorSearch();
  
  // Local state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchError, setSearchError] = useState<string | null>(null);
  
  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (searchError) setSearchError(null);
  };
  
  // Handle search submission
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchError('Please enter a search query');
      return;
    }
    
    if (!hasSelectedDocuments()) {
      setSearchError('No documents selected for search');
      return;
    }
    
    setSearchError(null);
    
    try {
      // Extract document IDs from selected documents
      const documentIds = selectedDocuments.map(doc => doc.id);
      
      // Check if selectedProjectId is not null before searching
      if (!selectedProjectId) {
        setSearchError('No project selected for search');
        return;
      }
      
      // Perform vector search
      await search(searchQuery, selectedProjectId, documentIds);
      
    } catch (error) {
      console.error('Search error:', error);
      setSearchError('An error occurred during search');
    }
  };

  return (
    <Modal
      isOpen={isModalOpen && modalProps.currentView === MODAL_ROUTES.SEARCH_INTERFACE}
      onClose={closeModal}
      title="Search Documents"
      width="lg"
    >
      <ModalTransition 
        show={isModalOpen && modalProps.currentView === MODAL_ROUTES.SEARCH_INTERFACE} 
        type={MODAL_ROUTES.SEARCH_INTERFACE}
      >
        <div className="p-6 max-h-[80vh] overflow-y-auto flex flex-col">
          {/* Header with back button */}
          <div className="flex items-center mb-6 flex-shrink-0">
            <button 
              onClick={goBack}
              className="mr-4 p-2 rounded-full hover:bg-gray-100 transition duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="text-xl font-semibold">Search in {selectedProjectName}</h2>
          </div>

          {/* Search Count Information */}
          <div className="mb-6 bg-blue-50 border-l-4 border-blue-500 p-4 rounded flex-shrink-0">
            <p className="text-blue-700">
              Searching across {selectedDocuments.length} selected document{selectedDocuments.length !== 1 ? 's' : ''}
            </p>
          </div>
          
          {/* Search Input */}
          <div className="mb-6 flex-shrink-0">
            <label htmlFor="search-query" className="block text-sm font-medium text-gray-700 mb-1">
              Search Query
            </label>
            <div className="relative">
              <input
                id="search-query"
                type="text"
                placeholder="Enter your search query"
                value={searchQuery}
                onChange={handleSearchChange}
                disabled={isLoading}
                className="w-full p-4 pr-16 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
              />
            </div>
            
            {/* Error message */}
            {searchError && (
              <p className="mt-2 text-sm text-red-600">
                {searchError}
              </p>
            )}
          </div>
          
          {/* Search Button */}
          <div className="flex justify-end space-x-3 mb-6 flex-shrink-0">
            <Button 
              variant="outline" 
              onClick={goBack}
              disabled={isLoading}
              className="px-4 py-2"
            >
              Back
            </Button>
            <Button 
              onClick={handleSearch}
              disabled={isLoading || !searchQuery.trim() || !hasSelectedDocuments()}
              className={`px-6 py-2 flex items-center space-x-2 ${
                isLoading || !searchQuery.trim() || !hasSelectedDocuments() 
                  ? 'opacity-50 cursor-not-allowed' 
                  : ''
              }`}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Searching...</span>
                </>
              ) : (
                <span>Search</span>
              )}
            </Button>
          </div>
          
          {/* Search Results */}
          <div className="flex-1 overflow-y-auto">
            <SearchResults
              results={results}
              isLoading={isLoading}
              error={error}
              query={searchQuery}
            />
          </div>
        </div>
      </ModalTransition>
    </Modal>
  );
};