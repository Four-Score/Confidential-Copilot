'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useEncryptionService } from '@/lib/encryptionUtils';
import DocumentList from '@/components/documents/DocumentList';
import DocumentUploader from '@/components/documents/DocumentUploader';
import ProjectHeader from '@/components/projects/ProjectHeader';
import { Project } from '@/types/project';
import { Document } from '@/types/document';

export default function ProjectPage() {
  const params = useParams();
  const projectId = params?.id as string;
  
  const [project, setProject] = useState<Project | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated());
  const { service: encryptionService, isLoading: isEncryptionLoading } = useEncryptionService();

  // Fetch project details and documents
  useEffect(() => {
    if (!projectId || !isAuthenticated) return;
    
    async function fetchProjectData() {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch project details
        const projectResponse = await fetch(`/api/projects/${projectId}`);
        
        if (!projectResponse.ok) {
          const errorData = await projectResponse.json();
          throw new Error(errorData.error || 'Failed to fetch project details');
        }
        
        const projectData = await projectResponse.json();
        setProject(projectData.project);
        
        // Fetch project documents
        const documentsResponse = await fetch(`/api/projects/${projectId}/documents`);
        
        if (!documentsResponse.ok) {
          const errorData = await documentsResponse.json();
          throw new Error(errorData.error || 'Failed to fetch documents');
        }
        
        const documentsData = await documentsResponse.json();
        
        // If we have encryption service, decrypt document names
        if (encryptionService && documentsData.documents?.length > 0) {
          const decryptedDocuments = documentsData.documents.map((doc: any) => ({
            ...doc,
            name: encryptionService.decryptMetadata(doc.name)
          }));
          setDocuments(decryptedDocuments);
        } else {
          // Store encrypted documents, they will be decrypted when encryption service is ready
          setDocuments(documentsData.documents || []);
        }
      } catch (err) {
        console.error('Error fetching project data:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchProjectData();
  }, [projectId, isAuthenticated, encryptionService]);

  // Function to handle document upload completion
  const handleUploadComplete = (newDocument: Document) => {
    setDocuments(prevDocuments => [newDocument, ...prevDocuments]);
    setIsUploading(false);
  };

  // Function to handle document deletion
  const handleDeleteDocument = async (documentId: string) => {
    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete document');
      }
      
      // Remove document from state
      setDocuments(prevDocuments => 
        prevDocuments.filter(doc => doc.id !== documentId)
      );
      
      return { success: true };
    } catch (err) {
      console.error('Error deleting document:', err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to delete document' 
      };
    }
  };

  // Function to decrypt document names if needed
  useEffect(() => {
    if (encryptionService && documents.length > 0 && documents[0].name.startsWith('enc_')) {
      try {
        const decryptedDocuments = documents.map(doc => ({
          ...doc,
          name: encryptionService.decryptMetadata(doc.name)
        }));
        setDocuments(decryptedDocuments);
      } catch (error) {
        console.error('Error decrypting document names:', error);
      }
    }
  }, [encryptionService, documents]);

  if (isLoading || isEncryptionLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Project not found.</strong>
          <span className="block sm:inline"> The requested project could not be found or you don't have access to it.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <ProjectHeader 
        project={project} 
        onUploadClick={() => setIsUploading(true)} 
      />
      
      {isUploading && (
        <DocumentUploader 
          projectId={projectId}
          onUploadComplete={handleUploadComplete}
          onCancel={() => setIsUploading(false)}
        />
      )}
      
      <div className="mt-8">
        {documents.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <svg 
              className="mx-auto h-16 w-16 text-gray-400"
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="1.5" 
                d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
              />
            </svg>
            
            <h3 className="mt-4 text-xl font-medium text-gray-900">No documents yet</h3>
            
            <p className="mt-2 text-gray-600 max-w-md mx-auto">
              Upload your first document to get started. All files are securely encrypted before upload.
            </p>
            
            <div className="mt-6">
              <button
                onClick={() => setIsUploading(true)}
                className="inline-flex items-center px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition duration-200"
              >
                <svg 
                  className="-ml-1 mr-2 h-5 w-5" 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Upload Document
              </button>
            </div>
          </div>
        ) : (
          <DocumentList 
            documents={documents} 
            onDelete={handleDeleteDocument}
          />
        )}
      </div>
    </div>
  );
}