# Confidential-Copilot: Ingestion Pipeline Documentation

## Introduction

This document provides a comprehensive guide to the PDF ingestion pipeline implemented in Confidential-Copilot. It explains how documents are securely processed, encrypted, and stored while maintaining zero-knowledge principles. This guide will help you understand how to extend the pipeline for other data types (emails, YouTube transcripts, web data, etc.) using the same architecture.

## Core Design Principles

Our ingestion pipeline is built on:

1. **Zero-Trust Architecture**: No unencrypted user data ever leaves the client
2. **Client-Side Processing**: All extraction, chunking, embedding, and encryption happens in the browser
3. **End-to-End Encryption**: Data is encrypted before storage and only decrypted on the client
4. **Cross-Device Consistency**: Encryption keys are securely stored for access across multiple devices
5. **Modular Design**: Components can be reused and extended for different data types

## High-Level Data Flow

```
User Upload → Client-Side Processing → Encryption → Server Storage → Retrieval → Client-Side Decryption → Display
```

## Database Structure

We use three main tables in Supabase:

1. **Projects Table**: Organizes user content into projects
2. **Documents Table**: Stores encrypted document metadata and content
3. **Vector Chunks Table**: Stores encrypted text chunks and their vector embeddings
4. **User Keys Table**: Stores encrypted symmetric keys and DCPE keys for secure cross-device access

## Detailed Pipeline Flow

### 1. Upload Process

1. User navigates to a project page (`Confidential-Copilot\src\app\projects\[id]\page.tsx`)
2. User triggers document upload via the `DocumentUploader` component
3. `FileUploader` component handles file selection and validation
4. `startUpload()` in `DocumentUploader` initiates processing

### 2. Processing Pipeline

The processing happens entirely client-side, orchestrated by:

- **Processing Coordinator**: clientProcessing.ts
- **Processing Hook**: useDocumentProcessor.ts

Key steps:

1. **Validation**: Check file type and size (`validatePdfFile` in pdfUtils.ts)
2. **Text Extraction**: Extract text from the document (`processPdfFile` in pdfUtils.ts)
3. **Chunking**: Split text into manageable chunks (`chunkText` in pdfUtils.ts)
4. **Embedding Generation**: Create vector embeddings for each chunk (`generateBatchEmbeddings` in embeddingUtils.ts)
5. **Encryption**: Encrypt document content, metadata, and embeddings using the Key Management Service
6. **Upload**: Send encrypted data to server

### 3. Encryption Process

The Key Management Service provides three critical functions:

1. `encryptText`: Standard encryption for document content
2. `encryptMetadata`: Deterministic encryption for metadata (enables exact matching)
3. `encryptVector`: Specialized encryption for vector embeddings (preserves search capabilities)

### 4. Server Storage

API endpoints handle the secure storage of data:

- Document upload: route.ts
- Database transaction: Uses `insert_document_with_chunks` function for atomic operations

### 5. Retrieval & Display

1. `ProjectPage` component fetches documents and decrypts names
2. Documents are displayed via `DocumentList` and `DocumentCard` components
3. Buffer serialization handling ensures proper decryption of data

## DCPE Key Persistence Mechanism

To ensure deterministic encryption works consistently across multiple devices, we've implemented a robust DCPE key persistence mechanism:

### How It Works

1. **Dual Storage Strategy**:
   - **Database Storage**: Encrypted DCPE keys are stored in the `encrypted_dcpe_keys` column of the `user_keys` table
   - **LocalStorage**: Keys are also cached in browser localStorage for faster access on the same device

2. **Prioritized Loading**:
   - When a user logs in, the Key Management Service attempts to load DCPE keys in this order:
     1. First from database (primary source for cross-device consistency)
     2. Then from localStorage (fallback for faster access)
     3. If neither exists, new keys are generated and stored in both locations

3. **Secure Encryption**:
   - DCPE keys are always encrypted with the user's symmetric key before storage
   - The symmetric key is only available in memory after successful authentication
   - This maintains our zero-trust approach while enabling cross-device functionality

4. **Initialization Process**:
   - The Key Management Service's `initialize()` method manages the loading and persistence of DCPE keys
   - The `initializeWithNewKeys()` method ensures keys are properly generated during signup
   - Cross-storage synchronization ensures consistency between database and localStorage

### Why This Matters

Without this mechanism, deterministic encryption would produce different results on different devices, breaking:
- Document name searches
- Metadata filtering
- Any features relying on exact-match queries on encrypted data

This approach ensures that a document encrypted on one device can be properly decrypted and searched on another device, while maintaining zero-knowledge principles.

## How to Extend for New Data Types

To add support for a new data type, you'll need to:

### 1. Create Data Extraction Module

Create a new module similar to pdfUtils.ts that handles:

```typescript
// Example path: Confidential-Copilot\src\lib\[dataType]Utils.ts

// Functions to implement:
- validateFile/validateData
- extractContent
- chunkContent
// Reuse existing chunking logic where possible
```

### 2. Update DocumentUploader Component

Extend the `DocumentUploader` component to recognize and handle your new data type:

```typescript
// Confidential-Copilot\src\components\documents\DocumentUploader.tsx
// Add support for new file types or data inputs
```

### 3. Update Processing Pipeline

Modify clientProcessing.ts to handle your data type, or create a specialized version:

```typescript
// Confidential-Copilot\src\lib\clientProcessing.ts
// Either extend processDocument or create a new function like processEmailData
```

### 4. Reuse Core Components

The following components can be reused without modification:

- Key Management Service (`services/keyManagement`)
- Embedding generation (`embeddingUtils.ts`)
- Progress tracking (`processingUtils.ts`)
- Upload and storage API endpoints

## Key Files & Functions Reference

### Core Utilities

1. **Key Management Service**
   - Path: `src/services/keyManagement`
   - Key Components:
     - `KeyManagementService.ts`: Main service class
     - `interfaces.ts`: Provider interfaces for storage, crypto, and DCPE operations
     - `index.ts`: Exports service singleton and utility functions
   - Hook: `useKeyManagement`
   - Functions: `encryptText`, `encryptMetadata`, `encryptVector`, `decryptText`, `decryptMetadata`

2. **PDF Processing Utilities**
   - File: pdfUtils.ts
   - Key Functions: `validatePdfFile`, `extractTextFromPdf`, `chunkText`, `processPdfFile`

3. **Embedding Utilities**
   - File: embeddingUtils.ts
   - Key Functions: `generateEmbedding`, `generateBatchEmbeddings`

4. **Processing Orchestration**
   - File: clientProcessing.ts
   - Key Function: `processDocument`

5. **Processing Hook**
   - File: useDocumentProcessor.ts
   - Key Function: `processFile`

### Frontend Components

1. **Document Uploader**
   - File: DocumentUploader.tsx
   - Handles file selection, preview, and upload initiation

2. **File Uploader**
   - File: FileUploader.tsx
   - Handles drag-and-drop, file validation

3. **Project Page**
   - File: page.tsx
   - Coordinates document listing and decryption

### API Endpoints

1. **Document Upload**
   - File: route.ts
   - Handles secure storage of documents and chunks

2. **Processing Progress**
   - File: route.ts
   - Tracks processing status

## Important Considerations When Adding New Data Types

1. **Chunking Strategy**: Consider appropriate chunking strategy for your data type (e.g., emails might chunk by sections)

2. **Metadata Extraction**: Identify specific metadata for your data type (e.g., email headers, video timestamps)

3. **Validation**: Create appropriate validation rules for your data type

4. **UI Components**: Consider if you need specialized UI components for your data type

5. **Buffer Handling**: Remember that encrypted data is stored as Buffer objects and needs proper serialization/deserialization

## Example: Adding Email Ingestion

To add email support:

1. Create `emailUtils.ts` with functions to parse email structure and extract content
2. Extend `DocumentUploader` to accept `.eml` files
3. Create chunking logic that respects email structure (headers, body, attachments)
4. Reuse the Key Management Service's `encryptText`, `encryptMetadata`, and `generateBatchEmbeddings` functions
5. Update type definitions to include email-specific metadata

## Conclusion

The ingestion pipeline is designed to be extensible while maintaining strong security guarantees. By following the patterns established in the PDF processing pipeline, you can add support for new data types while reusing the core infrastructure for encryption, embedding, and storage.

Remember that the most important principle is maintaining the zero-trust architecture: all processing and encryption must happen client-side before data is sent to the server.