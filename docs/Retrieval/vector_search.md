# Vector Search Implementation Documentation

## Overview

The vector search implementation creates a comprehensive system for securely retrieving relevant information from both encrypted and unencrypted documents based on semantic similarity. The system follows zero-trust principles, maintaining client-side encryption and decryption while enabling efficient similarity search across all document types. The implementation integrates with the existing retrieval flow, providing a seamless user experience for selecting projects and documents before executing searches.

### Core Requirements

1. **Cross-Document Type Support**: Ability to search across both encrypted documents (PDFs) and unencrypted documents (websites) using a unified interface
2. **Security First**: Maintain zero-trust principles with client-side encryption/decryption of query vectors and content
3. **Efficient Vector Search**: Implement PostgreSQL vector similarity operations using pgvector extension
4. **Unified Search Experience**: Integrate with existing retrieval flow for project and document selection
5. **Result Grouping**: Show search results grouped by document with expandable details
6. **Batch Processing**: Handle decryption of multiple search results efficiently
7. **Visual Feedback**: Provide clear indication of similarity scores and search relevance

## 1. Database Functions

### SQL Function for Encrypted Documents Search

**File**: match_document_chunks.txt

This SQL function performs vector similarity search on encrypted document chunks. It takes query embedding, similarity threshold, result count limit, user ID, project ID, and optional document IDs as parameters. The function joins vector_chunks table with documents and projects tables, applies filters for user and project access control, and optional document filtering. Results are ordered by similarity score (calculated using cosine distance operator <=>), with each result containing chunk ID, document ID, document metadata, encrypted chunk content, and similarity score.

### SQL Function for Unencrypted Documents Search

**File**: match_v2_document_chunks.txt

This SQL function performs vector similarity search on unencrypted document chunks. It uses identical parameters as match_document_chunks for consistency, but works with v2_vector_chunks and v2_documents tables. The function provides similar filtering and ordering but returns unencrypted chunk content while still using encrypted embeddings for the similarity calculation.

## 2. TypeScript Types and Interfaces

### Search Types

**File**: src\types\search.ts

This file defines all TypeScript interfaces and types for the vector search functionality:

- `SimilarityScore`: Type for representing similarity scores (0-1 range)
- `SearchConfig`: Configuration options for vector search, including matchThreshold, matchCount, and batchSize
- `DEFAULT_SEARCH_CONFIG`: Default configuration values
- `VectorSearchRequest`: Interface for vector search API requests
- `VectorSearchResult`: Interface for vector search API responses
- `ChunkSearchResult`: Interface for individual search result chunks
- `GroupedSearchResult`: Interface for search results grouped by document
- `ProcessedSearchResult`: Interface for fully processed search results ready for display

### Document Types Extension

**File**: src\types\document.ts

This file extends the existing document interfaces to include search-related information:

- `DocumentWithSimilarity`: Extends Document with similarity score and matched chunks
- `UnencryptedDocumentWithSimilarity`: Extends UnencryptedDocument with similarity properties
- `DocumentSearchResult`: Union type for both document result types

## 3. API Endpoints

### Vector Search API

**File**: src\app\api\search\vector\route.ts

This API endpoint implements vector search functionality using PostgreSQL's vector similarity operations. The POST handler accepts a request containing a query, its vector embedding, project ID, optional document IDs, and search configuration. It authenticates the user with Supabase, then processes the request by calling the appropriate SQL functions (`match_document_chunks` for encrypted documents and `match_v2_document_chunks` for unencrypted documents). The results are combined, sorted by similarity score, and returned in a structured response that includes separate arrays for encrypted and unencrypted results, as well as a combined array sorted by relevance.

### Batch Decryption API

**File**: src\app\api\search\decrypt\route.ts

This API endpoint implements a secure batch decryption service following zero-trust principles. The POST handler receives an array of encrypted chunks, validates user authentication with Supabase, and performs security checks to ensure the user has access to the requested chunks. Rather than performing server-side decryption (which would violate the zero-trust model), it returns a structured response that the client will process using the Key Management Service to perform the actual decryption client-side. This maintains the security-by-design architecture while providing a convenient API for batch operations.

## 4. Search Utilities

### Search Utils

**File**: src\lib\searchUtils.ts

This utility file implements core vector search functionality with the following key functions:

- `generateQueryEmbedding`: Converts query text to vector embeddings using MiniLM-L6-v2 model
- `encryptQueryEmbedding`: Encrypts embeddings using KeyManagementService for secure searching
- `executeVectorSearch`: Makes API calls to the search endpoint with proper parameters
- `categorizeDocuments`: Separates document IDs into encrypted and unencrypted types
- `decryptSearchResults`: Performs batch decryption of encrypted search results
- `processSearchResults`: Organizes and groups search results by document for display

### Search Configuration

**File**: src\config\searchConfig.ts

This configuration file centralizes vector search settings and provides utility functions for managing search configurations:

- `createSearchConfig`: Merges default values with provided overrides
- `validateSearchConfig`: Ensures configuration values are within acceptable ranges
- `createValidatedSearchConfig`: Combines creation and validation steps
- `getEnvironmentSearchConfig`: Supports loading settings from environment variables
- `getSearchConfig`: Main function that combines environment and override settings

## 5. React Hooks

### Vector Search Hook

**File**: src\hooks\useVectorSearch.ts

This React hook provides a comprehensive interface for performing vector searches:

- `search`: Main function that orchestrates the search process
- `decryptBatch`: Function for handling encrypted content
- `resetSearch`: Clears search results
- `updateSearchConfig`: Modifies search parameters
- State variables: `isLoading`, `error`, `results`, `rawResults`

### Search Context

**File**: src\contexts\SearchContext.tsx

This React context manages vector search state across the application:

- `SearchProvider`: Component that wraps the application
- `useSearch`: Hook for accessing search functionality
- Context values: `query`, `results`, `isLoading`, `error`, `searchConfig`
- Context methods: `setQuery`, `executeSearch`, `clearSearchResults`, `resetSearch`, `updateSearchConfig`

### Retrieval Flow Hook

**File**: src\hooks\useRetrievalFlow.ts

This hook integrates vector search with the existing retrieval flow:

- `startSearch`: Opens search modal with selected documents and optional initial query
- `executeSearchWithCurrentSelections`: Performs a search with current document selections
- `clearSearchResults`: Clears only search results while preserving other state
- `getSearchResults`: Provides access to search results and state

## 6. UI Components

### Similarity Score Component

**File**: src\components\search\SimilarityScore.tsx

This component displays a visual representation of a similarity score using a colored progress bar and percentage value. It accepts parameters for the score (0-1 range), size variant (sm/md/lg), and whether to show the numerical value. The component dynamically adjusts colors based on the score value (green for high match, yellow for medium, red for low) and includes a tooltip explaining the similarity score meaning.

### Search Result Card Component

**File**: src\components\search\SearchResultCard.tsx

An expandable card component for displaying search results with metadata and matched chunks. In the collapsed state, it shows document metadata, type indicator, and maximum similarity score. When expanded, it displays all matched chunks with their individual similarity scores and content. For encrypted documents, it automatically decrypts document names using KeyManagementService's decryptMetadata function. The component visually differentiates between encrypted and unencrypted documents and provides appropriate document type icons.

### Search Results Container Component

**File**: src\components\search\SearchResults.tsx

This container component manages the display of vector search results, handling loading, error, and empty states gracefully. It accepts a ProcessedSearchResult object, loading state, error state, and the original query string. The component shows a loading spinner during search operations, error messages when failures occur, and a friendly empty state when no results are found. When results are available, it renders SearchResultCard components for each grouped result while displaying a summary of the total results.

### Search Modal Component

**File**: src\components\retrieval\SearchModal.tsx

This modal component integrates the useVectorSearch hook to provide vector search capabilities. It maintains a search query input, handles search submission, and displays search results using the SearchResults component. The modal maintains backward navigation, proper loading states, and error handling while integrating seamlessly with the existing modal system. It passes selected document IDs from the DataSelectionContext to the search function and displays results directly within the modal.

## 7. Key Management Extensions

### Key Management Service Batch Functions

**File**: src\services\keyManagement\KeyManagementService.ts

Added batch processing methods to optimize multiple decryption operations:

- `decryptTextBatch`: Processes arrays of encrypted texts in a single operation
- `decryptMetadataBatch`: Handles multiple metadata items efficiently

These methods take arrays of encrypted inputs and return arrays of decrypted outputs, maintaining the original order. The implementation includes error handling for individual items, ensuring that failures in one item don't prevent processing the entire batch. This optimization reduces the overhead of repeated KeyManagementService method calls when processing multiple search results.

## Data Flow in Vector Search

1. **Query Processing**:
   - User enters search query in the SearchModal component
   - Query text is converted to an embedding vector using `generateQueryEmbedding`
   - The embedding is encrypted using `encryptQueryEmbedding` to maintain security

2. **Search Execution**:
   - The encrypted query vector is sent to the API along with project and document filters
   - The API authenticates the user and calls the appropriate SQL functions based on document types
   - Results from both document types are combined, sorted by similarity, and returned

3. **Result Processing**:
   - Encrypted chunks are decrypted client-side using the Key Management Service
   - Results are grouped by document using `processSearchResults`
   - The processed results are displayed in the SearchResults component with expandable details

4. **User Interaction**:
   - Users can expand/collapse search results to see matched text chunks
   - Similarity scores are visually indicated to show relevance
   - Navigation between retrieval flow steps is maintained through the modal system

## Integration with Existing Retrieval Flow

The vector search functionality is fully integrated with the existing three-step retrieval flow:

1. **Project Selection**: User selects a project to search within
2. **Document Selection**: User selects specific documents to search across
3. **Search Interface**: User enters a search query and views results

The integration is handled through the `useRetrievalFlow` hook (src\hooks\useRetrievalFlow.ts), which manages the state transitions and data passing between these steps. The search functionality supports both encrypted documents (PDFs) and unencrypted documents (websites), presenting a unified search experience while maintaining the security model of each document type.

## Security Considerations

The vector search implementation maintains the application's zero-trust security model:

1. **Query Embeddings**: Query vectors are encrypted client-side before being sent to the server
2. **Search Execution**: Search is performed on encrypted vectors without decrypting document content
3. **Result Decryption**: Document content is only decrypted client-side after retrieval
4. **Access Control**: Row Level Security policies ensure users can only search their own documents
5. **Batch Processing**: Even batch operations maintain client-side decryption

This ensures that the server never has access to plaintext document content or search queries, preserving the security guarantees of the original encryption model.