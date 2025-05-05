# Retrieval Flow & Vector Search Integration Guide

## Overview

This guide explains how to integrate the retrieval flow and vector search functionality into other features of the application. The system enables users to select projects, choose documents, and perform semantic searches across both encrypted and unencrypted content while maintaining zero-trust security principles.

## Core Flow Architecture

The retrieval flow follows a three-step process:
1. **Project Selection**: User selects a project to search within
2. **Document Selection**: User selects specific documents within that project
3. **Search**: User performs vector search across selected documents and views results

This flow is implemented through a modal-based system with persistent state management.

## Key Integration Points

### 1. Primary Integration Hook

**File**: src\hooks\useRetrievalFlow.ts

This is the main entry point for integrating retrieval flow into any component:

```typescript
const {
  startRetrievalFlow,
  startDocumentSelection,
  startSearch,
  resetRetrievalState,
  getRetrievalState,
  executeSearchWithCurrentSelections
} = useRetrievalFlow();
```

### 2. Core State Providers

Ensure these providers wrap your application (they should already be in place):

- **Modal Provider**: src\providers\ModalProvider.tsx
- **Data Selection Provider**: src\providers\DataSelectionProvider.tsx

## Integration Guide: Starting the Flow

### Basic Flow Initialization

To start the complete retrieval flow from the beginning:

1. Import the hook:
   - `import { useRetrievalFlow } from '@/hooks/useRetrievalFlow';`

2. Call the start function:
   - `startRetrievalFlow()` - Opens the project selection modal and begins the complete flow

### Advanced Entry Points

For more targeted entry points:

- **Start from document selection**:
  - `startDocumentSelection(projectId, projectName)` - Skip project selection
  
- **Start directly with search**:
  - `startSearch(documentIds, initialQuery)` - Skip to search with pre-selected documents

- **Execute search with current selections**:
  - `executeSearchWithCurrentSelections(query)` - Use currently selected documents

## Working with Search Results

### Accessing Results

Search results are available through the SearchContext:

**File**: src\contexts\SearchContext.tsx

```typescript
import { useSearch } from '@/contexts/SearchContext';

const { results, isLoading, error } = useSearch();
```

### Result Processing

Results are automatically processed into a grouped structure:

- Results are grouped by document
- Each group contains metadata and relevance-sorted text chunks
- Similarity scores are provided for ranking

## Vector Search Integration

### Core Search Utilities

**File**: src\lib\searchUtils.ts

Key functions:
- `generateQueryEmbedding()`: Creates vector embedding from text
- `encryptQueryEmbedding()`: Encrypts embeddings for secure search
- `executeVectorSearch()`: Makes API request with search parameters
- `processSearchResults()`: Organizes results by document
- `categorizeDocuments()`: Separates encrypted/unencrypted documents

### Custom Search Hook

**File**: src\hooks\useVectorSearch.ts

For direct vector search operations:

```typescript
const { search, isLoading, error, results } = useVectorSearch();
```

Parameters for search:
- `query` (string): User search query
- `projectId` (string): Project ID to search within
- `documentIds` (string[]): Optional list of document IDs
- `searchConfig` (SearchConfig): Optional configuration

## Working with Both Document Types

### Document Type Handling

The system automatically handles both encrypted and unencrypted documents:

1. **Encrypted documents** (PDFs):
   - Content stored in `vector_chunks` table
   - Searched using `match_document_chunks` SQL function
   - Results require client-side decryption

2. **Unencrypted documents** (websites):
   - Content stored in `v2_vector_chunks` table
   - Searched using `match_v2_document_chunks` SQL function
   - Only embeddings are encrypted, content is plain text

### Document Type Detection

Document types are automatically identified by the retrieval system:
- The `categorizeDocuments()` function separates by type
- API endpoints handle both types as appropriate

## Displaying Search Results

### Result Components

**Path**: src\components\search\

Key components:
- `SearchResults.tsx`: Container for all search results
- SearchResultCard.tsx: Individual document result card 
- `SimilarityScore.tsx`: Visual indicator of relevance

### Integration Example

To display search results in a custom component:

```typescript
import { SearchResults } from '@/components/search/SearchResults';
import { useSearch } from '@/contexts/SearchContext';

// In your component:
const { results, isLoading, error, query } = useSearch();

// Then in your JSX:
<SearchResults 
  results={results}
  isLoading={isLoading}
  error={error}
  query={query}
/>
```

## Backend Architecture

### API Endpoints

**Vector Search API**:
- **Path**: src\app\api\search\vector\route.ts
- **Method**: POST
- **Purpose**: Performs vector similarity search across both document types

**Batch Decryption API**:
- **Path**: src\app\api\search\decrypt\route.ts
- **Method**: POST
- **Purpose**: Facilitates client-side batch decryption operations

### Database Functions

**Encrypted Document Search**:
- **Path**: `c:\Projects\Confidential-Copilot\sql\match_document_chunks.sql`
- **Function**: match_document_chunks(query_embedding vector(384), match_threshold float, match_count int, user_id uuid, project_id uuid, optional_doc_ids uuid[])

**Unencrypted Document Search**:
- **Path**: `c:\Projects\Confidential-Copilot\sql\match_v2_document_chunks.sql`
- **Function**: match_v2_document_chunks(...) - same parameters as above

## Configuration Options

**File**: src\config\searchConfig.ts

Configurable parameters:
- `matchThreshold`: Minimum similarity score (0.0-1.0)
- `matchCount`: Maximum number of results
- `batchSize`: Number of items per decryption batch

## Security Considerations

1. **Zero-Trust Model**:
   - Query embeddings are encrypted client-side
   - Document content is only decrypted client-side
   - Server never has access to plaintext

2. **Authentication**:
   - All API endpoints verify user authentication
   - Row-Level Security ensures users only access their data

3. **Decryption Process**:
   - Uses KeyManagementService for decryption operations
   - Handles batch processing for efficiency

## Best Practices

1. **State Management**:
   - Clear search results when no longer needed
   - Reset retrieval state after completing a flow

2. **Error Handling**:
   - Always check for errors in search results
   - Provide fallback UI for search failures

3. **Performance**:
   - Use document filters when possible to limit search scope
   - Adjust batchSize for optimal decryption performance

4. **User Experience**:
   - Show loading states during search operations
   - Display meaningful metadata with search results

## Troubleshooting

- **Empty Results**: Verify document selection, check search query relevance
- **Decryption Errors**: Ensure KeyManagementService is properly initialized
- **Performance Issues**: Try reducing batch size or number of documents searched

## Complete File Reference

### Core Integration
- src\hooks\useRetrievalFlow.ts - Main integration hook
- src\contexts\SearchContext.tsx - Search state management
- src\contexts\DataSelectionContext.tsx - Selection state management

### Modal System
- src\components\retrieval\ProjectSelectionModal.tsx - Project selection
- src\components\retrieval\DataSelectionModal.tsx - Document selection
- src\components\retrieval\SearchModal.tsx - Search interface

### Vector Search
- src\hooks\useVectorSearch.ts - Vector search hook
- src\lib\searchUtils.ts - Search utility functions
- src\config\searchConfig.ts - Search configuration

### Result Display
- src\components\search\SearchResults.tsx - Results container
- src\components\search\SearchResultCard.tsx - Result card
- src\components\search\SimilarityScore.tsx - Relevance indicator

### API Endpoints
- src\app\api\search\vector\route.ts - Vector search API
- src\app\api\search\decrypt\route.ts - Batch decryption API

### Types
- src\types\search.ts - Search-related types
- src\types\document.ts - Document type definitions