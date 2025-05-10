'use client';

import React, { useState } from 'react';
import { RetrievedChunk, RetrievedContext, RetrievedDocument } from '@/types/chat';
import { SimilarityScore } from '@/components/search/SimilarityScore';
import { formatChunkMetadata } from '@/utils/contextFormatters';
import { KeyManagementService } from '@/services/keyManagement/KeyManagementService';

interface ContextDisplayProps {
  context: RetrievedContext;
  isExpanded?: boolean;
}

/**
 * Display component for chat context
 * Shows retrieved documents and chunks with similarity scores
 */
export const ContextDisplay: React.FC<ContextDisplayProps> = ({
  context,
  isExpanded: initialExpanded = false
}) => {
  const [isExpanded, setIsExpanded] = useState(initialExpanded);
  const [expandedDocuments, setExpandedDocuments] = useState<Set<string>>(new Set());
  
  // If no context, don't render anything
  if (!context || !context.documents || context.documents.length === 0) {
    return null;
  }
  
  // Toggle expansion of a specific document
  const toggleDocumentExpansion = (docId: string) => {
    setExpandedDocuments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(docId)) {
        newSet.delete(docId);
      } else {
        newSet.add(docId);
      }
      return newSet;
    });
  };
  
  // Get document icon based on document type
  const getDocumentIcon = (type: string = '') => {
    switch (type.toLowerCase()) {
      case 'pdf':
        return (
          <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
          </svg>
        );
      case 'website':
        return (
          <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0110 5c-1.563 0-3.033.476-4.247 1.29-1.039.7-1.908 1.66-2.486 2.768-.511.977-.836 2.074-.836 3.242V12a.75.75 0 01-.75.75H.75a.75.75 0 01-.75-.75v-.5a6.5 6.5 0 014.332-6.173zM6 15a1 1 0 100-2 1 1 0 000 2zm3 0a1 1 0 100-2 1 1 0 000 2zm4.75-1.5a.75.75 0 000 1.5h4.5a.75.75 0 000-1.5h-4.5zm-2.501-4a.75.75 0 01.75-.75h4.5a.75.75 0 010 1.5h-4.5a.75.75 0 01-.75-.75zm.75-2.25a.75.75 0 000 1.5h4.5a.75.75 0 000-1.5h-4.5z" clipRule="evenodd" />
          </svg>
        );
      case 'youtube':
        return (
          <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 2a8 8 0 100 16 8 8 0 000-16zM7 12l5-3-5-3v6z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
          </svg>
        );
    }
  };
  
  return (
    <div className="mt-2 mb-4 bg-gray-50 border border-gray-200 rounded-md overflow-hidden">
      {/* Context Header */}
      <div 
        className="px-3 py-2 bg-gray-100 flex justify-between items-center cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-2">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-medium text-sm">
            Sources: {context.documents.length} documents, {context.totalChunks} relevant passages
          </span>
        </div>
        <button 
          type="button"
          className="text-gray-500 hover:text-gray-700"
          aria-label={isExpanded ? 'Collapse' : 'Expand'}
        >
          <svg
            className={`w-5 h-5 transition-transform ${isExpanded ? 'transform rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      </div>
      
      {/* Expandable Context Content */}
      {isExpanded && (
        <div className="divide-y divide-gray-200">
          {context.documents.map((document) => (
            <DocumentContextCard
              key={document.id}
              document={document}
              isExpanded={expandedDocuments.has(document.id)}
              onToggle={() => toggleDocumentExpansion(document.id)}
              getDocumentIcon={getDocumentIcon}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface DocumentContextCardProps {
  document: RetrievedDocument;
  isExpanded: boolean;
  onToggle: () => void;
  getDocumentIcon: (type: string) => React.ReactNode;
}

/**
 * Card component for displaying document context
 * Shows document header and expandable chunks
 */
const DocumentContextCard: React.FC<DocumentContextCardProps> = ({
  document,
  isExpanded,
  onToggle,
  getDocumentIcon
}) => {
  const [documentName, setDocumentName] = useState<string>(document.name);
  
  // Calculate max similarity score for this document
  const maxSimilarity = Math.max(...document.chunks.map(chunk => chunk.similarityScore));
  
  // Decrypt document name if needed
  React.useEffect(() => {
    const decryptDocName = async () => {
      if (document.name.startsWith('enc:')) {
        try {
          const kms = KeyManagementService.getInstance();
          if (kms) {
            const decryptedName = await kms.decryptMetadata(document.name);
            setDocumentName(decryptedName);
          }
        } catch (error) {
          console.error('Error decrypting document name:', error);
          setDocumentName('[Encrypted Document]');
        }
      }
    };
    
    decryptDocName();
  }, [document.name]);
  
  return (
    <div className="bg-white overflow-hidden">
      {/* Document Header */}
      <div 
        className={`px-4 py-2 flex justify-between items-center cursor-pointer ${
          isExpanded ? 'bg-blue-50' : 'hover:bg-gray-50'
        }`}
        onClick={onToggle}
      >
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            {getDocumentIcon(document.type)}
          </div>
          <div>
            <h3 className="font-medium text-gray-900 truncate max-w-xs">
              {documentName}
            </h3>
            <p className="text-xs text-gray-500">
              {document.chunks.length} relevant passages from {document.type} document
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="hidden sm:block">
            <SimilarityScore score={maxSimilarity} size="sm" />
          </div>
          
          <button
            type="button"
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
            className="text-gray-400 hover:text-gray-500"
          >
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'transform rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Document Chunks */}
      {isExpanded && (
        <div className="divide-y divide-gray-100">
          {document.chunks
            .sort((a, b) => b.similarityScore - a.similarityScore)
            .map((chunk) => (
              <ChunkContextCard key={chunk.id} chunk={chunk} />
            ))}
        </div>
      )}
    </div>
  );
};

interface ChunkContextCardProps {
  chunk: RetrievedChunk;
}

/**
 * Card component for displaying chunk context
 * Shows chunk content and metadata with similarity score
 */
const ChunkContextCard: React.FC<ChunkContextCardProps> = ({
  chunk
}) => {
  // Format metadata for display
  const metadata = formatChunkMetadata(chunk);
  
  return (
    <div className="px-4 py-3 bg-white hover:bg-gray-50">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-gray-500">
          {metadata || `Chunk #${chunk.chunkNumber}`}
        </span>
        <SimilarityScore score={chunk.similarityScore} size="sm" />
      </div>
      
      <div className="text-sm text-gray-800 bg-gray-50 rounded p-2 font-mono whitespace-pre-wrap">
        {chunk.content}
      </div>
    </div>
  );
};