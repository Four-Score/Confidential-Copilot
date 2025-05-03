import { v4 as uuidv4 } from 'uuid';
import { processPdfFile, DocumentChunk } from './pdfUtils';
import { generateBatchEmbeddings, ChunkWithEmbedding } from './embeddingUtils';
import { encryptText, encryptMetadata, encryptVector } from '@/services/keyManagement';

/**
 * Status type for document processing
 */
export type ProcessingStatus = 
  | 'initialized'
  | 'validating'
  | 'storing'
  | 'extracting'
  | 'chunking'
  | 'embedding'
  | 'encrypting'
  | 'uploading'
  | 'completed'
  | 'error'
  | 'cancelled';

/**
 * Progress event type for processing updates
 */
export interface ProcessingProgressEvent {
  jobId: string;
  status: ProcessingStatus;
  progress: number;
  currentStep?: string;
  error?: string;
}

/**
 * Type for the processing options
 */
export interface ProcessingOptions {
  chunkSize?: number;
  chunkOverlap?: number;
  batchSize?: number;
  onProgress?: (event: ProcessingProgressEvent) => void;
  cancelSignal?: AbortSignal;
}

/**
 * Initiates a document processing job on the server
 */
export async function initiateProcessingJob(
  projectId: string,
  fileName: string,
  fileSize: number,
  fileType: string,
  estimatedChunks: number
): Promise<{ jobId: string }> {
  const response = await fetch('/api/processing/start', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      projectId,
      fileName,
      fileSize,
      fileType,
      estimatedChunks,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to start processing job');
  }

  const data = await response.json();
  return { jobId: data.jobId };
}

/**
 * Updates the progress of a processing job
 * @param jobId - The ID of the processing job
 * @param progress - The progress value (0-100)
 * @param status - The current status
 * @param currentStep - Optional current step description
 * @param contentType - The type of content being processed
 */
export async function updateProcessingProgress(
  jobId: string,
  progress: number,
  status: string,
  currentStep?: string,
  contentType: 'document' | 'website' = 'document'
): Promise<void> {
  const response = await fetch('/api/documents/progress', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      uploadId: jobId,
      progress,
      status,
      error: currentStep,
      contentType
    }),
  });

  if (!response.ok) {
    console.error('Failed to update processing progress:', await response.json());
  }
}

/**
 * Gets the current status of a processing job
 */
export async function getProcessingStatus(
  jobId: string
): Promise<{ progress: number; status: string; error?: string }> {
  const response = await fetch(`/api/processing/status/${jobId}`);

  if (!response.ok) {
    throw new Error('Failed to get processing status');
  }

  return response.json();
}

/**
 * Cancels a processing job
 */
export async function cancelProcessingJob(jobId: string): Promise<boolean> {
  const response = await fetch(`/api/processing/cancel/${jobId}`, {
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error('Failed to cancel processing job');
  }

  const data = await response.json();
  return data.success;
}

/**
 * Processes a PDF document on the client side
 * This handles all steps: extraction, chunking, embedding, encrypting, and uploading
 */
export async function processPdfDocument(
  projectId: string,
  file: File,
  symmetricKey: CryptoKey,
  options: ProcessingOptions = {}
): Promise<{ documentId: string }> {
  // Generate a job ID
  const jobId = uuidv4();
  
  // Set default options
  const {
    chunkSize,
    chunkOverlap,
    batchSize = 10,
    onProgress,
    cancelSignal,
  } = options;
  
  try {
    // Report initial status
    onProgress?.({
      jobId,
      status: 'initialized',
      progress: 0,
      currentStep: 'Initializing processing',
    });
    
    // Register the job with the server
    await initiateProcessingJob(
      projectId,
      file.name,
      file.size,
      file.type,
      Math.ceil(file.size / 1000) // Rough estimate of chunks
    );
    
    // Update progress
    await updateProcessingProgress(jobId, 0, 'initialized');
    
    // Check for cancellation
    if (cancelSignal?.aborted) {
      await updateProcessingProgress(jobId, 0, 'cancelled', 'Operation cancelled by user');
      throw new Error('Operation cancelled by user');
    }
    
    // Step 1: Extract text and metadata from PDF
    onProgress?.({
      jobId,
      status: 'extracting',
      progress: 10,
      currentStep: 'Extracting text from PDF',
    });
    await updateProcessingProgress(jobId, 10, 'extracting');
    
    const pdfResult = await processPdfFile(file);
    
    if (!pdfResult.valid || !pdfResult.chunks || !pdfResult.metadata) {
      const error = pdfResult.error || 'Failed to process PDF';
      await updateProcessingProgress(jobId, 0, 'error', error);
      throw new Error(error);
    }
    
    // Check for cancellation
    if (cancelSignal?.aborted) {
      await updateProcessingProgress(jobId, 0, 'cancelled', 'Operation cancelled by user');
      throw new Error('Operation cancelled by user');
    }
    
    // Step 2: Generate embeddings for chunks
    onProgress?.({
      jobId,
      status: 'embedding',
      progress: 30,
      currentStep: 'Generating vector embeddings',
    });
    await updateProcessingProgress(jobId, 30, 'embedding');
    
    const embeddingsWithProgress = await generateBatchEmbeddings(
      pdfResult.chunks,
      batchSize,
      (embeddingProgress) => {
        const overallProgress = 30 + (embeddingProgress * 0.3);
        onProgress?.({
          jobId,
          status: 'embedding',
          progress: overallProgress,
          currentStep: `Generating embeddings (${embeddingProgress}%)`,
        });
        updateProcessingProgress(jobId, overallProgress, 'embedding').catch(console.error);
      }
    );
    
    // Check for cancellation
    if (cancelSignal?.aborted) {
      await updateProcessingProgress(jobId, 0, 'cancelled', 'Operation cancelled by user');
      throw new Error('Operation cancelled by user');
    }
    
    // Step 3: Encrypt document content and metadata
    onProgress?.({
      jobId,
      status: 'encrypting',
      progress: 60,
      currentStep: 'Encrypting document contents and metadata',
    });
    await updateProcessingProgress(jobId, 60, 'encrypting');
    
    // Encrypt document name and metadata
    const encryptedName = await encryptMetadata(file.name, symmetricKey);
    
    // Prepare metadata
    const metadataObj = {
      originalName: file.name,
      pageCount: pdfResult.metadata.pageCount,
      uploadDate: new Date().toISOString()
    };
    
    // Encrypt individual metadata fields
    const encryptedMetadata = {
      originalName: await encryptMetadata(metadataObj.originalName, symmetricKey),
      pageCount: metadataObj.pageCount, // Not sensitive, can be left as-is
      uploadDate: metadataObj.uploadDate, // Not sensitive, can be left as-is
    };
    
    // Encrypt full document content
    const fullText = pdfResult.chunks.map(chunk => chunk.content).join(' ');
    const encryptedContent = await encryptText(fullText, symmetricKey);
    
    // Encrypt each chunk and its embedding
    const encryptedChunks = await Promise.all(embeddingsWithProgress.map(async (item, index) => {
      // Report progress for large documents
      if (index % 10 === 0) {
        const chunkProgress = 60 + ((index / embeddingsWithProgress.length) * 20);
        onProgress?.({
          jobId,
          status: 'encrypting',
          progress: chunkProgress,
          currentStep: `Encrypting chunk ${index + 1}/${embeddingsWithProgress.length}`,
        });
        await updateProcessingProgress(jobId, chunkProgress, 'encrypting');
      }
      
      // Check for cancellation during long operations
      if (cancelSignal?.aborted) {
        throw new Error('Operation cancelled by user');
      }
      
      return {
        chunkNumber: index + 1,
        encryptedContent: await encryptText(item.chunk.content, symmetricKey),
        encryptedEmbeddings: await encryptVector(item.embedding, symmetricKey),
        metadata: {
          chunkNumber: index + 1,
          pageNumber: item.chunk.metadata.pageNumber || 1
        }
      };
    }));
    
    // Check for cancellation
    if (cancelSignal?.aborted) {
      await updateProcessingProgress(jobId, 0, 'cancelled', 'Operation cancelled by user');
      throw new Error('Operation cancelled by user');
    }
    
    // Step 4: Upload to server
    onProgress?.({
      jobId,
      status: 'uploading',
      progress: 80,
      currentStep: 'Uploading encrypted document',
    });
    await updateProcessingProgress(jobId, 80, 'uploading');
    
    // Prepare upload payload
    const uploadPayload = {
      name: encryptedName,
      originalName: encryptedMetadata.originalName,
      type: 'pdf',
      fileSize: file.size,
      pageCount: encryptedMetadata.pageCount,
      encryptedContent: encryptedContent,
      encryptedMetadata: encryptedMetadata,
      chunks: encryptedChunks
    };
    
    // Upload to server
    const uploadResponse = await fetch(`/api/projects/${projectId}/documents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(uploadPayload),
    });
    
    if (!uploadResponse.ok) {
      const error = await uploadResponse.json();
      await updateProcessingProgress(
        jobId, 
        0, 
        'error', 
        error.error || 'Failed to upload document'
      );
      throw new Error(error.error || 'Failed to upload document');
    }
    
    const uploadResult = await uploadResponse.json();
    
    // Update final status
    onProgress?.({
      jobId,
      status: 'completed',
      progress: 100,
      currentStep: 'Processing complete',
    });
    await updateProcessingProgress(jobId, 100, 'completed');
    
    return { documentId: uploadResult.documentId };
    
  } catch (error) {
    // If not already handled (like cancellation)
    if ((error as Error).message !== 'Operation cancelled by user') {
      console.error('Error processing document:', error);
      const errorMessage = (error as Error).message || 'Unknown error during processing';
      
      onProgress?.({
        jobId,
        status: 'error',
        progress: 0,
        currentStep: 'Processing failed',
        error: errorMessage,
      });
      
      await updateProcessingProgress(jobId, 0, 'error', errorMessage);
    }
    
    throw error;
  }
}