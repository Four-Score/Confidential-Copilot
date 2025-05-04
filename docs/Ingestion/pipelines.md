# Confidential-Copilot Ingestion Pipelines Documentation

## Overview

This document provides a comprehensive comparison of the two ingestion pipelines in Confidential-Copilot:

1. **Encrypted Ingestion Pipeline**: For sensitive data (PDFs), with full encryption of content, metadata, and vector embeddings
2. **Unencrypted Ingestion Pipeline**: For public data (websites), with encryption of vector embeddings only

Both pipelines follow similar processing flows but differ in their encryption approach and database storage locations.

## Database Structure

### Encrypted Pipeline Storage

**1. `documents` Table**
- Stores fully encrypted document content and metadata
- Key fields:
  - `id`: UUID primary key
  - `project_id`: UUID foreign key to projects table
  - `name`: TEXT (encrypted document name)
  - `type`: document_type ENUM ('pdf', 'link', 'video')
  - `upload_date`: TIMESTAMPTZ
  - `encrypted_content`: TEXT (encrypted document content)
  - `encrypted_metadata`: JSONB (encrypted document metadata)
  - `file_size`: INTEGER
  - `page_count`: INTEGER

**2. `vector_chunks` Table**
- Stores encrypted document chunks and their encrypted vector embeddings
- Key fields:
  - `id`: UUID primary key
  - `document_id`: UUID foreign key to documents table
  - `chunk_number`: INTEGER
  - `encrypted_chunk_content`: TEXT (encrypted chunk text)
  - `encrypted_embeddings`: VECTOR(384) (encrypted vector representation)
  - `metadata`: JSONB (encrypted chunk metadata)

### Unencrypted Pipeline Storage

**1. `v2_documents` Table**
- Stores unencrypted website content and metadata
- Key fields:
  - `id`: UUID primary key
  - `project_id`: UUID foreign key to projects table
  - `name`: TEXT (plaintext website name/title)
  - `type`: document_type ENUM ('website')
  - `upload_date`: TIMESTAMPTZ
  - `content`: TEXT (plaintext website content)
  - `metadata`: JSON (plaintext website metadata)
  - `file_size`: INTEGER
  - `page_count`: INTEGER (typically null for websites)

**2. `v2_vector_chunks` Table**
- Stores unencrypted chunks but encrypted vector embeddings
- Key fields:
  - `id`: UUID primary key
  - `document_id`: UUID foreign key to v2_documents table
  - `chunk_number`: INTEGER
  - `chunk_content`: TEXT (plaintext chunk text)
  - `encrypted_embeddings`: VECTOR(384) (encrypted vector representation)
  - `metadata`: JSON (plaintext chunk metadata)

## Data Flow Comparison

### Encrypted Pipeline (PDF Documents)

1. **File Upload & Validation**
   - Client uploads PDF file
   - File is validated through `validatePdfFile()` in pdfUtils.ts

2. **Text Extraction**
   - PDF content extracted client-side using `processPdfFile()` in pdfUtils.ts
   - Text is extracted by page with metadata

3. **Text Chunking**
   - Extracted text is divided into chunks using `chunkText()` in pdfUtils.ts
   - Each chunk maintains page number and position metadata

4. **Embedding Generation**
   - Vector embeddings are generated for each chunk using `generateBatchEmbeddings()` in embeddingUtils.ts
   - Uses MiniLM-L6-v2 model (384 dimensions)

5. **Encryption**
   - Content, metadata, and vector embeddings are ALL encrypted using:
     - `encryptText()`: Standard encryption for document content
     - `encryptMetadata()`: Deterministic encryption for metadata
     - `encryptVector()`: Special encryption for vector embeddings that preserves search capabilities
   - All encryption functions are in cryptoUtils.ts

6. **Storage**
   - Encrypted data is stored via `processDocument()` in clientProcessing.ts
   - Uses `insert_document_with_chunks` database function

7. **React Integration**
   - `processFile()` in useDocumentProcessor.ts manages the pipeline for React components

### Unencrypted Pipeline (Website Content)

1. **URL Validation**
   - Client submits URL
   - URL is validated using `validateWebsiteUrl()` in websiteUtils.ts

2. **Content Extraction**
   - Website content extracted via server proxy to bypass CORS
   - Uses `extractWebsiteContent()` in websiteUtils.ts
   - Proxy endpoint: route.ts

3. **Content Cleaning & Chunking**
   - HTML cleaned using `cleanHtmlContent()` 
   - Text chunked using `chunkWebsiteContent()` 
   - Both functions in websiteUtils.ts

4. **Embedding Generation**
   - Same process as encrypted pipeline
   - Uses identical `generateEmbedding()` function from embeddingUtils.ts

5. **Selective Encryption**
   - **Only vector embeddings are encrypted** using `encryptVector()`
   - Content and metadata remain unencrypted
   - Uses same encryption function as encrypted pipeline

6. **Storage**
   - Data is stored via `processWebsite()` in clientProcessing.ts
   - Uses `insert_website_with_chunks` database function

7. **React Integration**
   - `processWebsiteUrl()` in useDocumentProcessor.ts manages the pipeline for React components

## Key Similarities

1. **Client-Side Processing**: Both pipelines process data entirely client-side (Zero Trust approach)
2. **Chunking Strategy**: Both use similar chunking approaches with configurable overlap
3. **Embedding Model**: Both use the same embedding model (MiniLM-L6-v2)
4. **Vector Operations**: Both encrypt vector embeddings to enable secure similarity search
5. **Progress Tracking**: Both use the same progress tracking system
6. **Security Model**: Both maintain Row Level Security (RLS) policies for access control

## Key Differences

1. **Encryption Scope**:
   - Encrypted pipeline: ALL data encrypted (content, metadata, embeddings)
   - Unencrypted pipeline: ONLY embeddings encrypted

2. **Database Tables**:
   - Encrypted pipeline: `documents` and `vector_chunks`
   - Unencrypted pipeline: `v2_documents` and `v2_vector_chunks`

3. **Content Source**:
   - Encrypted pipeline: Local file upload
   - Unencrypted pipeline: Remote URL content extraction

4. **Database Functions**:
   - Encrypted pipeline: `insert_document_with_chunks`
   - Unencrypted pipeline: `insert_website_with_chunks`

## Vector Search Considerations

For performing vector search on either pipeline:

1. **Query Embedding Generation**: Generate vector embedding for search query using the same model

2. **Query Vector Encryption**:
   - Always encrypt the query vector using `encryptVector()` before search
   - This ensures compatibility with both pipelines

3. **Search Function**:
   - For encrypted data: Use `match_document_chunks` function (does not yet exist, to be implemented)
   - For unencrypted data: Use `match_v2_document_chunks` function (does not yet exist, to be implemented)

4. **Result Processing**:
   - For encrypted data: Decrypt chunk content using `decryptText()`
   - For unencrypted data: Use chunk content directly (no decryption needed)
   - For both: Sort by similarity score

## Key Management Service Integration

The Key Management Service (keyManagement) provides the cryptographic foundation for both pipelines:

1. **Key Components**:
   - `KeyManagementService.ts`: Core service that manages encryption keys
   - `DCPEWrapper.ts`: Wrapper for Deterministic Convergent Privacy Encryption
   - `WebCryptoProvider.ts`: Implements cryptographic operations

2. **Key Functions**:
   - `encryptText`: Standard encryption (used only in encrypted pipeline)
   - `encryptMetadata`: Deterministic encryption (used only in encrypted pipeline)
   - `encryptVector`: Vector encryption (used in both pipelines)
   - Corresponding decrypt functions for each

3. **Security Model**:
   - DCPE keys are encrypted with the user's symmetric key
   - Encryption/decryption happens entirely client-side
   - Key retrieval follows a prioritized strategy (database → localStorage → generate)

## Important API Endpoints

1. **Encrypted Pipeline**:
   - Document upload: route.ts
   - Document retrieval: route.ts

2. **Unencrypted Pipeline**:
   - Website submission: route.ts
   - Website retrieval: route.ts

## Conclusion

The two ingestion pipelines provide a flexible approach to handling different types of content:

- Use the **encrypted pipeline** for sensitive, private content that requires full encryption
- Use the **unencrypted pipeline** for public content where full encryption isn't necessary

Both pipelines maintain vector embedding encryption to enable secure vector search operations while respecting the different security requirements of different content types.