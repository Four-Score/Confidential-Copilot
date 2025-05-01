'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import ProjectHeader from '@/components/projects/ProjectHeader';
import DocumentList from '@/components/documents/DocumentList';
import DocumentUploader from '@/components/documents/DocumentUploader';
import { Project } from '@/types/project';
import { Document } from '@/types/document';
import { useEncryptionService } from '@/lib/encryptionUtils';

export default function ProjectPage() {
  const params = useParams();
  const projectId = params.id as string;
  
  const [project, setProject] = useState<Project | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Get encryption service
  const { service: encryptionService, isLoading: isEncryptionLoading } = useEncryptionService();
  
  // Fetch project and documents when component mounts
  useEffect(() => {
    async function fetchProjectData() {
      setIsLoading(true);
      setError(null);
      
      try {
        const projectResponse = await fetch(`/api/projects/${projectId}`);
        
        if (!projectResponse.ok) {
          const errorData = await projectResponse.json();
          throw new Error(errorData.error || 'Failed to fetch project');
        }
        
        const projectData = await projectResponse.json();
        setProject(projectData);
        
        // Fetch documents for this project
        const documentsResponse = await fetch(`/api/projects/${projectId}/documents`);
        
        if (!documentsResponse.ok) {
          const errorData = await documentsResponse.json();
          throw new Error(errorData.error || 'Failed to fetch documents');
        }
        
        const documentsData = await documentsResponse.json();
        
        // Decrypt document names if encryption service is available
        let decryptedDocuments = documentsData;
        
        if (encryptionService && Array.isArray(documentsData)) {
          decryptedDocuments = documentsData.map(doc => ({
            ...doc,
            name: encryptionService.decryptMetadata(doc.name)
          }));
        }
        
        setDocuments(Array.isArray(decryptedDocuments) ? decryptedDocuments : []);
      } catch (err) {
        console.error('Error fetching project data:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    }
    
    if (projectId) {
      fetchProjectData();
    }
  }, [projectId, encryptionService]);

  // Handle document upload completion
  const handleDocumentUpload = (newDocument: Document) => {
    // Decrypt the new document's name if encryption service is available
    if (encryptionService) {
      newDocument = {
        ...newDocument,
        name: encryptionService.decryptMetadata(newDocument.name)
      };
    }
    setDocuments([newDocument, ...documents]);
  };
  
  // Handle document upload cancellation
  const handleUploadCancel = () => {
    // Logic for when upload is canceled
    console.log('Upload canceled');
  };

  // Handle document deletion
  const handleDeleteDocument = async (documentId: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/documents/${documentId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete document');
      }
      
      setDocuments(documents.filter(doc => doc.id !== documentId));
      return { success: true };
    } catch (err) {
      console.error('Error deleting document:', err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'An unknown error occurred' 
      };
    }
  };

  if (isLoading || isEncryptionLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline"> {error || 'Project not found'}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <ProjectHeader project={project} />
      
      <div className="mb-8">
        <DocumentUploader 
          projectId={projectId} 
          onUploadComplete={handleDocumentUpload} 
          onCancel={handleUploadCancel} 
        />
      </div>
      
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Documents</h2>
      
      {documents.length > 0 ? (
        <DocumentList documents={documents} onDelete={handleDeleteDocument} />
      ) : (
        <div className="bg-gray-50 rounded-lg p-6 text-center">
          <p className="text-gray-500">No documents have been uploaded to this project yet.</p>
          <p className="text-gray-500 mt-2">Use the uploader above to add your first document.</p>
        </div>
      )}
    </div>
  );
}