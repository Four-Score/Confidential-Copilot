# WORK DONE TILL NOW FOR THE UNENCRYPTED INGESTION

# Database Setup and Function Implementation for Unencrypted Ingestion

1. Database Setup Implementation
(a) docs\database\v2_documents_and_vector_schema.txt:
This SQL script defines the schema for storing website data and its vector embeddings in a Supabase database, mirroring the existing encrypted document storage. It creates `v2_documents` (id UUID, project_id UUID, name TEXT, type document_type, upload_date TIMESTAMPTZ, content TEXT, metadata JSON, file_size INTEGER, page_count INTEGER) and `v2_vector_chunks` (id UUID, document_id UUID, chunk_number INTEGER, chunk_content TEXT, encrypted_embeddings VECTOR(384), metadata JSON) tables, which store the website content and its vector embeddings, respectively, with only the vector embeddings being encrypted to enable proper vector search functionality. Row Level Security (RLS) policies are implemented to ensure users can only access data within their projects. Additionally, it defines a function `match_v2_document_chunks` for performing similarity searches on the encrypted vector embeddings.

(b) docs\database\v2_function_insert_docs.txt:
 -- This PostgreSQL function, `insert_website_with_chunks`, is designed to insert a website document and its associated chunks into the `v2_documents` and `v2_vector_chunks` tables within a transaction; the `v2_documents` table includes columns for `project_id` (UUID), `name` (TEXT), `type` (document_type), `file_size` (INTEGER), `content` (TEXT), and `metadata` (JSON), while the `v2_vector_chunks` table contains `document_id` (UUID), `chunk_number` (INTEGER), `chunk_content` (TEXT), `encrypted_embeddings` (vector), and `metadata` (JSON).


# Website Content Extraction Utilities
1. Website Utility Module Implementation
(a) Confidential-Copilot\src\lib\websiteUtils.ts:
websiteUtils.ts provides utilities for extracting and processing content from websites. It includes functions for validating URLs (`validateWebsiteUrl`), extracting content (`extractWebsiteContent`), cleaning HTML (`cleanHtmlContent`), chunking content (`chunkWebsiteContent`), and handling errors (`handleWebsiteError`). It also defines interfaces for website extraction results, metadata, and content chunks.

2. API Proxy for CORS Bypass
(a) Confidential-Copilot\src\app\api\proxy\website\route.ts:
This server-side endpoint acts as a proxy for website content retrieval, solving CORS issues that occur when directly requesting external website content from client-side code. It receives a URL in the request body, fetches the website content server-side using axios (avoiding browser CORS restrictions), extracts basic metadata with cheerio, and returns both the HTML content and metadata to the client. Authentication via Supabase ensures only authorized users can use the proxy.

(b) Confidential-Copilot\src\app\api\proxy\website\validate\route.ts:
A validation endpoint that checks if a provided URL is accessible without triggering CORS issues. It performs a HEAD request to the target website to verify availability, returning validation status that client-side code can use before attempting full content extraction. Like the main proxy endpoint, it requires authentication to prevent abuse.


# Update Processing Pipeline
1. Modify Type Definitions
(a) Confidential-Copilot\src\types\document.ts:
document.ts defines TypeScript interfaces and types for handling both encrypted and unencrypted documents (specifically websites), including `Document`, `UnencryptedDocument`, `WebsiteMetadata`, `WebsiteChunk`, `WebsiteChunkMetadata`, `DocumentType`, and the `isUnencryptedDocument` type guard.

2. Extend Processing Pipeline with processWebsite Function
(a) Confidential-Copilot\src\lib\clientProcessing.ts:
clientProcessing.ts contains the client-side logic for processing both PDF documents and website content. For website content, the `processWebsite` function handles the complete processing workflow: URL validation, content extraction, text chunking, embedding generation, and storage. While website content and metadata remain unencrypted due to their public nature, the vector embeddings are encrypted using the same `encryptVector` function used for PDF documents. This strategic encryption of vector embeddings only ensures that vector search functions properly when clients send encrypted query vectors, maintaining consistency with the existing search functionality. The processed website content is then stored in the `v2_documents` table and the chunks with encrypted embeddings in the `v2_vector_chunks` table, enabling semantic search over the public content while preserving the zero-trust architecture.

3. Update Document Processing Hook
(a) Confidential-Copilot\src\hooks\useDocumentProcessor.ts
useDocumentProcessor.ts is a React hook that manages the document and website processing workflows. It provides functions `processFile` and `processWebsiteUrl` to handle the respective processing logic, along with state variables like `isProcessing`, `progress`, `status`, and `error` to track the processing status. For websites, the hook integrates with the `processWebsite` function from clientProcessing.ts, which extracts content and generates embeddings, encrypting only the vector embeddings (not the content or metadata) before storage. This approach maintains the search capability while acknowledging that website content is already public.

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
clientProcessing.ts contains the client-side logic for processing both PDF documents and website content. It includes functions like `processDocument` for handling PDFs (extraction, chunking, embedding generation, encryption, and upload) and `processWebsite` for handling website content (extraction, chunking, embedding generation, and storage). For website content, only the vector embeddings are encrypted to ensure compatibility with the search functionality, while the content and metadata remain unencrypted since they're from public websites. The function utilizes utility functions from other modules for tasks like PDF and website content extraction, embedding generation, encryption, and progress reporting.

(d) Create a New API Route for Website Progress Status: Confidential-Copilot\src\app\api\websites\progress\route.ts:
This route.ts file defines a GET API endpoint for retrieving the processing status of a specific job (identified by `jobId`). It authenticates the user via Supabase, then makes an internal request to `/api/documents/progress` to fetch the status, and returns the status data as a JSON response. The function `GET` handles the request, using `createClient` to initialize the Supabase client and `NextResponse` to return JSON responses.

# Frontend Components Implementation
1. URL Input Component
(a) Confidential-Copilot\src\components\website\WebsiteUrlInput.tsx:
WebsiteUrlInput.tsx is a React component that provides a form for users to submit website URLs for processing. It handles URL validation using the `validateWebsiteUrl` function from websiteUtils.ts, displaying appropriate validation messages and errors. The component features loading states during validation and processing, a progress bar showing website extraction progress, and error handling. It has a clean interface with cancel and submit buttons, and smoothly transitions between input and processing states.

2. Website Preview Component
(a) Confidential-Copilot\src\components\website\WebsitePreview.tsx:
WebsitePreview.tsx is a React component that displays a preview of a website before processing, showing the website's favicon and domain name. It uses Google's favicon service to fetch icons based on the domain and handles loading states and errors gracefully. The component provides visual feedback about the website to be processed and includes a note explaining that website content isn't encrypted since it's publicly available.

3. Updated Project Page
(a) Confidential-Copilot\src\app\projects\[id]\page.tsx:
The ProjectPage component has been enhanced to support website content ingestion alongside the existing PDF document upload functionality. It now includes state management for websites (`websites`, `showWebsiteInput`, `websiteSuccess`, `uploadedWebsite`, `currentUrl`), handlers for website operations (`handleWebsiteProcessed`, `handleWebsiteInputCancel`, `handleUrlSubmit`, `handleDeleteWebsite`), and UI flows for the website ingestion process. The data ingestion buttons now include an active website ingestion option that shows the WebsiteUrlInput component when clicked. The page handles the complete lifecycle of website processing, from URL submission to successful addition to the project.

# Document Display Components Implementation

1. Website Card Component
(a) Confidential-Copilot\src\components\websites\WebsiteCard.tsx:
The WebsiteCard.tsx component is designed to display website entries in a consistent, user-friendly format. It handles the presentation of unencrypted website documents, showing key metadata such as website title, favicon, URL, file size, and upload date. The component includes deletion functionality with a confirmation dialog similar to DocumentCard, ensuring a consistent user experience across document types. The component dynamically fetches website favicons using Google's favicon service as a fallback when no explicit favicon is provided in the metadata. It also properly formats file sizes and dates for readability, and provides clickable URL links to the original website source.

2. Document List Enhancement
(a) Confidential-Copilot\src\components\documents\DocumentList.tsx:
The DocumentList.tsx component has been extended to handle both encrypted documents (PDFs) and unencrypted documents (websites). The updates enable unified display, filtering, and sorting for all document types in a project. Key features include:
- A type filtering system allowing users to focus on specific document types
- Conditional rendering of either DocumentCard or WebsiteCard based on the document type
- Enhanced search functionality that works across both document types
- Consistent sorting options for both PDFs and websites
- Proper handling of separate deletion endpoints for different document types through the onDelete and onWebsiteDelete props

3. Project Page Integration
(a) Confidential-Copilot\src\app\projects\[id]\page.tsx:
The ProjectPage component has been updated to integrate both document types into a unified view. It now combines the arrays of encrypted documents and unencrypted websites into a single collection for display, while maintaining separate state management for each type. The page properly dispatches deletion requests to the appropriate API endpoints based on document type, and displays a more inclusive heading ("Documents & Websites") to reflect the combined content view. The empty state message has also been updated to acknowledge both content types.

These updates complete Phase 6 of the Website Content Ingestion Pipeline implementation plan, providing users with a consistent interface for viewing and managing both encrypted PDF documents and unencrypted website content within the same project view.

