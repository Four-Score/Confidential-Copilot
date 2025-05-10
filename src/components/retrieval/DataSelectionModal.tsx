'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/ui/Modal';
import { ModalTransition } from '@/components/ui/ModalTransition';
import { useModal } from '@/contexts/ModalContext';
import { useDataSelection } from '@/contexts/DataSelectionContext';
import { SelectableDocumentCard } from './SelectableDocumentCard';
import { Button } from '@/components/ui/Button';
import { MODAL_ROUTES } from '@/constants/modalRoutes';

// Document types
interface Document {
  id: string;
  name: string;
  type: string;
  upload_date?: string;
  file_size?: number;
  page_count?: number;
  encryptedName?: boolean;
}

// Website response type from API
interface WebsiteResponse {
  websites: Array<{
    id: string;
    name: string;
    type: string;
    upload_date?: string;
    file_size?: number;
    url?: string;
    title?: string;
    description?: string;
    metadata?: any;
  }>;
}
export const DataSelectionModal: React.FC = () => {
  // Hooks
  const router = useRouter();
  const { isModalOpen, closeModal, openModal, goBack, modalProps } = useModal();
  const { 
    selectedProjectId, 
    selectedProjectName,
    selectedDocuments, 
    selectAllDocuments,
    clearDocumentSelection,
    hasSelectedDocuments 
  } = useDataSelection();
  
  // Local state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [encryptedDocuments, setEncryptedDocuments] = useState<Document[]>([]);
  const [unencryptedDocuments, setUnencryptedDocuments] = useState<Document[]>([]);
  const [isAllSelected, setIsAllSelected] = useState(false);
      
  // Effect to fetch project data
  useEffect(() => {
    // Only fetch when modal is actually open AND we have a project ID
    const isOpen = isModalOpen && modalProps.currentView === MODAL_ROUTES.DATA_SELECTION;
    
    if (!selectedProjectId || !isOpen) return;
    
    const fetchProjectData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch encrypted documents (PDFs) from documents table
        const encryptedResponse = await fetch(`/api/projects/${selectedProjectId}/documents`);
        
        if (!encryptedResponse.ok) {
          const errorData = await encryptedResponse.json();
          console.error('Error fetching encrypted documents:', errorData);
        } else {
          const encryptedData = await encryptedResponse.json();
          setEncryptedDocuments(Array.isArray(encryptedData) ? encryptedData.map(doc => ({
            ...doc,
            encryptedName: true // Mark names as encrypted
          })) : []);
        }
        
        // Fetch unencrypted documents (websites) from v2_documents table
        const unencryptedResponse = await fetch(`/api/projects/${selectedProjectId}/websites`);
        
        if (!unencryptedResponse.ok) {
          const errorData = await unencryptedResponse.json();
          console.error('Error fetching unencrypted documents:', errorData);
        } else {
          const websiteData = await unencryptedResponse.json() as WebsiteResponse;
          
          // The websites API returns an object with a websites array
          const websitesArray = websiteData.websites || [];
          
          setUnencryptedDocuments(websitesArray.map(website => ({
            id: website.id,
            name: website.title || website.name || website.url || 'Untitled Website',
            type: 'website',
            upload_date: website.upload_date,
            file_size: website.file_size,
            url: website.url,
            encryptedName: false // Website names are not encrypted
          })));
        }
      } catch (err) {
        console.error('Error fetching project data:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };
    
    
    fetchProjectData();
  }, [selectedProjectId, isModalOpen, modalProps.currentView]);

  // Check if all documents are selected - more efficient check
  useEffect(() => {
    if (encryptedDocuments.length === 0 && unencryptedDocuments.length === 0) {
      setIsAllSelected(false);
      return;
    }
    
    // Count all document IDs
    const allDocsIds = new Set([
      ...encryptedDocuments.map(doc => doc.id),
      ...unencryptedDocuments.map(doc => doc.id)
    ]);
    
    // Count selected document IDs that are in our current document sets
    const selectedDocsInCurrentProject = selectedDocuments.filter(
      doc => allDocsIds.has(doc.id)
    );
    
    // All selected if counts match
    setIsAllSelected(selectedDocsInCurrentProject.length === allDocsIds.size);
  }, [encryptedDocuments, unencryptedDocuments, selectedDocuments]);

  // Handle select all toggle
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setIsAllSelected(checked);
    
    if (checked) {
      // Create selected document objects for all documents
      const allEncryptedDocs = encryptedDocuments.map(doc => ({
        id: doc.id,
        name: doc.name,
        type: 'encrypted' as const
      }));
      
      const allUnencryptedDocs = unencryptedDocuments.map(doc => ({
        id: doc.id,
        name: doc.name,
        type: 'unencrypted' as const
      }));
      
      selectAllDocuments([...allEncryptedDocs, ...allUnencryptedDocs]);
    } else {
      clearDocumentSelection();
    }
  };

  // Handle proceed to search
  const handleProceed = () => {
    if (!hasSelectedDocuments()) return;
    
    // Proceed to search modal
    openModal(MODAL_ROUTES.SEARCH_INTERFACE, { 
      currentView: MODAL_ROUTES.SEARCH_INTERFACE,
      projectId: selectedProjectId,
      projectName: selectedProjectName 
    });
  };

  return (
    <Modal
    isOpen={isModalOpen && modalProps.currentView === MODAL_ROUTES.DATA_SELECTION}
      onClose={closeModal}
      title={`Select Documents - ${selectedProjectName || 'Project'}`}
      width="lg"
    >
      <ModalTransition 
      show={isModalOpen && modalProps.currentView === MODAL_ROUTES.DATA_SELECTION} 
      type={MODAL_ROUTES.DATA_SELECTION}
    >
      <div className="flex flex-col max-h-[80vh]">
        {/* Header with back button - fixed at top */}
        <div className="flex items-center p-6 pb-2">
          <button 
            onClick={goBack}
            className="mr-4 p-2 rounded-full hover:bg-gray-100 transition duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-xl font-semibold">{selectedProjectName || 'Select'} Documents</h2>
        </div>

        {/* Instructions - fixed below header */}
        <div className="mx-6 mb-4 bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
          <p className="text-blue-700">
            Select the documents you want to search through. You can select both encrypted and unencrypted documents.
          </p>
        </div>
        
        {/* Select All checkbox - fixed below instructions */}
        <div className="px-6 mb-4 flex items-center">
          <label className="inline-flex items-center">
            <input
              type="checkbox"
              checked={isAllSelected}
              onChange={handleSelectAll}
              disabled={encryptedDocuments.length === 0 && unencryptedDocuments.length === 0}
              className="form-checkbox h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <span className="ml-2 text-gray-700 font-medium">Select All Documents</span>
          </label>
          <div className="ml-4 text-sm text-gray-500">
            {selectedDocuments.length > 0 && (
              <span>{selectedDocuments.length} document{selectedDocuments.length !== 1 ? 's' : ''} selected</span>
            )}
          </div>
        </div>
        
        {/* Scrollable content area */}
        <div className="px-6 overflow-y-auto flex-grow">
          {/* Loading state */}
          {isLoading && (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          )}
          
          {/* Error state */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6" role="alert">
              <p><strong>Error:</strong> {error}</p>
            </div>
          )}
          
          {/* No documents state */}
          {!isLoading && !error && encryptedDocuments.length === 0 && unencryptedDocuments.length === 0 && (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900">No documents found</h3>
              <p className="mt-2 text-gray-500">This project doesn't have any documents yet</p>
            </div>
          )}
          
          {/* Document Sections */}
          {!isLoading && (
            <div className="space-y-8">
              {/* Encrypted Documents */}
              {encryptedDocuments.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">Encrypted Documents</h3>
                  <div className="grid grid-cols-1 gap-4">
                    {encryptedDocuments.map(doc => (
                      <SelectableDocumentCard 
                        key={doc.id}
                        document={doc}
                        source="encrypted"
                      />
                    ))}
                  </div>
                </div>
              )}
              
              {/* Unencrypted Documents */}
              {unencryptedDocuments.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">Unencrypted Websites</h3>
                  <div className="grid grid-cols-1 gap-4">
                    {unencryptedDocuments.map(doc => (
                      <SelectableDocumentCard 
                        key={doc.id}
                        document={doc}
                        source="unencrypted"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Action buttons - fixed at bottom */}
        <div className="flex justify-end p-6 space-x-3 border-t border-gray-200 mt-4">
          <Button 
            variant="outline" 
            onClick={goBack}
            className="px-4 py-2"
          >
          {modalProps.destination === 'chat' && hasSelectedDocuments() && (
            <Button
              onClick={() => {
                closeModal();
                router.push('/dashboard/chat');
              }}
              className="ml-auto"
            >
              Continue to Chat
            </Button>
          )}
            </Button>
        </div>
      </div>
      </ModalTransition>
    </Modal>
  );
};