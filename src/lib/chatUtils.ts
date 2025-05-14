import { ProcessedSearchResult, GroupedSearchResult, ChunkSearchResult } from '@/types/search';

/**
 * Formats search results into a properly structured context string for the LLM
 * @param searchResults The processed search results from vector search
 * @returns A formatted context string for the LLM prompt
 */
export function formatSearchResultsToContext(searchResults: ProcessedSearchResult | null): string {
  // If no results, return empty context
  if (!searchResults || searchResults.groupedResults.length === 0) {
    return "No relevant information found in the selected documents.";
  }
  
  // Start building the context string
  let contextString = "### Context from your documents:\n\n";
  
  // Process each document group
  searchResults.groupedResults.forEach((group, groupIndex) => {
    // Add document header
    contextString += `## Document ${groupIndex + 1}: ${group.documentName} (${group.documentType})\n`;
    
    // Add each relevant chunk from this document
    group.chunks.forEach((chunk, chunkIndex) => {
      contextString += `\n### Excerpt ${chunkIndex + 1} (Similarity: ${(chunk.similarity * 100).toFixed(1)}%):\n`;
      contextString += `${chunk.content.trim()}\n`;
    });
    
    // Add separator between documents
    if (groupIndex < searchResults.groupedResults.length - 1) {
      contextString += "\n---\n\n";
    }
  });
  
  return contextString;
}

/**
 * Optimizes the context for the LLM by prioritizing the most relevant chunks
 * and ensuring we don't exceed token limits
 * 
 * @param searchResults The processed search results from vector search
 * @param maxTokens Approximate token limit to stay under
 * @returns Optimized context string
 */
export function createOptimizedContext(
  searchResults: ProcessedSearchResult | null,
  maxTokens: number = 6000
): string {
  // If no results, return empty context
  if (!searchResults || searchResults.groupedResults.length === 0) {
    return "No relevant information found in the selected documents.";
  }

  // First format the full context
  const fullContext = formatSearchResultsToContext(searchResults);
  
  // Then truncate if needed
  return truncateContextToTokenLimit(fullContext, maxTokens);
}

/**
 * Generates a structured prompt for the LLM that includes context and user query
 * @param query The user's question
 * @param context The formatted context from search results
 * @returns A complete prompt for the LLM API
 */
export function createLlmPromptWithContext(query: string, context: string): string {
  return `You are Confidential Copilot, a helpful AI assistant that answers questions based on the user's private documents.
  
${context}

### User Query: ${query}

Please provide a comprehensive answer to the user's query based on the information in the context above. If the context doesn't contain relevant information to answer the query, acknowledge this and provide a general response based on your knowledge.

Your answer should:
1. Be directly relevant to the user's query
2. Use ONLY information from the provided context, not your general knowledge
3. Be accurate and factual
5. Be conversational but professional in tone
6. Be concise but thorough

If there is no context or the contxt is irrelevant to the query, briefly state this and provide a general response to the query using your own knowledge (only if possible).

### Answer:`;
}

/**
 * Truncates context string to a specified maximum token limit
 * @param contextString The full context string
 * @param maxTokens Approximate maximum tokens to allow
 * @returns Truncated context string
 */
export function truncateContextToTokenLimit(contextString: string, maxTokens: number = 6000): string {
  // Rough approximation: 1 token ≈ 4 characters for English text
  const approximateTokens = contextString.length / 4;
  
  if (approximateTokens <= maxTokens) {
    return contextString;
  }
  
  // Truncate to approximate character limit
  const charLimit = maxTokens * 4;
  const truncated = contextString.substring(0, charLimit);
  
  // Try to truncate at a paragraph break
  const lastParagraph = truncated.lastIndexOf("\n\n");
  if (lastParagraph > charLimit * 0.8) {
    return truncated.substring(0, lastParagraph) + "\n\n[Context truncated due to length constraints]";
  }
  
  // Otherwise truncate at sentence
  const lastSentence = truncated.lastIndexOf(". ");
  if (lastSentence > charLimit * 0.9) {
    return truncated.substring(0, lastSentence + 1) + "\n\n[Context truncated due to length constraints]";
  }
  
  return truncated + "... [Context truncated due to length constraints]";
}