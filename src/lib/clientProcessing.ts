import { v4 as uuidv4 } from 'uuid';
import { 
  processPdfFile,
  validatePdfFile, 
  DocumentChunk, 
  PDFExtractionResult 
} from './pdfUtils';
import { generateBatchEmbeddings, ChunkWithEmbedding } from './embeddingUtils';
import { encryptText, encryptMetadata, encryptVector } from './encryptionUtils';
import { 
  initiateProcessingJob,
  updateProcessingProgress,
  ProcessingStatus, 
  ProcessingProgressEvent 
} from './processingUtils';
import { PDFProcessingConfig, getProcessingConfig } from './processingConfig';

/**
 * Result of document processing
 */
export interface ProcessingResult {
  documentId: string;
  success: boolean;
  error?: string;
  metadata?: {
    chunkCount: number;
    embeddingsGenerated: number;
    processingTimeMs: number;
  };
}

/**
 * Options for document processing
 */
export interface DocumentProcessingOptions {
  /**
   * Processing configuration overrides
   */
  config?: Partial<PDFProcessingConfig>;
  
  /**
   * Progress callback function
   */
  onProgress?: (event: ProcessingProgressEvent) => void;
  
  /**
   * Abort controller signal to cancel processing
   */
  abortSignal?: AbortSignal;
}

/**
 * Process document using client-side processing
 * This function orchestrates the entire processing pipeline:
 * 1. PDF extraction and validation
 * 2. Text chunking
 * 3. Embedding generation
 * 4. Encryption of content, metadata, and embeddings
 * 5. Upload to server
 */
export async function processDocument(
  projectId: string,
  file: File,
  symmetricKey: CryptoKey,
  options: DocumentProcessingOptions = {}
): Promise<ProcessingResult> {
  const startTime = performance.now();
  const jobId = uuidv4();
  const config = getProcessingConfig(options.config);
  const { onProgress, abortSignal } = options;
  
  try {
    // Initial validation
    const validationResult = validatePdfFile(file, config.maxFileSize);
    if (!validationResult.valid) {
      throw new Error(validationResult.error || 'Invalid file');
    }
    
    // Initialize job with server
    await initiateProcessingJob(
      projectId,
      file.name,
      file.size,
      file.type,
      Math.ceil(file.size / config.chunkSize) // Estimate chunk count
    );
    
    // Report initial progress
    const reportProgress = (
      status: ProcessingStatus,
      progress: number,
      currentStep?: string
    ) => {
      const progressEvent: ProcessingProgressEvent = {
        jobId,
        status,
        progress,
        currentStep: currentStep || '',
      };
      
      onProgress?.(progressEvent);
      return updateProcessingProgress(jobId, progress, status, currentStep);
    };
    
    await reportProgress('initialized', 0, 'Starting document processing');
    
    // Check for early cancellation
    if (abortSignal?.aborted) {
      await reportProgress('cancelled', 0, 'Operation cancelled by user');
      throw new Error('Operation cancelled by user');
    }
    
    // STEP 1: Extract text and metadata from PDF
    await reportProgress('extracting', 5, 'Extracting text from PDF');
    
    let extraction: PDFExtractionResult;
    try {
      extraction = await processPdfFile(file, {
        chunkSize: config.chunkSize,
        chunkOverlap: config.chunkOverlap
      });
      
      if (!extraction.valid || !extraction.chunks || !extraction.metadata) {
        throw new Error(extraction.error || 'Failed to process PDF');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'PDF extraction failed';
      await reportProgress('error', 0, errorMessage);
      throw error;
    }
    
    if (config.debug) {
      console.log('Extracted chunks:', extraction.chunks.length);
    }
    
    await reportProgress('chunking', 25, `Created ${extraction.chunks.length} text chunks`);
    
    // Check for cancellation after extraction
    if (abortSignal?.aborted) {
      await reportProgress('cancelled', 0, 'Operation cancelled by user');
      throw new Error('Operation cancelled by user');
    }
    
    // STEP 2: Generate embeddings
    await reportProgress('embedding', 30, 'Generating vector embeddings');
    
    let embeddingsWithProgress: ChunkWithEmbedding[];
    try {
      embeddingsWithProgress = await generateBatchEmbeddings(
        extraction.chunks,
        config.embeddingBatchSize,
        (embeddingProgress) => {
          const overallProgress = 30 + (embeddingProgress * 0.3);
          reportProgress(
            'embedding',
            overallProgress,
            `Generating embeddings (${Math.round(embeddingProgress)}%)`
          );
        }
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Embedding generation failed';
      await reportProgress('error', 0, errorMessage);
      throw error;
    }
    
    if (config.debug) {
      console.log('Generated embeddings:', embeddingsWithProgress.length);
    }
    
    // Check for cancellation after embedding
    if (abortSignal?.aborted) {
      await reportProgress('cancelled', 0, 'Operation cancelled by user');
      throw new Error('Operation cancelled by user');
    }
    
    // STEP 3: Encrypt content and metadata
    await reportProgress('encrypting', 65, 'Encrypting document contents and metadata');
    
    // Prepare metadata
    const metadataObj = {
      originalName: file.name,
      pageCount: extraction.metadata.pageCount || 1,
      created: new Date().toISOString(),
      fileType: file.type,
      chunkCount: extraction.chunks.length
    };
    
    // Encrypt document name and metadata
    const encryptedName = await encryptMetadata(file.name, symmetricKey);
    const encryptedMetadata = {
      originalName: await encryptMetadata(metadataObj.originalName, symmetricKey),
      pageCount: metadataObj.pageCount,
      created: metadataObj.created,
      fileType: metadataObj.fileType,
      chunkCount: metadataObj.chunkCount
    };
    
    // Encrypt full document content
    const fullText = extraction.chunks.map(chunk => chunk.content).join(' ');
    const encryptedContent = await encryptText(fullText, symmetricKey);
    
    // Encrypt chunks and embeddings
    const encryptedChunks = await Promise.all(embeddingsWithProgress.map(async (item, index) => {
      // Report progress for large documents
      if (index % 10 === 0) {
        const chunkProgress = 65 + ((index / embeddingsWithProgress.length) * 20);
        await reportProgress(
          'encrypting',
          chunkProgress,
          `Encrypting chunk ${index + 1}/${embeddingsWithProgress.length}`
        );
      }
      
      // Check for cancellation during long operations
      if (abortSignal?.aborted) {
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
    
    // STEP 4: Upload to server
    await reportProgress('uploading', 85, 'Uploading encrypted document');
    
    // Prepare upload payload
    const uploadPayload = {
      name: encryptedName,
      originalName: encryptedMetadata.originalName,
      type: 'pdf',
      fileSize: file.size,
      pageCount: encryptedMetadata.pageCount,
      encryptedContent,
      encryptedMetadata,
      chunks: encryptedChunks
    };
    
    // Upload to server
    try {
      const uploadResponse = await fetch(`/api/projects/${projectId}/documents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(uploadPayload),
      });
      
      if (!uploadResponse.ok) {
        const error = await uploadResponse.json();
        throw new Error(error.error || 'Failed to upload document');
      }
      
      const uploadResult = await uploadResponse.json();
      
      // Log processing summary if debug enabled
      const processingTime = performance.now() - startTime;
      if (config.debug) {
        console.log('Document processing completed:', {
          documentId: uploadResult.documentId,
          chunks: encryptedChunks.length,
          processingTime: `${Math.round(processingTime)}ms`
        });
      }
      
      // Final progress update
      await reportProgress('completed', 100, 'Processing complete');
      
      return {
        documentId: uploadResult.documentId,
        success: true,
        metadata: {
          chunkCount: encryptedChunks.length,
          embeddingsGenerated: embeddingsWithProgress.length,
          processingTimeMs: Math.round(processingTime)
        }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      await reportProgress('error', 0, errorMessage);
      throw error;
    }
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
    }
    
    return {
      documentId: '',
      success: false,
      error: (error as Error).message
    };
  }
}