import { RetrievedChunk, RetrievedDocument } from '@/types/chat';

/**
 * Format PDF chunk metadata for display
 * @param chunk Retrieved chunk from a PDF document
 * @returns Formatted metadata string
 */
export function formatPdfMetadata(chunk: RetrievedChunk): string {
  if (!chunk || !chunk.metadata) return '';
  
  const parts: string[] = [];
  
  // Add page number if available
  if (chunk.metadata.pageNumber !== undefined) {
    parts.push(`Page ${chunk.metadata.pageNumber}`);
  } else if (chunk.metadata.page !== undefined) {
    parts.push(`Page ${chunk.metadata.page}`);
  }
  
  // Add section information if available
  if (chunk.metadata.section) {
    parts.push(`Section: ${chunk.metadata.section}`);
  }
  
  // Add position information
  if (chunk.chunkNumber !== undefined) {
    parts.push(`Chunk ${chunk.chunkNumber}`);
  }
  
  return parts.join(' • ');
}

/**
 * Format website chunk metadata for display
 * @param chunk Retrieved chunk from a website document
 * @returns Formatted metadata string
 */
export function formatWebsiteMetadata(chunk: RetrievedChunk): string {
  if (!chunk || !chunk.metadata) return '';
  
  const parts: string[] = [];
  
  // Add URL if available
  if (chunk.metadata.url) {
    const url = new URL(chunk.metadata.url);
    parts.push(`${url.hostname}${url.pathname}`);
  }
  
  // Add title if available
  if (chunk.metadata.title) {
    parts.push(chunk.metadata.title);
  }
  
  // Add position information
  if (chunk.chunkNumber !== undefined) {
    parts.push(`Chunk ${chunk.chunkNumber}`);
  }
  
  return parts.join(' • ');
}

/**
 * Format YouTube transcript chunk metadata for display
 * @param chunk Retrieved chunk from a YouTube transcript
 * @returns Formatted metadata string
 */
export function formatYoutubeMetadata(chunk: RetrievedChunk): string {
  if (!chunk || !chunk.metadata) return '';
  
  const parts: string[] = [];
  
  // Add video title if available
  if (chunk.metadata.title) {
    parts.push(chunk.metadata.title);
  }
  
  // Add timestamp if available
  if (chunk.metadata.timestamp) {
    parts.push(`Timestamp: ${formatTimestamp(chunk.metadata.timestamp)}`);
  } else if (chunk.metadata.startTime !== undefined) {
    parts.push(`Time: ${formatTimestamp(chunk.metadata.startTime)}`);
  }
  
  // Add video ID or link
  if (chunk.metadata.videoId) {
    const videoId = chunk.metadata.videoId;
    parts.push(`Video ID: ${videoId}`);
  }
  
  return parts.join(' • ');
}

/**
 * Format a generic document chunk metadata for display
 * @param chunk Retrieved chunk from any document
 * @returns Formatted metadata string
 */
export function formatGenericMetadata(chunk: RetrievedChunk): string {
  if (!chunk || !chunk.metadata) return '';
  
  const parts: string[] = [];
  
  // Add document type if available in metadata
  if (chunk.metadata.documentType) {
    parts.push(chunk.metadata.documentType);
  }
  
  // Add position information
  if (chunk.chunkNumber !== undefined) {
    parts.push(`Chunk ${chunk.chunkNumber}`);
  }
  
  // Add similarity score
  if (chunk.similarityScore !== undefined) {
    const percentage = Math.round(chunk.similarityScore * 100);
    parts.push(`Match: ${percentage}%`);
  }
  
  return parts.join(' • ');
}

/**
 * Format metadata based on document type
 * @param chunk Retrieved chunk
 * @returns Formatted metadata string
 */
export function formatChunkMetadata(chunk: RetrievedChunk): string {
  if (!chunk) return '';
  
  const documentType = chunk.metadata?.documentType?.toLowerCase() || '';
  
  switch (documentType) {
    case 'pdf':
      return formatPdfMetadata(chunk);
    case 'website':
      return formatWebsiteMetadata(chunk);
    case 'youtube':
      return formatYoutubeMetadata(chunk);
    default:
      return formatGenericMetadata(chunk);
  }
}

/**
 * Helper function to format seconds into MM:SS format
 * @param seconds Time in seconds
 * @returns Formatted time string
 */
function formatTimestamp(seconds: number | string): string {
  const totalSeconds = typeof seconds === 'string' ? parseFloat(seconds) : seconds;
  if (isNaN(totalSeconds)) return '';
  
  const minutes = Math.floor(totalSeconds / 60);
  const secs = Math.floor(totalSeconds % 60);
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format full context for an LLM prompt
 * @param context Retrieved context
 * @param maxChunksToInclude Maximum number of chunks to include
 * @returns Formatted context string optimized for LLM
 */
export interface RetrievedContext {
  documents: RetrievedDocument[];
  chunks: RetrievedChunk[];
}

export function formatContextForLLM(
  context: RetrievedContext,
  maxChunksToInclude: number = 10
): string {
  if (!context || !context.documents || context.documents.length === 0) {
    return '';
  }
  
  // Create a map for quick document lookup
  const documentMap = new Map<string, RetrievedDocument>();
  context.documents.forEach(doc => {
    documentMap.set(doc.id, doc);
  });
  
  // Get the highest similarity chunks first
  const prioritizedChunks = [...context.chunks]
    .sort((a, b) => b.similarityScore - a.similarityScore)
    .slice(0, maxChunksToInclude);
  
  // Group chunks by document
  const documentChunkMap = new Map<string, RetrievedChunk[]>();
  
  prioritizedChunks.forEach(chunk => {
    const docId = chunk.documentId;
    if (!documentChunkMap.has(docId)) {
      documentChunkMap.set(docId, []);
    }
    documentChunkMap.get(docId)?.push(chunk);
  });
  
  // Format each document's chunks
  const documentSections = Array.from(documentChunkMap.entries()).map(([docId, chunks]) => {
    const document = documentMap.get(docId);
    const documentName = document?.name || 'Unknown Document';
    
    // Format each chunk's content
    const chunksText = chunks.map(chunk => {
      const metadata = formatChunkMetadata(chunk);
      return `[${metadata}]\n${chunk.content}`;
    }).join('\n\n');
    
    return `SOURCE DOCUMENT: ${documentName} (${document?.type || 'unknown'})\n\n${chunksText}`;
  });
  
  return documentSections.join('\n\n---\n\n');
}