'use client';

import { useState, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useEncryptionService } from '@/lib/encryptionUtils';
import { Document } from '@/types/document';
import FileUploader from '@/components/uploads/FileUploader';
import PDFPreview from '@/components/uploads/PDFPreview';
import { useDocumentProcessor } from '@/hooks/useDocumentProcessor';

interface DocumentUploaderProps {
  projectId: string;
  onUploadComplete: (document: Document) => void;
  onCancel: () => void;
}

export default function DocumentUploader({ 
  projectId, 
  onUploadComplete, 
  onCancel 
}: DocumentUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const { service: encryptionService } = useEncryptionService();
  const { 
    processFile, 
    isProcessing, 
    progress, 
    status, 
    error, 
    reset 
  } = useDocumentProcessor();

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    reset();
  };

  const startUpload = async () => {
    if (!file || !encryptionService) {
      return;
    }
    
    // Create a new AbortController for this upload
    abortControllerRef.current = new AbortController();
    
    try {
      const result = await processFile(projectId, file, {
        abortSignal: abortControllerRef.current.signal
      });
      
      if (result.success && result.documentId) {
        // Get document details
        const response = await fetch(`/api/documents/${result.documentId}`);
        
        if (!response.ok) {
          throw new Error('Failed to get document details after upload');
        }
        
        const documentData = await response.json();
        
        // Decrypt the document name
        const document: Document = {
          ...documentData,
          name: encryptionService.decryptMetadata(documentData.name)
        };
        
        // Call the completion handler
        onUploadComplete(document);
      }
    } catch (err) {
      console.error('Error uploading document:', err);
      // Error state is already managed by the hook
    }
  };

  const handleCancelUpload = () => {
    if (isProcessing && abortControllerRef.current) {
      // Abort the current processing
      abortControllerRef.current.abort();
      reset();
    }
    
    onCancel();
  };

  return (
    <div className="bg-white shadow-lg rounded-lg p-6 mb-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Upload Document</h2>
        <button
          onClick={handleCancelUpload}
          className="text-gray-500 hover:text-gray-700"
          disabled={isProcessing}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <div className="space-y-6">
        <FileUploader
          onFileSelect={handleFileSelect}
          onCancel={handleCancelUpload}
          isLoading={isProcessing}
          progress={progress}
          currentStep={status || ''}
          error={error}
          acceptedFileTypes={['application/pdf']}
          dropzoneText="Drop your PDF here or click to browse"
        />
        
        {file && !isProcessing && (
          <>
            <PDFPreview file={file} height="h-72" className="mt-4" />
            
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={startUpload}
                className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Upload
              </button>
            </div>
          </>
        )}
        
        {isProcessing && (
          <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-md">
            <svg className="h-5 w-5 text-blue-400 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="text-sm text-blue-700">
                Your document is being securely encrypted and processed. All processing happens in your browser - no unencrypted data is sent to the server.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}