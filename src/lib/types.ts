import type React from "react"
export interface DocumentType {
  id: string
  title: string
  template: string
  content: string
  createdAt: string
  pages: number
  projectId: string
  type?: string
  size?: string
  referencedDocuments?: ReferencedDocument[]
  lastModified?: string
}

export interface ReferencedDocument {
  id: string
  title: string
}

export interface Template {
  id: string
  name: string
  description: string
  preview: string
  sampleContent: string
}

export interface Tool {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

export interface Project {
  id: string
  name: string
}

export interface ChatMessage {
  role: "user" | "assistant"
  content: string
  suggestions?: string[]
}
// src/lib/types.ts

export interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  structure: {
    sections: string[];
    requiredFields: string[];
  };
}

export interface TemplateWithSample extends Template {
  sampleContent: string;
}

export interface DocumentGenerationOptions {
  templateName: string;
  templatePurpose: string;
  details: string;
  referencedDocumentIds?: string[];
  stream?: boolean;
}

export interface DocumentIngestionOptions {
  text: string;
  title: string;
  documentId?: string;
  documentType?: string;
  projectId?: string;
  metadata?: Record<string, any>;
}

export interface VectorStoreInfo {
  documentCount: number;
  embeddingModel: string;
  averageEmbeddingDimension: number;
  lastUpdated: string;
}

export type DocumentSimilarityResult = {
  document: DocumentType;
  similarity: number;
  relevantSections: Array<{
    content: string;
    similarity: number;
  }>;
};

export interface VectorQueryOptions {
  query: string;
  maxResults?: number;
  threshold?: number;
  filters?: Record<string, any>;
}


export interface DocumentTemplate {
  id: string;
  title: string;
  description: string;
  category: string;
  pages: number;
  vectorId: string;
}

export interface VectorStoreConfig {
  tableName: string;
  queryName: string;
  indexName?: string;
}

// Document embedding types
export interface DocumentEmbedding {
  id: string;
  content: string;
  metadata: DocumentMetadata;
  embedding: number[];
}

export interface DocumentMetadata {
  source: string;
  documentId: string;
  templateName?: string;
  templatePurpose?: string;
  created: string;
  author?: string;
  projectId?: string;
}

// Retrieval types
export interface RetrievalOptions {
  k?: number;
  filter?: Record<string, any>;
  searchType?: "similarity" | "mmr";
  minRelevanceScore?: number;
}

// Agent types
export interface AgentMessage {
  role: "system" | "user" | "assistant" | "function";
  content: string;
  name?: string;
  function_call?: {
    name: string;
    arguments: string;
  };
}

export interface AgentAction {
  type: "retrieval" | "generation" | "summary" | "extraction";
  input: any;
  output: any;
  timestamp: string;
}

// Document generation types
export interface DocumentGenerationRequest {
  templateName: string;
  templatePurpose: string;
  details: string;
  referencedDocuments?: string;
  apiKey: string;
}

export interface DocumentGenerationResponse {
  content: string;
  contextUsed: number;
  templateName: string;
  generatedAt: string;
}