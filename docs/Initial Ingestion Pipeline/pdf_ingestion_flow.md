# Comprehensive Data Flow in PDF Document Ingestion Pipeline

This analysis traces the complete data flow of a PDF document from initial upload through processing, storage, and retrieval in the Confidential-Copilot application, with precise details on functions, data types, and transformations at each step.

## 1. Initial Upload Process

### User Interface Interaction
1. User navigates to a project page (`src/app/projects/[id]/page.tsx`)
2. User clicks "Upload Document" button, opening the `DocumentUploader` component
3. Within `DocumentUploader`, the `FileUploader` component handles file selection:
   - Uses browser's native `File` object type
   - Supports drag-and-drop via `onDragOver`, `onDragLeave`, `onDrop` events
   - Validates file is PDF (`application/pdf` MIME type)

### Initial File Validation
1. When file is selected, `handleFileSelect(selectedFile: File)` in `DocumentUploader` stores it
2. On upload confirmation, `startUpload()` is called, which:
   - Creates an `AbortController` instance for cancellation support
   - Calls `processFile` from the `useDocumentProcessor` hook

## 2. Client-Side Processing Pipeline

### Processing Initialization
1. `processFile(projectId: string, file: File, options?: DocumentProcessingOptions)` function:
   - Returns `Promise<ProcessingResult>`
   - Uses symmetric encryption key from `useAuthStore`

2. `processDocument` function from clientProcessing.ts is called with:
   - `projectId`: string (UUID)
   - `file`: File (browser's File object)
   - `symmetricKey`: CryptoKey (from auth store)
   - `options`: DocumentProcessingOptions (optional configuration)

3. Job initialization:
   - Generates `jobId`: string (UUID v4)
   - Creates config via `getProcessingConfig` from processingConfig.ts
   - Calls `initiateProcessingJob(projectId, file.name, file.size, file.type, estimatedChunks)` 
   - Reports initial progress via `reportProgress('initialized', 0, 'Starting document processing')`

### PDF Processing & Text Extraction
1. PDF validation via `validatePdfFile(file, config.maxFileSize)` returning:
   ```typescript
   {
     valid: boolean,
     error?: string
   }
   ```

2. PDF text extraction via `processPdfFile(file, { chunkSize, chunkOverlap })` which:
   - Reads file as `ArrayBuffer`
   - Uses PDF.js to parse PDF content
   - Returns `PDFExtractionResult`:
   ```typescript
   {
     valid: boolean,
     error?: string,
     metadata?: { 
       pageCount: number,
       // other PDF metadata
     },
     chunks?: DocumentChunk[]
   }
   ```

### Text Chunking
1. During PDF processing, text is broken into chunks via `chunkText`:
   - Takes parameters: `text: string`, `metadata: object`, `chunkSize: number`, `chunkOverlap: number`
   - Uses sliding window approach to create chunks of specified size with overlap
   - Returns array of `DocumentChunk`:
   ```typescript
   {
     content: string,         // The chunk text content
     metadata: {
       chunkNumber: number,   // Index of this chunk
       pageNumber?: number,   // PDF page number
       documentId?: string    // Optional document reference
     }
   }
   ```
2. Progress is reported: `reportProgress('chunking', 25, 'Created ${extraction.chunks.length} text chunks')`

### Embedding Generation
1. Embeddings created via `generateBatchEmbeddings(extraction.chunks, config.embeddingBatchSize, progressCallback)`:
   - Uses `HuggingFaceTransformersEmbeddings` with "Xenova/all-MiniLM-L6-v2" model (384-dimension vectors)
   - Processes chunks in batches to avoid memory issues
   - Reports progress incrementally: `reportProgress('embedding', progressValue, 'Generating embeddings (x%)')`
   - Returns array of `ChunkWithEmbedding`:
   ```typescript
   {
     chunk: DocumentChunk,    // Original chunk with text and metadata
     embedding: number[]      // 384-dimensional vector representation
   }
   ```

### Encryption Process
1. Prepares metadata object:
   ```typescript
   const metadataObj = {
     originalName: string,    // file.name
     pageCount: number,       // extraction.metadata.pageCount
     created: string,         // ISO date string
     fileType: string,        // file.type
     chunkCount: number       // extraction.chunks.length
   }
   ```

2. Encryption operations (using functions from encryptionUtils.ts):
   - Document name: `encryptedName = await encryptMetadata(file.name, symmetricKey)` → string
   - Metadata fields:
     ```typescript
     const encryptedMetadata = {
       originalName: await encryptMetadata(metadataObj.originalName, symmetricKey), // string
       pageCount: number,     // Not encrypted (non-sensitive)
       created: string,       // Not encrypted (non-sensitive)
       fileType: string,      // Not encrypted (non-sensitive)
       chunkCount: number     // Not encrypted (non-sensitive)
     }
     ```
   - Full document content: `encryptedContent = await encryptText(fullText, symmetricKey)` → string
   - For each chunk:
     ```typescript
     {
       chunkNumber: number,   // Index of chunk
       encryptedContent: await encryptText(item.chunk.content, symmetricKey), // string
       encryptedEmbeddings: await encryptVector(item.embedding, symmetricKey), // number[]
       metadata: {
         chunkNumber: number,
         pageNumber: number
       }
     }
     ```

3. Progress reporting: `reportProgress('encrypting', progressValue, 'Encrypting chunk x/y')`

### Upload to Server
1. Prepares upload payload:
   ```typescript
   const uploadPayload = {
     name: string,            // Encrypted document name
     originalName: string,    // Encrypted original name
     type: 'pdf',
     fileSize: number,
     pageCount: number,
     encryptedContent: string, // Encrypted full document text
     encryptedMetadata: object, // Object with encrypted fields
     chunks: [                // Array of encrypted chunks
       {
         chunkNumber: number,
         encryptedContent: string,
         encryptedEmbeddings: number[],
         metadata: {
           chunkNumber: number,
           pageNumber: number
         }
       },
       // More chunks...
     ]
   }
   ```

2. Sends data to server:
   - `fetch` POST request to `/api/projects/${projectId}/documents`
   - Content-Type: `application/json`
   - Reports progress: `reportProgress('uploading', 85, 'Uploading encrypted document')`
   - Receives response with `documentId` (string, UUID)

3. Final processing result:
   ```typescript
   {
     documentId: string,      // UUID from server
     success: boolean,
     metadata?: {
       chunkCount: number,
       embeddingsGenerated: number,
       processingTimeMs: number
     }
   }
   ```

## 3. Server-Side Data Storage

### API Endpoint Processing
1. In route.ts, the POST handler:
   - Authenticates user via Supabase: `supabase.auth.getUser()`
   - Verifies project ownership
   - Extracts data from request body including chunks array

### Database Transaction Processing
1. Using the `insert_document_with_chunks` database function:
   ```typescript
   const { data, error } = await supabase.rpc(
     'insert_document_with_chunks',
     {
       p_project_id: projectId,
       p_name: name,
       p_original_name: originalName || name,
       p_type: type,
       p_file_size: fileSize,
       p_page_count: pageCount || 1,
       p_encrypted_content: encryptedContent,
       p_encrypted_metadata: encryptedMetadata || {},
       p_chunks: chunks // Passed directly as a JSONB array
     }
   );
   ```

2. This function executes a transaction that:
   - Inserts document record into `documents` table:
     ```sql
     -- Simplified SQL structure
     INSERT INTO public.documents (
       project_id, name, type, file_size, 
       page_count, encrypted_content, encrypted_metadata
     ) VALUES (...) RETURNING id INTO v_document_id;
     ```

   - For each chunk, inserts into `vector_chunks` table:
     ```sql
     -- Simplified SQL structure
     INSERT INTO public.vector_chunks (
       document_id, chunk_number, encrypted_chunk_content,
       encrypted_embeddings, metadata
     ) VALUES (...);
     ```

3. The API returns a response with:
   ```typescript
   {
     documentId: data.id,
     success: true
   }
   ```

### Document Retrieval Architecture
1. Document details are retrieved through project-scoped endpoints:
   - `GET /api/projects/${projectId}/documents/${documentId}` - Get details of a specific document
   - `GET /api/projects/${projectId}/documents` - List all documents in a project

2. Error handling in document metadata decryption:
   - Gracefully handles malformed encrypted data
   - Validates encryption format before attempting decryption
   - Falls back to returning original values when decryption fails

### Database Schema
1. `documents` table structure:
   - `id`: UUID (primary key) - `gen_random_uuid()`
   - `project_id`: UUID (foreign key to projects)
   - `name`: TEXT (encrypted document name)
   - `type`: document_type ENUM ('pdf', 'link', 'video')
   - `upload_date`: TIMESTAMPTZ - `NOW()`
   - `encrypted_content`: TEXT (encrypted full document text)
   - `encrypted_metadata`: JSONB (object with encrypted metadata)
   - `file_size`: INTEGER (file size in bytes)
   - `page_count`: INTEGER (number of pages)

2. `vector_chunks` table structure:
   - `id`: UUID (primary key) - `gen_random_uuid()`
   - `document_id`: UUID (foreign key to documents)
   - `chunk_number`: INTEGER (chunk sequence number)
   - `encrypted_chunk_content`: TEXT (encrypted chunk text)
   - `encrypted_embeddings`: VECTOR(384) (encrypted vector for similarity search)
   - `metadata`: JSONB (chunk metadata including page number)

## 4. Document Retrieval & Display

### Retrieving Document List
1. `ProjectPage` component in page.tsx fetches:
   - Project details from `/api/projects/${id}`
   - Document list from `/api/projects/${id}/documents`

2. In route.ts, the GET handler:
   - Authenticates user
   - Queries documents table:
     ```typescript
     const { data: documents } = await supabase
       .from('documents')
       .select('id, name, type, upload_date, file_size, page_count')
       .eq('project_id', projectId)
       .order('upload_date', { ascending: false });
     ```
   - Returns document array to client


### Buffer Serialization Handling

1. During document retrieval, encrypted data is stored and returned as serialized Buffer objects:
   ```json
   {"type":"Buffer","data":[119,68,84,137,...]}
   ```

2. The `encryptionUtils.ts` file's `decryptMetadata` function handles three cases:
   - Serialized Buffer objects (`{type:"Buffer", data:[...]}`)
   - Stringified serialized Buffer objects (as JSON strings)
   - Direct Buffer objects

3. The decryption process:
   - Detects the format of the encrypted data
   - Converts serialized Buffer representations back to actual Buffer objects
   - Passes the proper Buffer to the DCPE library for decryption
   - Returns the decrypted plaintext

### Document Display Processing
1. Documents are passed to `DocumentList` component which:
   - Maps each document to a `DocumentCard` component
   - Handles sorting, filtering, and search

2. For each document, `DocumentCard`:
   - Decrypts document name: `encryptionService.decryptMetadata(document.name)`
   - Formats file size and date for display
   - Provides delete functionality

### Individual Document Retrieval
1. When retrieving single document details via `/api/documents/${id}`:
   - Server fetches document with project relation:
     ```typescript
     const { data: document } = await supabase
       .from('documents')
       .select(`
         id, name, type, upload_date, encrypted_content,
         encrypted_metadata, file_size, page_count,
         project_id, projects:project_id (name, user_id)
       `)
       .eq('id', documentId)
       .single();
     ```
   - Also counts associated chunks:
     ```typescript
     const { count: chunkCount } = await supabase
       .from('vector_chunks')
       .select('id', { count: 'exact', head: true })
       .eq('document_id', documentId);
     ```

2. Before displaying, client-side decryption:
   - Document name: `encryptionService.decryptMetadata(document.name)`
   - If needed, document content: `encryptionService.decryptText(document.encrypted_content)`
   - If needed, chunk content: `encryptionService.decryptText(chunk.encrypted_chunk_content)`

This comprehensive flow ensures that document data is securely processed, encrypted before transmission, stored in encrypted form, and only decrypted client-side when needed for display.