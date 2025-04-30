import * as pdfjs from 'pdfjs-dist';

// Configure the worker source for PDF.js
if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;
}

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
 * Extracts text and metadata from a PDF file using PDF.js
 * @param file PDF file to extract from
 * @returns Promise resolving to extraction result with text and metadata
 */
export async function extractTextFromPdf(file: File): Promise<PDFExtractionResult> {
  try {
    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Load the PDF using PDF.js
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    
    // Extract text from each page
    let fullText = '';
    const numPages = pdf.numPages;
    
    for (let i = 1; i <= numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n\n';
    }
    
    // Get metadata
    const metadata = await pdf.getMetadata().catch(() => ({
      info: {},
      metadata: null
    }));
    
    // Define PDF info structure for type safety
    interface PDFInfo {
      Title?: string;
      Author?: string;
      Subject?: string;
      Keywords?: string;
      Creator?: string;
      Producer?: string;
      CreationDate?: string;
      ModDate?: string;
      [key: string]: any; // For any other properties
    }
    
    const info = (metadata.info as PDFInfo) || {};
    
    return {
      text: fullText.trim(),
      metadata: {
        title: info.Title || file.name,
        author: info.Author,
        subject: info.Subject,
        keywords: info.Keywords,
        creator: info.Creator,
        producer: info.Producer,
        creationDate: info.CreationDate,
        modificationDate: info.ModDate,
        pageCount: numPages,
        fileName: file.name,
        fileSize: file.size
      }
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
  // Simple sliding window chunking
  const chunks: DocumentChunk[] = [];
  let start = 0;
  let chunkNumber = 1;
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    const chunkText = text.slice(start, end);
    chunks.push({
      content: chunkText,
      metadata: {
        chunkNumber,
        fileName: metadata.fileName,
        documentId: metadata.documentId,
      }
    });
    chunkNumber++;
    start += chunkSize - chunkOverlap;
    if (start < 0 || start >= text.length) break;
  }
  return chunks;
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