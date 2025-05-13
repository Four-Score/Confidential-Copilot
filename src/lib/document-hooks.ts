// src/lib/document-hooks.ts
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { DocumentType, Project } from '@/lib/types';

// Hook for document generation
export function useDocumentGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationError, setGenerationError] = useState<string | null>(null);
  
  const generateDocument = useCallback(async ({
    templateName,
    templatePurpose,
    details,
    referencedDocumentIds = [],
    stream = false,
  }: {
    templateName: string;
    templatePurpose: string;
    details: string;
    referencedDocumentIds?: string[];
    stream?: boolean;
  }) => {
    setIsGenerating(true);
    setGenerationProgress(0);
    setGenerationError(null);
    
    const progressIntervals = [15, 30, 45, 60, 75, 90, 95];
    const progressTimer = setInterval(() => {
      setGenerationProgress(prev => {
        const nextProgress = progressIntervals.find(p => p > prev);
        return nextProgress || prev;
      });
    }, 1000);
    
    try {
      console.log("Initiating document generation with vector database retrieval...");
      
      const response = await fetch('/api/document/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateName,
          templatePurpose,
          details,
          referencedDocumentIds,
          stream,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate document');
      }
            if (stream) {
        clearInterval(progressTimer);
        setGenerationProgress(100);
        return response;
      } else {
        const data = await response.json();
        clearInterval(progressTimer);
        setGenerationProgress(100);
        return data.content;
      }
    } catch (error: any) {
      console.error('Document generation error:', error);
      setGenerationError(error.message);
      throw error;
    } finally {
      setIsGenerating(false);
      clearInterval(progressTimer);
    }
  }, []);
  
  return {
    generateDocument,
    isGenerating,
    generationProgress,
    generationError,
  };
}

// Hook for document ingestion
export function useDocumentIngestion() {
  const [isIngesting, setIsIngesting] = useState(false);
  const [ingestionProgress, setIngestionProgress] = useState(0);
  const [ingestionError, setIngestionError] = useState<string | null>(null);
  
  const ingestDocument = useCallback(async ({
    text,
    title,
    documentId,
    documentType,
    projectId,
    metadata = {},
  }: {
    text: string;
    title: string;
    documentId?: string;
    documentType?: string;
    projectId?: string;
    metadata?: Record<string, any>;
  }) => {
    setIsIngesting(true);
    setIngestionProgress(0);
    setIngestionError(null);
    const progressInterval = setInterval(() => {
      setIngestionProgress(prev => (prev >= 90 ? 90 : prev + 10));
    }, 500);
    
    try {
      console.log(`Ingesting document "${title}" into vector database...`);
      
      const response = await fetch('/api/document/ingest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          title,
          documentId,
          documentType,
          projectId,
          metadata,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to ingest document');
      }
      
      const result = await response.json();
      console.log(`Document successfully ingested with ${result.stats.chunkCount} chunks`);
      
      setIngestionProgress(100);
      return result;
    } catch (error: any) {
      console.error('Document ingestion error:', error);
      setIngestionError(error.message);
      throw error;
    } finally {
      setIsIngesting(false);
      clearInterval(progressInterval);
    }
  }, []);
  
  return {
    ingestDocument,
    isIngesting,
    ingestionProgress,
    ingestionError,
  };
}

// Hook for document management //TODO Adjust with projects
export function useDocumentManagement() {
  const router = useRouter();
  const [documents, setDocuments] = useState<DocumentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const projects: Project[] = [
    { id: "all", name: "All Projects" },
    { id: "project1", name: "Marketing Campaign" },
    { id: "project2", name: "Product Launch" },
    { id: "project3", name: "Research Initiative" },
  ];
  
  const fetchDocuments = useCallback(async (projectId?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log("Fetching documents from vector store...");
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const sampleDocuments: DocumentType[] = [
        {
            id: "doc1",
            title: "Q2 Marketing Strategy",
            template: "Marketing Plan",
            content: "<p>This is the content of the marketing plan...</p>",
            createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
            pages: 4,
            projectId: "project1",
            type: "generated",
            size: "245 KB",
        },
        {
            id: "doc2",
            title: "Product Release Notes",
            template: "Product Documentation",
            content: "<p>Release notes for the new product version...</p>",
            createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
            pages: 2,
            projectId: "project2",
            type: "generated",
            size: "125 KB",
        },
        {
            id: "doc3",
            title: "Research Findings",
            template: "Research Report",
            content: "<p>Key findings from the research study...</p>",
            createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
            pages: 7,
            projectId: "project3",
            type: "generated",
            size: "510 KB",
        },
        {
            id: "doc4",
            title: "Social Media Campaign",
            template: "Campaign Brief",
            content: "<p>Details of the upcoming social media campaign...</p>",
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            pages: 3,
            projectId: "project1",
            type: "generated",
            size: "180 KB",
        },
      ];
      
      const filteredDocs = projectId && projectId !== "all"
        ? sampleDocuments.filter(doc => doc.projectId === projectId)
        : sampleDocuments;
      
      setDocuments(filteredDocs);
    } catch (error: any) {
      console.error("Error fetching documents:", error);
      setError(error.message || "Failed to fetch documents");
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);
  
  const createDocument = useCallback((document: DocumentType) => {
    setDocuments(prev => [document, ...prev]);
    return document;
  }, []);
  
  const updateDocument = useCallback((updatedDocument: DocumentType) => {
    setDocuments(prev => 
      prev.map(doc => doc.id === updatedDocument.id ? updatedDocument : doc)
    );
    return updatedDocument;
  }, []);
  
  const deleteDocument = useCallback(async (documentId: string) => {
    try {
      console.log(`Deleting document ${documentId} from vector store...`);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setDocuments(prev => prev.filter(doc => doc.id !== documentId));
      return true;
    } catch (error: any) {
      console.error("Error deleting document:", error);
      setError(error.message || "Failed to delete document");
      return false;
    }
  }, []);
  
  const navigateToEditor = useCallback((documentId: string) => {
    router.push(`/document/${documentId}`);
  }, [router]);
  
  return {
    documents,
    projects,
    loading,
    error,
    fetchDocuments,
    createDocument,
    updateDocument,
    deleteDocument,
    navigateToEditor,
  };
}