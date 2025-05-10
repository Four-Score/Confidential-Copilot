import { RetrievedChunk, RetrievedContext, RetrievedDocument } from '@/types/chat';

/**
 * Approximate token count for a string
 * This is a rough estimate: ~4 characters per token for English text
 * @param text The text to count tokens for
 * @returns Estimated token count
 */
export function estimateTokenCount(text: string): number {
  // Simple approximation: ~4 chars per token for English
  return Math.ceil(text.length / 4);
}

/**
 * Prioritize chunks based on similarity score
 * @param chunks Array of retrieved chunks
 * @returns Sorted array with highest similarity first
 */
export function prioritizeChunksBySimilarity(chunks: RetrievedChunk[]): RetrievedChunk[] {
  return [...chunks].sort((a, b) => b.similarityScore - a.similarityScore);
}

/**
 * Format chunks into a single context string for LLM consumption
 * @param chunks Array of retrieved chunks
 * @param includeMetadata Whether to include metadata in the context
 * @returns Formatted context string
 */
export function formatChunksToString(chunks: RetrievedChunk[], includeMetadata: boolean = false): string {
  if (!chunks || chunks.length === 0) return '';
  
  return chunks.map((chunk, index) => {
    const chunkContent = chunk.content || '';
    let formattedChunk = `[Chunk ${index + 1}]\n${chunkContent}`;
    
    if (includeMetadata && chunk.metadata) {
      const metadataStr = Object.entries(chunk.metadata)
        .filter(([key, value]) => key !== 'embedding' && value !== undefined) // Skip embeddings and undefined values
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ');
        
      if (metadataStr) {
        formattedChunk += `\n[Metadata: ${metadataStr}]`;
      }
    }
    
    return formattedChunk;
  }).join('\n\n');
}

/**
 * Limit context to fit within a token budget
 * @param context The full context object
 * @param maxTokens Maximum tokens allowed
 * @param reservedTokens Tokens reserved for other parts of the prompt
 * @returns Filtered context that fits within token budget
 */
export function limitContextToTokenBudget(
  context: RetrievedContext,
  maxTokens: number,
  reservedTokens: number = 500
): RetrievedContext {
  if (!context || !context.documents || context.documents.length === 0) {
    return context;
  }
  
  // Calculate available token budget
  const availableTokens = Math.max(0, maxTokens - reservedTokens);
  
  // Gather all chunks from all documents and prioritize by similarity
  const allChunks = prioritizeChunksBySimilarity(context.documents.flatMap(doc => doc.chunks));
  
  // Track token usage
  let totalTokens = 0;
  const includedChunkIds = new Set<string>();
  const filteredChunks: RetrievedChunk[] = [];
  
  // Add chunks until we reach the token budget
  for (const chunk of allChunks) {
    const chunkTokens = estimateTokenCount(chunk.content || '');
    
    // Check if adding this chunk would exceed our budget
    if (totalTokens + chunkTokens > availableTokens) {
      // If we've included at least one chunk, stop here
      if (filteredChunks.length > 0) break;
      
      // If this is the first chunk and it's too large, include a truncated version
      const truncatedContent = chunk.content?.slice(0, availableTokens * 4);
      if (truncatedContent) {
        filteredChunks.push({
          ...chunk,
          content: truncatedContent + '... [truncated due to length]'
        });
        includedChunkIds.add(chunk.id);
      }
      
      break;
    }
    
    // Add the chunk to our filtered list
    filteredChunks.push(chunk);
    includedChunkIds.add(chunk.id);
    totalTokens += chunkTokens;
  }
  
  // Create filtered documents containing only the included chunks
  const filteredDocuments = context.documents
    .map(doc => ({
      ...doc,
      chunks: doc.chunks.filter(chunk => includedChunkIds.has(chunk.id))
    }))
    .filter(doc => doc.chunks.length > 0);
  
  // Return the filtered context
  return {
    ...context,
    documents: filteredDocuments,
    totalChunks: filteredChunks.length
  };
}

/**
 * Create a concise context summary for LLMs
 * @param context The context object
 * @returns Summary string detailing included documents
 */
export function createContextSummary(context: RetrievedContext): string {
  if (!context || !context.documents || context.documents.length === 0) {
    return 'No context provided.';
  }
  
  const docSummaries = context.documents.map(doc => {
    const chunkCount = doc.chunks.length;
    return `"${doc.name}" (${doc.type}, ${chunkCount} chunk${chunkCount !== 1 ? 's' : ''})`;
  });
  
  return `Context includes ${context.totalChunks} chunks from ${context.documents.length} document${context.documents.length !== 1 ? 's' : ''}: ${docSummaries.join(', ')}.`;
}