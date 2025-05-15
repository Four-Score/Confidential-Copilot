'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import ProjectHeader from '@/components/projects/ProjectHeader';
import DocumentList from '@/components/documents/DocumentList';
import DocumentUploader from '@/components/documents/DocumentUploader';
import WebsiteUrlInput from '@/components/website/WebsiteUrlInput';
import WebsitePreview from '@/components/website/WebsitePreview';
import YoutubeUrlInput from '@/components/youtube/YoutubeUrlInput';
import { Project } from '@/types/project';
import { Document, UnencryptedDocument } from '@/types/document';
import { useKeyManagement } from '@/services/keyManagement';
import { useDocumentProcessor } from '@/hooks/useDocumentProcessor';
import YoutubePreview from '@/components/youtube/YoutubePreview';
// Add this helper function at the top (inside or outside your component)
async function fetchWithRetry(url: string, options: RequestInit = {}, retries: number = 3, delay: number = 500) {
  for (let i = 0; i < retries; i++) {
    const res = await fetch(url, options);
    if (res.ok) return await res.json();
    if (res.status !== 404 || i === retries - 1) throw new Error('Failed to fetch new YouTube document');
    await new Promise(r => setTimeout(r, delay));
  }
}

export default function ProjectPage() {
  const params = useParams();
  const projectId = params.id as string;
  
  const [project, setProject] = useState<Project | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [websites, setWebsites] = useState<UnencryptedDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUploader, setShowUploader] = useState(false);
  const [showWebsiteInput, setShowWebsiteInput] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [websiteSuccess, setWebsiteSuccess] = useState(false);
  const [uploadedDocument, setUploadedDocument] = useState<Document | null>(null);
  const [uploadedWebsite, setUploadedWebsite] = useState<UnencryptedDocument | null>(null);
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const [isMeetingMode, setIsMeetingMode] = useState(false);
  const [showYoutubeInput, setShowYoutubeInput] = useState(false);
  const [youtubeTranscript, setYoutubeTranscript] = useState<string | null>(null);
  const [youtubeVideoId, setYoutubeVideoId] = useState<string | null>(null);
  const [isYoutubeIngesting, setIsYoutubeIngesting] = useState(false);
  const [youtubeDocs, setYoutubeDocs] = useState<UnencryptedDocument[]>([]);
  const [youtubeSuccess, setYoutubeSuccess] = useState(false);
  const [uploadedYoutube, setUploadedYoutube] = useState<UnencryptedDocument | null>(null);
  const [youtubeInputError, setYoutubeInputError] = useState<string | null>(null);
  const router = useRouter();
  const [lastYoutubeUrl, setLastYoutubeUrl] = useState<string>('');
  const [youtubeVideoTitle, setYoutubeVideoTitle] = useState<string | null>(null);

  // Get encryption service
  const { 
    service: encryptionService, 
    isLoading: isEncryptionLoading,
    ensureInitialized 
  } = useKeyManagement();

  // Get document processor
  const { 
    processFile, 
    processWebsiteUrl, 
    processYoutubeTranscript,
    isProcessing,
    progress,
    status,
    error: processingError,
    reset 
  } = useDocumentProcessor();
  
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
        
        try {
          if (encryptionService && Array.isArray(documentsData)) {
            // Make sure KMS is initialized
            await ensureInitialized();
            
            // Now process all documents
            decryptedDocuments = await Promise.all(documentsData.map(async (doc) => {
              try {
                const decryptedName = await encryptionService.decryptMetadata(doc.name);
                return {
                  ...doc,
                  name: decryptedName || doc.name
                };
              } catch (error) {
                console.error('Failed to decrypt document name:', error);
                return doc;
              }
            }));
          }
        } catch (error) {
          console.error('Error during document name decryption:', error);
        }

        
        setDocuments(Array.isArray(decryptedDocuments) ? decryptedDocuments : []);
        
        // Fetch websites for this project
        try {
          const websitesResponse = await fetch(`/api/projects/${projectId}/websites`);
          
          if (websitesResponse.ok) {
            const websitesData = await websitesResponse.json();
            setWebsites(Array.isArray(websitesData.websites) ? websitesData.websites : []);
          }
        } catch (websiteError) {
          console.error('Error fetching websites:', websiteError);
          // Non-critical error, we can still continue
        }

        // Fetch YouTube docs for this project
        try {
          const youtubeResponse = await fetch(`/api/projects/${projectId}/youtube`);
          if (youtubeResponse.ok) {
            const youtubeData = await youtubeResponse.json();
            setYoutubeDocs(Array.isArray(youtubeData.youtube) ? youtubeData.youtube : []);
          }
        } catch (youtubeError) {
          console.error('Error fetching YouTube docs:', youtubeError);
          // Non-critical error, continue
        }
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
  const handleDocumentUpload = async (newDocument: Document) => {
    // Decrypt the new document's name if encryption service is available
    if (encryptionService) {
      try {
        await ensureInitialized();
        const decryptedName = await encryptionService.decryptMetadata(newDocument.name);
        newDocument = {
          ...newDocument,
          name: decryptedName || newDocument.name
        };
      } catch (error) {
        console.error('Error decrypting document name:', error);
      }
    }
    setUploadedDocument(newDocument);
    setUploadSuccess(true);
    setDocuments(prevDocs => [newDocument, ...prevDocs]);
  };

  // Handle website processing completion
  const handleWebsiteProcessed = async (websiteId: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/websites/${websiteId}`);
      
      if (!response.ok) {
        throw new Error('Failed to get website details after upload');
      }
      
      const websiteData = await response.json();
      setUploadedWebsite(websiteData);
      setWebsiteSuccess(true);
      setWebsites(prevSites => [websiteData, ...prevSites]);
    } catch (err) {
      console.error('Error getting website details:', err);
      setError('Failed to get website details');
    }
  };
  
  // Handle document upload cancellation
  const handleUploadCancel = () => {
    // Logic for when upload is canceled
    console.log('Upload canceled');
    setShowUploader(false);
  };

  // Handle website input cancellation
  const handleWebsiteInputCancel = () => {
    console.log('Website input canceled');
    setShowWebsiteInput(false);
    setCurrentUrl(null);
    reset(); // Reset the document processor state
  };

  // Handle URL submission
  const handleUrlSubmit = async (url: string) => {
    setCurrentUrl(url);
    
    try {
      const result = await processWebsiteUrl(projectId, url);
      
      if (result.success && result.websiteId) {
        await handleWebsiteProcessed(result.websiteId);
      } else {
        setError(result.error || 'Failed to process website');
      }
    } catch (err) {
      console.error('Error processing website:', err);
      setError(err instanceof Error ? err.message : 'Failed to process website');
    }
  };

  const handleYoutubeInputCancel = () => {
    // If on the input screen and the input is empty, go back to main project page
    if (showYoutubeInput && !lastYoutubeUrl) {
      setShowYoutubeInput(false);
      setYoutubeInputError(null);
      // Optionally clear other YouTube-related state here if needed
      return;
    }
    // If transcript or video is loaded, just reset YouTube input state
    setYoutubeTranscript(null);
    setYoutubeVideoId(null);
    setShowYoutubeInput(true);
    setYoutubeInputError(null);
  };

  const handleYoutubeUrlSubmit = async (url: string) => {
    setYoutubeInputError(null); // clear previous error
    try {
      const response = await fetch(`/api/projects/${projectId}/youtube-transcript`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ video_url: url }),
      });
      const data = await response.json();
      if (!response.ok) {
        if (
          data.error &&
          (data.error.includes('No transcript available') ||
           data.error.includes('Transcript is disabled'))
        ) {
          setYoutubeInputError('This YouTube video does not have a transcript available.');
        } else {
          setYoutubeInputError(data.error || 'Failed to fetch transcript');
        }
        return;
      }
      setYoutubeTranscript(data.transcript);
      setYoutubeVideoId(data.videoId);
      setYoutubeVideoTitle(data.videoTitle);
      setShowYoutubeInput(false);
    } catch (err) {
      setYoutubeInputError('Failed to fetch transcript');
    }
  };

  const handleYoutubeIngest = async () => {
    if (!youtubeVideoId || !youtubeTranscript) return;
    setIsYoutubeIngesting(true);
    try {
      const result = await processYoutubeTranscript(
        projectId,
        youtubeTranscript,
        youtubeVideoId,
        `https://www.youtube.com/watch?v=${youtubeVideoId}`,
        youtubeVideoTitle || `YouTube Video ${youtubeVideoId}` 
      );
      if (!result.success) {
        throw new Error(result.error || 'Failed to ingest YouTube data');
      }
      // Use the full document returned by the API
      const youtubeDoc = result.youtubeDoc;
      setUploadedYoutube(youtubeDoc);
      setYoutubeSuccess(true);
      setYoutubeDocs(prev => [youtubeDoc, ...prev]);
      setYoutubeTranscript(null);
      setYoutubeVideoId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to ingest YouTube data');
    } finally {
      setIsYoutubeIngesting(false);
    }
  };

  const handleDeleteYoutube = async (youtubeId: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/youtube/${youtubeId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete YouTube video');
      }
      setYoutubeDocs(prev => prev.filter(doc => doc.id !== youtubeId));
      return { success: true };
    } catch (err) {
      console.error('Error deleting YouTube video:', err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'An unknown error occurred'
      };
    }
  };

  // Handle going back to project view after successful upload
  const handleBackToProject = () => {
    setShowUploader(false);
    setShowWebsiteInput(false);
    setUploadSuccess(false);
    setWebsiteSuccess(false);
    setYoutubeSuccess(false);
    setUploadedDocument(null);
    setUploadedWebsite(null);
    setUploadedYoutube(null);
    setCurrentUrl(null);
    reset();
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

  // Handle website deletion
  const handleDeleteWebsite = async (websiteId: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/websites/${websiteId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete website');
      }
      
      setWebsites(websites.filter(site => site.id !== websiteId));
      return { success: true };
    } catch (err) {
      console.error('Error deleting website:', err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'An unknown error occurred' 
      };
    }
  };

  // Function to render the data ingestion buttons
  const renderDataIngestionButtons = () => {
    return (
      <div className="bg-white shadow-lg rounded-xl p-8 mb-8 border border-gray-100">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Data to Your Project
        </h2>        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => {
              setIsMeetingMode(false);
              setShowUploader(true);
            }}
            className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 border border-blue-200 rounded-xl transition-all duration-300 transform hover:-translate-y-1 hover:shadow-md"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-blue-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-sm font-medium text-gray-800">PDF Documents</span>
            <span className="text-xs text-gray-500 text-center mt-1">Upload your PDFs securely</span>
          </button>
          
          <button
            onClick={() => setShowWebsiteInput(true)}
            className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 border border-purple-200 rounded-xl transition-all duration-300 transform hover:-translate-y-1 hover:shadow-md"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-purple-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9-3-9m-9 9a9 9 0 019-9" />
            </svg>
            <span className="text-sm font-medium text-gray-800">Website Content</span>
            <span className="text-xs text-gray-500 text-center mt-1">Import website data</span>
          </button>
          
          <button
            onClick={() => setShowYoutubeInput(true)}
            className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 border border-green-200 rounded-xl transition-all duration-300 transform hover:-translate-y-1 hover:shadow-md"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span className="text-sm font-medium text-gray-800">YouTube Content</span>
            <span className="text-xs text-gray-500 text-center mt-1">Import videos securely</span>
          </button>
          
          <button
            className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 hover:from-yellow-100 hover:to-yellow-200 border border-yellow-200 rounded-xl transition-all duration-300 transform hover:-translate-y-1 hover:shadow-md"
            onClick={() => {
              setIsMeetingMode(true);
              setShowUploader(true);
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-yellow-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
            </svg>
            <span className="text-sm font-medium text-gray-800">Meeting Transcripts</span>
            <span className="text-xs text-gray-500 text-center mt-1">Import meeting data (.txt allowed)</span>
          </button>
        </div>
      </div>
    );
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

  // Show website URL input if the website button was clicked
  if (showWebsiteInput) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ProjectHeader project={project} />
        
        {websiteSuccess ? (
          <div className="bg-white shadow-lg rounded-lg p-6 mb-8">
            <div className="text-center py-6">
              <div className="mb-4">
                <svg className="mx-auto h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Website Content Added Successfully!
              </h3>
              <p className="text-gray-600 mb-6">
                {uploadedWebsite?.name || "Website content"} has been processed and added to your project.
              </p>
              <button
                onClick={handleBackToProject}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Back to Project
              </button>
            </div>
          </div>
        ) : (
          <div className="mb-8">
            {currentUrl && !isProcessing ? (
              <div className="mb-4">
                <WebsitePreview url={currentUrl} />
              </div>
            ) : null}
            <WebsiteUrlInput
              onUrlSubmit={handleUrlSubmit}
              onCancel={handleWebsiteInputCancel}
              isLoading={isProcessing}
              progress={progress}
              currentStep={status}
              error={processingError}
            />
          </div>
        )}
      </div>
    );
  }

  // Show YouTube URL input if the YouTube button was clicked
  if (showYoutubeInput) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ProjectHeader project={project} />
        <div className="mb-8">
          <YoutubeUrlInput
            onUrlSubmit={handleYoutubeUrlSubmit}
            onCancel={handleYoutubeInputCancel}
            isLoading={isProcessing}
            progress={progress}
            currentStep={status}
            error={youtubeInputError}
          />
        </div>
      </div>
    );
  }

  // Show YouTube transcript and video preview if available
  if (youtubeTranscript && youtubeVideoId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ProjectHeader project={project} />
        <div className="mb-8">
          <YoutubePreview
            videoId={youtubeVideoId}
            transcript={youtubeTranscript}
            onBack={handleYoutubeInputCancel} 
            onConfirm={handleYoutubeIngest}
            isProcessing={isYoutubeIngesting || isProcessing}
            progress={progress}
            status={status}
            error={processingError}
          />
        </div>
      </div>
    );
  }

  // Show success message for YouTube ingestion
  if (youtubeSuccess) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ProjectHeader project={project} />
        <div className="bg-white shadow-lg rounded-lg p-6 mb-8">
          <div className="text-center py-6">
            <div className="mb-4">
              <svg className="mx-auto h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              YouTube Video Ingested Successfully!
            </h3>
            <p className="text-gray-600 mb-6">
              {uploadedYoutube?.metadata?.title || "YouTube video"} has been processed and added to your project.
            </p>
            <button
              onClick={() => {
                setYoutubeSuccess(false);
                setUploadedYoutube(null);
                handleBackToProject();
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Back to Project
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show document uploader if the upload button was clicked
  if (showUploader) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ProjectHeader project={project} />
        
        {uploadSuccess ? (
          <div className="bg-white shadow-lg rounded-lg p-6 mb-8">
            <div className="text-center py-6">
              <div className="mb-4">
                <svg className="mx-auto h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Document Uploaded Successfully!
              </h3>
              <p className="text-gray-600 mb-6">
                Your document "{uploadedDocument?.name}" has been securely processed and added to your project.
              </p>
              <button
                onClick={handleBackToProject}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Back to Project
              </button>
            </div>
          </div>
        ) : (
          <div className="mb-8">
            <DocumentUploader 
              projectId={projectId} 
              onUploadComplete={handleDocumentUpload} 
              onCancel={handleUploadCancel} 
              isMeetingMode={isMeetingMode}
            />
          </div>
        )}
      </div>
    );
  }

  // Combine documents and websites for display
  const allDocuments = [...documents, ...websites,...youtubeDocs];
  
  // Normal project page view with data ingestion buttons and document list
  return (
    <div className="container mx-auto px-4 py-8">
      <ProjectHeader project={project} />
      
      {/* Data Ingestion Section */}
      {renderDataIngestionButtons()}
      
      {/* Documents Section */}
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Documents & Websites</h2>
      
      {allDocuments.length > 0 ? (
        <DocumentList 
          documents={allDocuments} 
          onDelete={handleDeleteDocument}
          onWebsiteDelete={handleDeleteWebsite} 
          onYoutubeDelete={handleDeleteYoutube}
        />
      ) : (
        <div className="bg-gray-50 rounded-lg p-6 text-center">
          <p className="text-gray-500">No documents or websites have been added to this project yet.</p>
          <p className="text-gray-500 mt-2">Use the data ingestion options above to add your first document or website.</p>
        </div>
      )}
    </div>
  );
}