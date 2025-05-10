'use client';

import React, { useState, useEffect } from 'react';
import { useChatContext } from '@/contexts/ChatContext';
import { Document, UnencryptedDocument, isUnencryptedDocument } from '@/types/document';
import { keyManagementService } from '@/services/keyManagement';
import { useModalContext } from '@/contexts/PasswordModalContext';

export default function DocumentSidebar() {
  const { chatState } = useChatContext();
  const { showPasswordPrompt } = useModalContext();
  
  // State for documents grouped by project
  const [documentsByProject, setDocumentsByProject] = useState<{
    [projectId: string]: {
      projectName: string;
      documents: {
        id: string;
        name: string;
        type: string;
        isEncrypted: boolean;
        originalName: string;
      }[];
    };
  }>({});
  
  // Track decryption status
  const [isDecrypting, setIsDecrypting] = useState(false);
  
  // Effect to fetch document details and decrypt names if needed
  useEffect(() => {
    const fetchDocumentDetails = async () => {
      if (chatState.selectedDocumentIds.length === 0) {
        setDocumentsByProject({});
        return;
      }
      
      setIsDecrypting(true);
      
      try {
        // Create a map to store documents by project
        const projectMap: {
          [projectId: string]: {
            projectName: string;
            documents: {
              id: string;
              name: string;
              type: string;
              isEncrypted: boolean;
              originalName: string;
            }[];
          };
        } = {};
        
        // Initialize with project IDs from chatState
        chatState.selectedProjectIds.forEach(projectId => {
          projectMap[projectId] = {
            projectName: `Project ${projectId.substring(0, 6)}`, // Default name
            documents: []
          };
        });
        
        // Fetch project names
        for (const projectId of chatState.selectedProjectIds) {
          try {
            const response = await fetch(`/api/projects/${projectId}`);
            if (response.ok) {
              const projectData = await response.json();
              if (projectMap[projectId]) {
                projectMap[projectId].projectName = projectData.name || projectMap[projectId].projectName;
              }
            }
          } catch (error) {
            console.error(`Failed to fetch project ${projectId} details:`, error);
          }
        }
        
        // Fetch document details
        const documentPromises = chatState.selectedDocumentIds.map(async (docId) => {
          try {
            // First, try to fetch from documents endpoint
            let response = await fetch(`/api/documents/${docId}`);
            
            if (!response.ok) {
              // If not found, try websites endpoint
              response = await fetch(`/api/websites/${docId}`);
              
              if (!response.ok) {
                throw new Error(`Failed to fetch document ${docId}`);
              }
              
              const websiteData = await response.json();
              
              // This is an unencrypted document
              return {
                id: docId,
                name: websiteData.title || websiteData.name || 'Untitled Website',
                type: websiteData.type || 'website',
                projectId: websiteData.project_id,
                isEncrypted: false,
                originalName: websiteData.title || websiteData.name || 'Untitled Website'
              };
            }
            
            const documentData = await response.json();
            
            // This is an encrypted document
            let displayName = documentData.name;
            
            // Check if we need to decrypt the name
            if (keyManagementService.isInitialized()) {
              try {
                displayName = await keyManagementService.decryptMetadata(documentData.name);
              } catch (error) {
                console.error("Failed to decrypt document name:", error);
                displayName = `Document ${docId.substring(0, 6)}`;
              }            } else {
              // Key service not initialized, use placeholder
              displayName = `Document ${docId.substring(0, 6)}`;
              
              // Trigger password prompt to initialize key service
              showPasswordPrompt();
              // The key service initialization will be handled in the next effect render
              // when keyManagementService.isInitialized() becomes true
            }
            
            return {
              id: docId,
              name: displayName,
              type: documentData.type || 'pdf',
              projectId: documentData.project_id,
              isEncrypted: true,
              originalName: documentData.name
            };
          } catch (error) {
            console.error(`Failed to fetch document ${docId}:`, error);
            return {
              id: docId,
              name: `Document ${docId.substring(0, 6)}`,
              type: 'unknown',
              projectId: 'unknown',
              isEncrypted: false,
              originalName: `Document ${docId.substring(0, 6)}`
            };
          }
        });
        
        const documents = await Promise.all(documentPromises);
        
        // Group documents by project
        documents.forEach(doc => {
          if (doc.projectId && projectMap[doc.projectId]) {
            projectMap[doc.projectId].documents.push(doc);
          }
        });
        
        setDocumentsByProject(projectMap);
      } catch (error) {
        console.error("Error fetching document details:", error);
      } finally {
        setIsDecrypting(false);
      }
    };
    
    fetchDocumentDetails();
  }, [chatState.selectedProjectIds, chatState.selectedDocumentIds, showPasswordPrompt]);
  
  // Handle re-decryption when key management service becomes available
  useEffect(() => {
    // Re-decrypt document names if there are encrypted documents and key management is initialized
    if (keyManagementService.isInitialized() && Object.values(documentsByProject).some(
      project => project.documents.some(doc => doc.isEncrypted)
    )) {
      const updateEncryptedNames = async () => {
        const updatedProjects = {...documentsByProject};
        let hasUpdates = false;
        
        for (const projectId in updatedProjects) {
          for (let i = 0; i < updatedProjects[projectId].documents.length; i++) {
            const doc = updatedProjects[projectId].documents[i];
            if (doc.isEncrypted) {
              try {
                const decryptedName = await keyManagementService.decryptMetadata(doc.originalName);
                if (decryptedName !== doc.name) {
                  updatedProjects[projectId].documents[i] = {
                    ...doc,
                    name: decryptedName
                  };
                  hasUpdates = true;
                }
              } catch (error) {
                console.error(`Failed to decrypt document ${doc.id} name:`, error);
              }
            }
          }
        }
        
        if (hasUpdates) {
          setDocumentsByProject(updatedProjects);
        }
      };
      
      updateEncryptedNames();
    }
  }, [documentsByProject, keyManagementService.isInitialized()]);
  
  // Get document type icon
  const getDocumentTypeIcon = (type: string, isEncrypted: boolean) => {
    switch (type) {
      case 'pdf':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'website':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
          </svg>
        );
      case 'youtube':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        );
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        );
    }
  };
  
  // Expand/collapse project sections
  const [expandedProjects, setExpandedProjects] = useState<{[key: string]: boolean}>({});
  
  const toggleProjectExpanded = (projectId: string) => {
    setExpandedProjects(prev => ({
      ...prev,
      [projectId]: !prev[projectId]
    }));
  };
  
  // Initialize all projects as expanded
  useEffect(() => {
    const initialExpanded: {[key: string]: boolean} = {};
    Object.keys(documentsByProject).forEach(projectId => {
      initialExpanded[projectId] = true;
    });
    setExpandedProjects(initialExpanded);
  }, [Object.keys(documentsByProject).join(',')]);
  
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h2 className="font-semibold text-lg">Selected Documents</h2>
        <p className="text-sm text-gray-500">
          {Object.values(documentsByProject).reduce(
            (total, project) => total + project.documents.length, 
            0
          )} documents from {Object.keys(documentsByProject).length} projects
        </p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        {isDecrypting && (
          <div className="flex justify-center items-center py-4">
            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500"></div>
            <span className="ml-2 text-sm text-gray-600">Loading documents...</span>
          </div>
        )}
        
        {!isDecrypting && Object.keys(documentsByProject).length === 0 && (
          <div className="text-center py-6 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No documents selected</p>
          </div>
        )}
        
        {!isDecrypting && Object.entries(documentsByProject).map(([projectId, project]) => (
          <div key={projectId} className="mb-6">
            <div 
              onClick={() => toggleProjectExpanded(projectId)}
              className="flex items-center justify-between cursor-pointer bg-gray-50 p-2 rounded"
            >
              <h3 className="font-medium">{project.projectName}</h3>
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className={`h-4 w-4 transition-transform duration-200 ${
                  expandedProjects[projectId] ? 'transform rotate-180' : ''
                }`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            
            {expandedProjects[projectId] && (
              <div className="mt-2 space-y-2 pl-2">
                {project.documents.map(doc => (
                  <div key={doc.id} className="flex items-center p-2 rounded hover:bg-gray-50">
                    {getDocumentTypeIcon(doc.type, doc.isEncrypted)}
                    <span className="text-sm truncate">{doc.name}</span>
                    
                    {doc.isEncrypted && (
                      <span className="ml-2 px-1.5 py-0.5 bg-purple-100 text-purple-800 text-xs rounded-full">
                        Encrypted
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}