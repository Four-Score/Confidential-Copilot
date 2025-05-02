# WORK DONE TILL NOW FOR THE UNENCRYPTED INGESTION

# Database Setup and Function Implementation for Unencrypted Ingestion

1. Database Setup Implementation
(a) docs\database\v2_documents_and_vector_schema.txt:
This SQL script defines the schema for storing website data and its vector embeddings in a Supabase database, mirroring the existing encrypted document storage. It creates `v2_documents` (id UUID, project_id UUID, name TEXT, type document_type, upload_date TIMESTAMPTZ, content TEXT, metadata JSON, file_size INTEGER, page_count INTEGER) and `v2_vector_chunks` (id UUID, document_id UUID, chunk_number INTEGER, chunk_content TEXT, embeddings VECTOR(384), metadata JSON) tables, which store the website content and its vector embeddings, respectively, without encryption. Row Level Security (RLS) policies are implemented to ensure users can only access data within their projects. Additionally, it defines a function `match_v2_document_chunks` for performing similarity searches on the vector embeddings.

(b) docs\database\v2_function_insert_docs.txt:
 -- This PostgreSQL function, `insert_website_with_chunks`, is designed to insert a website document and its associated chunks into the `v2_documents` and `v2_vector_chunks` tables within a transaction; the `v2_documents` table includes columns for `project_id` (UUID), `name` (TEXT), `type` (document_type), `file_size` (INTEGER), `content` (TEXT), and `metadata` (JSON), while the `v2_vector_chunks` table contains `document_id` (UUID), `chunk_number` (INTEGER), `chunk_content` (TEXT), `embeddings` (vector), and `metadata` (JSON).


# Website Content Extraction Utilities
1. Website Utility Module Implementation
(a) Confidential-Copilot\src\lib\websiteUtils.ts:
websiteUtils.ts provides utilities for extracting and processing content from websites. It includes functions for validating URLs (`validateWebsiteUrl`), extracting content (`extractWebsiteContent`), cleaning HTML (`cleanHtmlContent`), chunking content (`chunkWebsiteContent`), and handling errors (`handleWebsiteError`). It also defines interfaces for website extraction results, metadata, and content chunks.


# Update Processing Pipeline
1. Modify Type Definitions
(a) Confidential-Copilot\src\types\document.ts:
document.ts defines TypeScript interfaces and types for handling both encrypted and unencrypted documents (specifically websites), including `Document`, `UnencryptedDocument`, `WebsiteMetadata`, `WebsiteChunk`, `WebsiteChunkMetadata`, `DocumentType`, and the `isUnencryptedDocument` type guard.

2. Extend Processing Pipeline with processWebsite Function
Confidential-Copilot\src\lib\clientProcessing.ts
**TBD**

3. Update Document Processing Hook
Confidential-Copilot\src\hooks\useDocumentProcessor.ts
useDocumentProcessor.ts is a React hook that manages the document and website processing workflows. It provides functions `processFile` and `processWebsiteUrl` to handle the respective processing logic, along with state variables like `isProcessing`, `progress`, `status`, and `error` to track the processing status. The hook utilizes clientProcessing.ts to perform the actual document and website processing, including encryption for documents and embedding generation for both.

# API Endpoints
1. Website Content Extraction API:
Confidential-Copilot\src\app\api\projects\[id]\websites\route.ts:
This route.ts file defines API endpoints for handling website ingestion in a Next.js application. It includes a `POST` endpoint for submitting a website URL, which validates the URL and initiates an extraction job. It also has a `GET` endpoint for listing websites associated with a specific project, including details like name, type, upload date, and metadata. The file uses `verifyProjectAccess` to ensure that the user has the correct permissions for the requested project.

 2. Individual Website API:
Confidential-Copilot\src\app\api\projects\[id]\websites\[websiteId]\route.ts:
This route.ts file defines API endpoints for retrieving and deleting website data within a project, using Next.js API routes and Supabase for database interactions and authentication. It includes a `verifyAccess` function to ensure that the user has the necessary permissions to access or modify the specified website. The `GET` endpoint retrieves website details, including metadata and chunk count, while the `DELETE` endpoint removes a website and its associated chunks from the database. Both endpoints perform authentication and access verification before executing their respective operations.

3. Adapt Progress Tracking API
(a) Confidential-Copilot\src\app\api\documents\progress\route.ts:
The route.ts file defines API endpoints for managing document upload progress in a Next.js application. It uses cookies for authentication with Supabase and provides `POST` and `GET` endpoints to update and retrieve the progress of document uploads, respectively. The progress is stored in an in-memory object `progressStore`, and a cleanup function `cleanupOldEntries` is used to remove old entries periodically.

(b) Confidential-Copilot\src\lib\processingUtils.ts:
processingUtils.ts provides client-side utilities for processing documents, including PDFs, with a focus on handling the processing lifecycle, managing progress, and integrating with server-side APIs. It includes functions for initiating a processing job (`initiateProcessingJob`), updating the processing progress (`updateProcessingProgress`), retrieving the processing status (`getProcessingStatus`), and cancelling a job (`cancelProcessingJob`). The file also contains the core logic for processing a PDF document (`processPdfDocument`), which involves extracting text, generating embeddings, encrypting content, and uploading the processed data to the server.

(c) Update the Website Processing Functions: Confidential-Copilot\src\lib\clientProcessing.ts:
clientProcessing.ts contains the client-side logic for processing both PDF documents and website content. It includes functions like `processDocument` for handling PDFs (extraction, chunking, embedding generation, encryption, and upload) and `processWebsite` for handling website content (extraction, chunking, embedding generation, and storage). It also defines interfaces for processing options and results for both document types, and utilizes utility functions from other modules for tasks like PDF and website content extraction, embedding generation, encryption, and progress reporting.


(d) Create a New API Route for Website Progress Status: Confidential-Copilot\src\app\api\websites\progress\route.ts:
This route.ts file defines a GET API endpoint for retrieving the processing status of a specific job (identified by `jobId`). It authenticates the user via Supabase, then makes an internal request to `/api/documents/progress` to fetch the status, and returns the status data as a JSON response. The function `GET` handles the request, using `createClient` to initialize the Supabase client and `NextResponse` to return JSON responses.

