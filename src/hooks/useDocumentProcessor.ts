import { useState, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import { ProcessingProgressEvent } from '@/lib/processingUtils';
import { processDocument, DocumentProcessingOptions, ProcessingResult } from '@/lib/clientProcessing';

/**
 * Hook for document processing operations
 */
export function useDocumentProcessor() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const symmetricKey = useAuthStore((state) => state.decryptedSymmetricKey);
  
  const processFile = useCallback(
    async (
      projectId: string,
      file: File,
      options?: DocumentProcessingOptions
    ): Promise<ProcessingResult> => {
      if (!symmetricKey) {
        const result: ProcessingResult = {
          documentId: '',
          success: false,
          error: 'No encryption key available. Please log in again.'
        };
        
        setError(result.error || null);
        return result;
      }
      
      setIsProcessing(true);
      setProgress(0);
      setStatus('Initializing');
      setError(null);
      
      try {
        // Enhance options with progress tracking
        const enhancedOptions: DocumentProcessingOptions = {
          ...options,
          onProgress: (event: ProcessingProgressEvent) => {
            setProgress(event.progress);
            setStatus(event.currentStep || null);
            
            // Forward the progress event to the original callback if provided
            options?.onProgress?.(event);
          }
        };
        
        const result = await processDocument(
          projectId,
          file,
          symmetricKey,
          enhancedOptions
        );
        
        if (!result.success) {
          setError(result.error || 'Processing failed');
        }
        
        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        
        return {
          documentId: '',
          success: false,
          error: errorMessage
        };
      } finally {
        setIsProcessing(false);
      }
    },
    [symmetricKey]
  );
  
  return {
    processFile,
    isProcessing,
    progress,
    status,
    error,
    // Helper to reset state (useful when component unmounts or user starts a new upload)
    reset: useCallback(() => {
      setIsProcessing(false);
      setProgress(0);
      setStatus(null);
      setError(null);
    }, [])
  };
}