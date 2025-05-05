// Update the existing Document interface (encrypted content)
export interface Document {
  id: string;
  project_id: string;
  name: string;
  type: 'pdf' | 'link' | 'video' | 'website'; // Add 'website' type
  upload_date: string;
  file_size: number;
  page_count?: number;
  encrypted_metadata?: any;
  encrypted_content?: string; // Make this explicit
}

// Add new interface for unencrypted documents (for websites, etc.)
export interface UnencryptedDocument {
  id: string;
  project_id: string;
  name: string;
  type: 'website'; // Currently only website type uses unencrypted storage
  upload_date: string;
  file_size: number;
  content?: string; // Unencrypted content
  metadata?: WebsiteMetadata; // Unencrypted metadata
}

// Define the website metadata structure
export interface WebsiteMetadata {
  url: string;
  title: string;
  description?: string;
  extractedAt: string;
  contentLength: number;
  favicon?: string;
}

// Create a type for distinguishing document types
export type DocumentType = 'encrypted' | 'unencrypted';

// Type guard to check if a document is unencrypted
export function isUnencryptedDocument(doc: Document | UnencryptedDocument): doc is UnencryptedDocument {
  // Check if it's a website type or if it has unencrypted content
  return doc.type === 'website' || 
         ('content' in doc && !('encrypted_content' in doc));
}

// Type for website chunk
export interface WebsiteChunk {
  id: string;
  document_id: string;
  chunk_number: number;
  chunk_content: string;
  metadata: WebsiteChunkMetadata;
}

// Type for website chunk metadata
export interface WebsiteChunkMetadata {
  url: string;
  chunkIndex: number;
  startPosition: number;
  endPosition: number;
}

// Search result for a document
export interface DocumentWithSimilarity extends Document {
  similarity?: number;
  matchedChunks?: {
    chunkId: string;
    chunkNumber: number;
    similarity: number;
    encryptedContent: string;
    metadata: any;
  }[];
}

// Search result for an unencrypted document
export interface UnencryptedDocumentWithSimilarity extends UnencryptedDocument {
  similarity?: number;
  matchedChunks?: {
    chunkId: string;
    chunkNumber: number;
    similarity: number;
    content: string;
    metadata: any;
  }[];
}

// Union type for either document type with similarity information
export type DocumentSearchResult = DocumentWithSimilarity | UnencryptedDocumentWithSimilarity;