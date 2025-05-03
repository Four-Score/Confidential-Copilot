# Website Content Ingestion Pipeline Guide

## Overview

This guide explains how the website content ingestion pipeline works in our Confidential-Copilot application and how it can be extended for other data types. Unlike PDF documents where all content is encrypted, the website ingestion pipeline only encrypts vector embeddings since website content is already publicly available.

## 1. Website Ingestion Pipeline Flow

### 1.1. User Interface Flow

1. **URL Input**: User enters a URL in the `WebsiteUrlInput` component
   - File: WebsiteUrlInput.tsx
   - Validates URL format and accessibility

2. **Website Preview**: Displays a preview of website metadata
   - File: WebsitePreview.tsx
   - Shows favicon, domain, and basic information

3. **Processing Initialization**: User clicks "Process Website" button
   - Uses `useDocumentProcessor` hook
   - File: useDocumentProcessor.ts
   - Calls `processWebsiteUrl` function

4. **Progress Tracking**: Shows real-time processing progress
   - Updates progress bar
   - Shows current processing step
   - Handles cancellation

5. **Success/Failure Handling**: Displays results
   - Shows success message and adds website to project
   - Or shows error details if processing failed

### 1.2. Technical Processing Flow

1. **URL Validation**
   - File: websiteUtils.ts - `validateWebsiteUrl()`
   - Checks URL format and accessibility via API proxy
   - Proxy endpoint: route.ts

2. **Content Extraction**
   - File: websiteUtils.ts - `extractWebsiteContent()`
   - Uses proxy endpoint to bypass CORS: route.ts
   - Returns raw HTML content and basic metadata

3. **Content Processing**
   - File: websiteUtils.ts - `cleanHtmlContent()`
   - Removes scripts, styles, and unwanted elements
   - Normalizes whitespace and handles special characters

4. **Content Chunking**
   - File: websiteUtils.ts - `chunkWebsiteContent()`
   - Splits content into manageable chunks with configurable size and overlap
   - Creates structured chunks with metadata

5. **Embedding Generation**
   - File: clientProcessing.ts - `processWebsite()`
   - Uses `generateEmbedding()` from embeddingUtils.ts
   - Creates vector embeddings for each content chunk

6. **Vector Encryption**
   - File: clientProcessing.ts - `processWebsite()`
   - Uses `encryptVector()` from keyManagement
   - **Only encrypts embeddings, not content or metadata**

7. **Database Storage**
   - Storage using `insert_website_with_chunks` Supabase function
   - Stores unencrypted content and metadata in `v2_documents`
   - Stores chunk content and encrypted embeddings in `v2_vector_chunks`

8. **API Integration**
   - Main website endpoints: route.ts
   - Individual website endpoint: route.ts
   - Progress tracking: route.ts (shared with documents)

## 2. Key Differences from PDF Ingestion

| Feature | PDF Ingestion | Website Ingestion |
|---------|--------------|-------------------|
| Content Source | Local file | Remote URL |
| Content Extraction | PDF parsing | HTML scraping with proxy |
| Encryption | All content and metadata encrypted | Only vector embeddings encrypted |
| Storage | `documents` and `vector_chunks` tables | `v2_documents` and `v2_vector_chunks` tables |
| Type Handling | Uses `Document` interface | Uses `UnencryptedDocument` interface |
| Processing Function | `processDocument()` | `processWebsite()` |
| User Hook Function | `processFile()` | `processWebsiteUrl()` |

## 3. Extending to Other Data Types

### 3.1. Reusable Components

1. **Processing Architecture**
   - The overall structure in clientProcessing.ts can be reused
   - Progress reporting pattern is consistent across data types
   - Error handling pattern is standardized

2. **Data Storage**
   - Use `v2_documents` and `v2_vector_chunks` tables for unencrypted content
   - OR use `documents` and `vector_chunks` tables for fully encrypted content

3. **Vector Processing**
   - Embedding generation code is data-type agnostic
   - Vector encryption is standardized for all data types

4. **Progress Tracking**
   - The progress system can be reused across data types
   - Updates UI with consistent messages and progress indicators

5. **UI Components**
   - Card component pattern can be extended for new data types
   - Progress indicators and error handling are standardized

### 3.2. Extending for YouTube Transcripts

To add YouTube transcript ingestion, you would need to:

1. **Create YouTube-specific Utilities**
   - New file: `src/lib/youtubeUtils.ts`
   - Implement functions for:
     - `validateYoutubeUrl()`
     - `extractYoutubeTranscript()`
     - `chunkYoutubeTranscript()`

2. **Update Processing Pipeline**
   - Add `processYoutubeTranscript()` to clientProcessing.ts
   - Add `processYoutubeUrl()` to useDocumentProcessor.ts

3. **Create UI Components**
   - Add `YoutubeUrlInput.tsx` component
   - Add `YoutubePreview.tsx` component
   - Extend `DocumentList.tsx` to handle YouTube content

4. **Add API Endpoints**
   - Create YouTube-specific routes for storage and retrieval
   - OR reuse website routes with a different type parameter

5. **Update Project Page**
   - Add YouTube-specific UI elements and handlers
   - Integrate with existing progress tracking

### 3.3. General Extension Pattern

For any new data type (e.g., emails, meeting transcripts):

1. **Define Data Interfaces**
   - Add type definitions to document.ts
   - Create a specific metadata interface

2. **Create Extraction Utilities**
   - New file: `src/lib/[dataType]Utils.ts`
   - Implement validation, extraction, processing, and chunking functions

3. **Extend Processing Pipeline**
   - Add `process[DataType]()` to clientProcessing.ts
   - Add `process[DataType]Url()` or equivalent to useDocumentProcessor.ts

4. **Create UI Components**
   - Input component for new data type
   - Preview component for new data type
   - Update list component to handle new type

5. **Add API Endpoints**
   - Create type-specific API routes or extend existing ones

6. **Decide on Encryption Level**
   - Fully encrypted (use original tables)
   - Partially encrypted (use v2 tables with only embeddings encrypted)

## 4. Architecture Overview

![Architecture Diagram (text representation)]
```
User Interface Layer
    │
    ├── WebsiteUrlInput → WebsitePreview → Processing UI → Success/Error UI
    │
React Hooks Layer
    │
    ├── useDocumentProcessor (processFile, processWebsiteUrl)
    │
Processing Layer
    │
    ├── clientProcessing.ts (processDocument, processWebsite)
    │
Utility Layer
    │
    ├── websiteUtils.ts  ├── pdfUtils.ts  ├── embeddingUtils.ts
    │                   │                │
    ├── Validation      ├── Extraction   ├── Embeddings
    ├── Extraction      ├── Chunking     ├── Vector Operations
    ├── Chunking        │                │
    │                   │                │
API Layer               │                │
    │                   │                │
    ├── Data Storage    ├── Progress     ├── Website Proxy
    │   APIs            │   Tracking     │   APIs
    │                   │                │
Database Layer
    │
    ├── v2_documents (unencrypted content)
    ├── v2_vector_chunks (encrypted embeddings)
```

This architecture allows for extending the system to new data types while maintaining consistency in how data is processed, stored, and presented to the user.