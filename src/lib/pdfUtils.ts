import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Document } from "@langchain/core/documents";

/**
 * Maximum file size in bytes (5MB)
 */
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Default chunk size for text splitting
 */
export const DEFAULT_CHUNK_SIZE = 1000;

/**
 * Default chunk overlap for text splitting
 */
export const DEFAULT_CHUNK_OVERLAP = 200;

/**
 * Validates if a file is a PDF and within size limits
 * @param file File to validate
 * @returns Object containing validation result and error message if any
 */
export function validatePdfFile(file: File): { 
  valid: boolean; 
  error?: string;
} {
  // Check if file is a PDF
  if (file.type !== 'application/pdf') {
    return { 
      valid: false, 
      error: 'Only PDF files are supported.' 
    };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return { 
      valid: false, 
      error: `File size exceeds the maximum allowed size (${MAX_FILE_SIZE / (1024 * 1024)}MB).` 
    };
  }

  return { valid: true };
}

/**
 * Interface for PDF extraction result
 */
export interface PDFExtractionResult {
  text: string;
  metadata: {
    title?: string;
    author?: string;
    subject?: string;
    keywords?: string;
    creator?: string;
    producer?: string;
    creationDate?: string;
    modificationDate?: string;
    pageCount: number;
    fileName: string;
    fileSize: number;
  };
}

/**
 * Extracts text and metadata from a PDF file
 * @param file PDF file to extract from
 * @returns Promise resolving to extraction result with text and metadata
 */
export async function extractTextFromPdf(file: File): Promise<PDFExtractionResult> {
  try {
    // Convert File to Blob and then to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Create a temporary Blob URL to use with PDFLoader
    const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    
    // Use PDFLoader to load the document
    const loader = new PDFLoader(url, {
      splitPages: false, // Get full document in one piece
      parsedItemSeparator: ' ' // Join text elements with space
    });
    
    // Load the document
    const docs = await loader.load();
    
    // Extract metadata from LangChain document
    const langchainMetadata = docs[0]?.metadata?.pdf || {};
    
    // Parse and format metadata
    const metadata = {
      title: langchainMetadata.info?.Title || file.name,
      author: langchainMetadata.info?.Author,
      subject: langchainMetadata.info?.Subject,
      keywords: langchainMetadata.info?.Keywords,
      creator: langchainMetadata.info?.Creator,
      producer: langchainMetadata.info?.Producer,
      creationDate: langchainMetadata.info?.CreationDate,
      modificationDate: langchainMetadata.info?.ModDate,
      pageCount: langchainMetadata.totalPages || 1,
      fileName: file.name,
      fileSize: file.size,
    };
    
    // Clean up URL after use
    URL.revokeObjectURL(url);
    
    return {
      text: docs[0]?.pageContent || '',
      metadata
    };
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Interface for a document chunk
 */
export interface DocumentChunk {
  content: string;
  metadata: {
    chunkNumber: number;
    pageNumber?: number;
    fileName: string;
    documentId?: string;
  };
}

/**
 * Chunks the extracted text into smaller pieces
 * @param text Text to chunk
 * @param metadata Metadata to include with each chunk
 * @param chunkSize Size of each chunk
 * @param chunkOverlap Overlap between consecutive chunks
 * @returns Array of document chunks
 */
export async function chunkText(
  text: string, 
  metadata: { fileName: string; documentId?: string; },
  chunkSize = DEFAULT_CHUNK_SIZE,
  chunkOverlap = DEFAULT_CHUNK_OVERLAP
): Promise<DocumentChunk[]> {
  try {
    // Create splitter for chunking
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize,
      chunkOverlap,
    });
    
    // Create LangChain Document with text and metadata
    const doc = new Document({
      pageContent: text,
      metadata: {
        fileName: metadata.fileName,
        documentId: metadata.documentId,
      },
    });
    
    // Split the document into chunks
    const chunks = await splitter.splitDocuments([doc]);
    
    // Format chunks into our DocumentChunk interface
    return chunks.map((chunk: Document, index: number) => ({
      content: chunk.pageContent,
      metadata: {
        chunkNumber: index + 1,
        fileName: metadata.fileName,
        documentId: metadata.documentId,
        // Extract page number if available in the chunk metadata
        pageNumber: chunk.metadata.loc?.pageNumber,
      },
    }));
  } catch (error) {
    console.error('Error chunking text:', error);
    throw new Error(`Failed to chunk text: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Complete end-to-end function to process a PDF file:
 * validates, extracts text and metadata, and chunks the text
 * @param file PDF file to process
 * @param documentId Optional document ID to include in metadata
 * @param chunkSize Size of each chunk
 * @param chunkOverlap Overlap between consecutive chunks
 * @returns Object containing validation status, metadata, and chunks
 */
export async function processPdfFile(
  file: File,
  documentId?: string,
  chunkSize = DEFAULT_CHUNK_SIZE,
  chunkOverlap = DEFAULT_CHUNK_OVERLAP
): Promise<{
  valid: boolean;
  error?: string;
  metadata?: PDFExtractionResult['metadata'];
  chunks?: DocumentChunk[];
}> {
  // First validate the file
  const validation = validatePdfFile(file);
  if (!validation.valid) {
    return validation;
  }
  
  try {
    // Extract text and metadata
    const extraction = await extractTextFromPdf(file);
    
    // Chunk the extracted text
    const chunks = await chunkText(
      extraction.text,
      { fileName: file.name, documentId },
      chunkSize,
      chunkOverlap
    );
    
    return {
      valid: true,
      metadata: extraction.metadata,
      chunks,
    };
  } catch (error) {
    console.error('Error processing PDF:', error);
    return {
      valid: false,
      error: `Failed to process PDF: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}