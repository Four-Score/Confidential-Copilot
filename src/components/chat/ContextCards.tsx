'use client';

import React from 'react';
import { SearchResultCard } from '@/components/search/SearchResultCard';
import { RetrievedContext } from '@/types/chat';
import { GroupedSearchResult } from '@/types/search';

interface ContextCardsProps {
  context: RetrievedContext;
}

export default function ContextCards({ context }: ContextCardsProps) {
  if (!context || !context.documents || context.documents.length === 0) {
    return (
      <div className="text-sm text-gray-500 my-2 italic">
        No context was retrieved for this query.
      </div>
    );
  }
  
  // Convert RetrievedContext to the format expected by SearchResultCard
  const groupedResults = context.documents.map(doc => {
    // Calculate max similarity from all chunks
    const maxSimilarity = doc.chunks.reduce((max, chunk) => {
      return Math.max(max, chunk.similarityScore);
    }, 0);
    
    // Format as GroupedSearchResult
    const result: GroupedSearchResult = {
      documentId: doc.id,
      documentName: doc.name,
      documentType: doc.type,
      isEncrypted: doc.type === 'pdf', // Assume PDFs are encrypted
      maxSimilarity: maxSimilarity,
      chunks: doc.chunks.map(chunk => ({
        chunkId: chunk.id,
        chunkNumber: chunk.chunkNumber || 0,
        content: chunk.content,
        encryptedContent: chunk.content, // For display purposes, both are the same at this point
        similarity: chunk.similarityScore,
        metadata: chunk.metadata || {},
        documentId: doc.id,
        documentName: doc.name,
        documentType: doc.type
      }))
    };
    
    return result;
  });

  return (
    <div className="mt-2 space-y-2">
      <div className="text-sm font-medium text-gray-700 mb-1">
        Sources ({groupedResults.length})
      </div>
      
      <div className="border-l-2 border-gray-200 pl-3">
        {groupedResults.map(result => (
          <SearchResultCard
            key={result.documentId}
            result={result}
          />
        ))}
      </div>
    </div>
  );
}