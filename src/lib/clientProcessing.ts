import { v4 as uuidv4 } from 'uuid';
import { 
  processPdfFile,
  validatePdfFile, 
  DocumentChunk, 
  PDFExtractionResult 
} from './pdfUtils';
import { generateBatchEmbeddings, generateEmbedding, ChunkWithEmbedding } from './embeddingUtils';
import { encryptText, encryptMetadata, encryptVector } from '@/services/keyManagement';
import { 
  initiateProcessingJob,
  updateProcessingProgress,
  ProcessingStatus, 
  ProcessingProgressEvent 
} from './processingUtils';
import { PDFProcessingConfig, getProcessingConfig } from './processingConfig';
import { 
  validateWebsiteUrl, 
  extractWebsiteContent, 
  chunkWebsiteContent, 
  WebsiteExtractionResult, 
  WEBSITE_CONSTANTS 
} from './websiteUtils';
import { WebsiteMetadata, UnencryptedDocument } from '@/types/document';
import { createClient } from '@/lib/supabase/client';

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

export interface WebsiteProcessingOptions {
  signal?: AbortSignal;
  onProgress?: (event: ProcessingProgressEvent) => void;
  chunkSize?: number;
  chunkOverlap?: number;
}

export interface WebsiteProcessingResult {
  websiteId: string;
  success: boolean;
  error?: string;
  metadata?: {
    chunkCount: number;
    processingTimeMs: number;
  };
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
    const validationResult = validatePdfFile(file);
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
    
    let extractionResult;
    try {
      extractionResult = await processPdfFile(
        file, 
        jobId, // Pass the jobId as documentId
        config.chunkSize,
        config.chunkOverlap
      );
      
      if (!extractionResult.valid || !extractionResult.chunks || !extractionResult.metadata) {
        throw new Error(extractionResult.error || 'Failed to process PDF');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'PDF extraction failed';
      await reportProgress('error', 0, errorMessage);
      throw error;
    }
    
    if (config.debug) {
      console.log('Extracted chunks:', extractionResult.chunks.length);
    }
    
    await reportProgress('chunking', 25, `Created ${extractionResult.chunks.length} text chunks`);
    
    // Check for cancellation after extraction
    if (abortSignal?.aborted) {
      await reportProgress('cancelled', 0, 'Operation cancelled by user');
      throw new Error('Operation cancelled by user');
    }
    
    // STEP 2: Generate embeddings
    let embeddingsWithProgress: ChunkWithEmbedding[];
    try {
      embeddingsWithProgress = await generateBatchEmbeddings(
        extractionResult.chunks,
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
    // Prepare metadata
    const metadataObj = {
      originalName: file.name,
      pageCount: extractionResult.metadata.pageCount || 1,
      created: new Date().toISOString(),
      fileType: file.type,
      chunkCount: extractionResult.chunks.length
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
    const fullText = extractionResult.chunks.map((chunk) => chunk.content).join(' ');
    const encryptedContent = await encryptText(fullText, symmetricKey);
    
    // Encrypt chunks and embeddings
    const encryptedChunks = await Promise.all(embeddingsWithProgress.map(async (item: ChunkWithEmbedding, index: number) => {
      // Report progress for large documents
      const chunkProgress = 65 + ((index / embeddingsWithProgress.length) * 20);
      await reportProgress(
        'encrypting',
        chunkProgress,
        `Encrypting chunk ${index + 1}/${embeddingsWithProgress.length}`
      );
      
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

export async function processWebsite(
  projectId: string,
  url: string,
  options?: WebsiteProcessingOptions
): Promise<WebsiteProcessingResult> {
  const startTime = performance.now();
  const jobId = uuidv4();
  const onProgress = options?.onProgress || (() => {});
  const signal = options?.signal;
  const supabaseClient = createClient();
  
  // Report progress function - similar pattern to processDocument
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
    return updateProcessingProgress(
      jobId, 
      progress, 
      status, 
      currentStep,
      'website'
    );
  };
  
  try {
    // Initialize progress
    await reportProgress('initialized', 0, 'Starting website processing');
    
    // Check if processing was aborted
    if (signal?.aborted) {
      await reportProgress('cancelled', 0, 'Operation cancelled by user');
      throw new Error('Operation cancelled by user');
    }

    // Step 1: Validate URL
    await reportProgress('validating', 10, 'Validating website URL...');
    
    const validationResult = await validateWebsiteUrl(url);
    if (!validationResult.isValid) {
      await reportProgress('error', 0, validationResult.message || 'Invalid URL');
      return { 
        websiteId: '', 
        success: false, 
        error: validationResult.message || 'Invalid URL' 
      };
    }
    
    // Check for abortion
    if (signal?.aborted) {
      await reportProgress('cancelled', 0, 'Operation cancelled by user');
      throw new Error('Operation cancelled by user');
    }

    // Step 2: Extract content
    await reportProgress('extracting', 20, 'Extracting website content...');
    
    const { content, metadata } = await extractWebsiteContent(url);
    
    if (!content || content.length === 0) {
      await reportProgress('error', 0, 'No content extracted from website');
      return { websiteId: '', success: false, error: 'No content extracted from website' };
    }

    // Check for abortion
    if (signal?.aborted) {
      await reportProgress('cancelled', 0, 'Operation cancelled by user');
      throw new Error('Operation cancelled by user');
    }

    // Step 3: Chunk content
    await reportProgress('chunking', 40, 'Chunking website content...');
    
    const chunks = chunkWebsiteContent(
      content,
      metadata,
      options?.chunkSize || WEBSITE_CONSTANTS.DEFAULT_CHUNK_SIZE,
      options?.chunkOverlap || WEBSITE_CONSTANTS.DEFAULT_CHUNK_OVERLAP
    );

    await reportProgress('chunking', 45, `Created ${chunks.length} text chunks`);

    // Check for abortion
    if (signal?.aborted) {
      await reportProgress('cancelled', 0, 'Operation cancelled by user');
      throw new Error('Operation cancelled by user');
    }

    // Step 4: Generate embeddings and encrypt them
    await reportProgress('embedding', 50, 'Generating embeddings...');
    
    const chunksWithEmbeddings = await Promise.all(
      chunks.map(async (chunk, index) => {
        // Report individual chunk progress
        const chunkProgress = 50 + ((index / chunks.length) * 30);
        await reportProgress(
          'embedding',
          chunkProgress,
          `Generating embedding for chunk ${index + 1}/${chunks.length}`
        );
        
        // Generate embedding
        const embedding = await generateEmbedding(chunk.content);
        
        // Encrypt the embedding - only the embeddings need encryption, not the content
        const encryptedEmbedding = await encryptVector(embedding);
        
        return {
          ...chunk,
          embeddings: encryptedEmbedding // Store encrypted embeddings
        };
      })
    );

    // Check for abortion
    if (signal?.aborted) {
      await reportProgress('cancelled', 0, 'Operation cancelled by user');
      throw new Error('Operation cancelled by user');
    }

    // Step 5: Store website
    await reportProgress('storing', 80, 'Storing website data...');
    
    // Create the data object to insert into the database
    const websiteData = {
      project_id: projectId,
      name: metadata.title || new URL(url).hostname,
      type: 'website',
      file_size: content.length,
      content: content,
      metadata: metadata
    };
    
    // Format the chunks for database insertion
    const formattedChunks = chunksWithEmbeddings.map(chunk => ({
      chunkNumber: chunk.chunkNumber,
      content: chunk.content,
      encrypted_embeddings: chunk.embeddings, // Using the field name 'encrypted_embeddings'
      metadata: chunk.metadata
    }));

    // Insert the website data and chunks into the database using the Supabase function
    const { data, error } = await supabaseClient.rpc(
      'insert_website_with_chunks',
      {
        p_project_id: projectId,
        p_name: websiteData.name,
        p_type: websiteData.type,
        p_file_size: websiteData.file_size,
        p_content: websiteData.content,
        p_metadata: websiteData.metadata,
        p_chunks: formattedChunks
      }
    );

    // Check if there was an error during insertion
    if (error) {
      console.error('Error storing website data:', error);
      await reportProgress('error', 0, `Database error: ${error.message}`);
      return { websiteId: '', success: false, error: error.message };
    }

    // Log processing summary
    const processingTime = performance.now() - startTime;
    console.log('Website processing completed:', {
      websiteId: data.id,
      chunks: chunksWithEmbeddings.length,
      processingTime: `${Math.round(processingTime)}ms`
    });

    // Final progress update
    await reportProgress('completed', 100, 'Website processed successfully');
    
    return { 
      websiteId: data.id, 
      success: true,
      metadata: {
        chunkCount: chunksWithEmbeddings.length,
        processingTimeMs: Math.round(processingTime)
      }
    };
    
  } catch (error) {
    // If not already handled (like cancellation)
    if ((error as Error).message !== 'Operation cancelled by user') {
      console.error('Error processing website:', error);
      const errorMessage = (error as Error).message || 'Unknown error during processing';
      
      await reportProgress('error', 0, errorMessage);
    }
    
    return { 
      websiteId: '', 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}