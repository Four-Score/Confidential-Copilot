import { useState, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import { ProcessingProgressEvent } from '@/lib/processingUtils';
import { processDocument, processWebsite, DocumentProcessingOptions, ProcessingResult, WebsiteProcessingOptions, WebsiteProcessingResult } from '@/lib/clientProcessing';
import { processYoutubeTranscript, YoutubeProcessingOptions, YoutubeProcessingResult } from '@/lib/clientProcessing';
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
  
  const processWebsiteUrl = useCallback(
    async (
      projectId: string,
      url: string,
      options?: WebsiteProcessingOptions
    ): Promise<WebsiteProcessingResult> => {
      setIsProcessing(true);
      setProgress(0);
      setStatus('Initializing website processing');
      setError(null);
      
      try {
        // Enhance options with progress tracking
        const enhancedOptions: WebsiteProcessingOptions = {
          ...options,
          onProgress: (event: ProcessingProgressEvent) => {
            setProgress(event.progress);
            setStatus(event.currentStep || null);
            
            // Forward the progress event to the original callback if provided
            options?.onProgress?.(event);
          }
        };
        
        // Call the processWebsite function (note: no symmetricKey needed)
        const result = await processWebsite(
          projectId,
          url,
          enhancedOptions
        );
        
        if (!result.success) {
          setError(result.error || 'Website processing failed');
        }
        
        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        
        return {
          websiteId: '',
          success: false,
          error: errorMessage
        };
      } finally {
        setIsProcessing(false);
      }
    },
    [] // No dependencies since we don't need symmetricKey for websites
  );

  const processYoutubeTranscriptHandler = useCallback(
    async (
      projectId: string,
      transcript: string,
      videoId: string,
      videoUrl: string,
      title?: string,
      options?: YoutubeProcessingOptions
    ): Promise<YoutubeProcessingResult> => {
      setIsProcessing(true);
      setProgress(0);
      setStatus('Initializing YouTube processing');
      setError(null);

      try {
        const enhancedOptions: YoutubeProcessingOptions = {
          ...options,
          onProgress: (event: ProcessingProgressEvent) => {
            setProgress(event.progress);
            setStatus(event.currentStep || null);
            options?.onProgress?.(event);
          }
        };

        const result = await processYoutubeTranscript(
          projectId,
          transcript,
          videoId,
          videoUrl,
          title,
          enhancedOptions
        );

        if (!result.success) {
          setError(result.error || 'YouTube processing failed');
        }

        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);

        return {
          youtubeId: '',
          success: false,
          error: errorMessage
        };
      } finally {
        setIsProcessing(false);
      }
    },
    []
  );

  return {
    processFile,
    processWebsiteUrl,
    processYoutubeTranscript: processYoutubeTranscriptHandler,
    isProcessing,
    progress,
    status,
    error,
    reset: useCallback(() => {
      setIsProcessing(false);
      setProgress(0);
      setStatus(null);
      setError(null);
    }, [])
  };
}