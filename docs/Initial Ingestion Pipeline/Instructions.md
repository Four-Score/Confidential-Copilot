# Extending the Confidential-Copilot Ingestion Pipeline

## Introduction

This guide provides a comprehensive walkthrough for extending the Confidential-Copilot ingestion pipeline to support additional data types beyond PDFs. The existing pipeline demonstrates how documents can be securely processed, encrypted, and stored while maintaining zero-trust principles. By following this guide, you'll be able to add support for new data types (emails, YouTube transcripts, web pages, etc.) while reusing much of the existing infrastructure.

## Architecture Overview

Our ingestion pipeline follows these core principles:

1. **Zero-Trust Architecture**: No unencrypted user data ever leaves the client
2. **Client-Side Processing**: All extraction, chunking, embedding, and encryption happens in the browser
3. **End-to-End Encryption**: Data is encrypted before storage and only decrypted on the client

### High-Level Flow

```
User Upload → Client-Side Processing → Encryption → Server Storage → Retrieval → Client-Side Decryption → Display
```

### System Components

The pipeline consists of these major components:

1. **Data Extraction**: Type-specific modules for extracting content (e.g., pdfUtils.ts)
2. **Processing Pipeline**: Orchestration layer that handles the workflow (clientProcessing.ts)
3. **Encryption Layer**: Key Management Service for encrypting data (services/keyManagement)
4. **Embedding Generation**: Creates vector embeddings for search (embeddingUtils.ts)
5. **Storage Layer**: API endpoints and database structure for storing encrypted data
6. **UI Components**: User interface for uploading and displaying content

## What to Reuse vs. What to Extend

### Components You Can Reuse Without Modification

1. **Key Management Service** (`src/services/keyManagement/`)
   - The entire service can be reused as-is
   - Core encryption functions:
     - `encryptText`: For standard encryption of content
     - `encryptMetadata`: For deterministic encryption of searchable fields
     - `encryptVector`: For vector embeddings
   - React hook: `useKeyManagement`

2. **Embedding Generation** (`src/lib/embeddingUtils.ts`)
   - `generateEmbedding`: For single text embeddings
   - `generateBatchEmbeddings`: For processing multiple chunks
   - `normalizeVector` and `cosineSimilarity` utilities

3. **Progress Tracking** (`src/lib/processingUtils.ts`)
   - `initiateProcessingJob`
   - `updateProcessingProgress`
   - `cancelProcessingJob`

4. **API Endpoints**
   - Document storage endpoints
   - Processing status endpoints
   - Database schemas and tables

5. **UI Components**
   - `ProgressBar.tsx`
   - `ErrorDisplay.tsx`
   - Document list and project-related components

### Components You Need to Extend or Create

1. **Data Type-Specific Utils** (Create new: `src/lib/[dataType]Utils.ts`)
   - You must implement:
     - `validate[DataType]File/Data`: For validation
     - `extract[DataType]Content`: For content extraction
     - `chunk[DataType]`: For data-appropriate chunking
   - These are entirely data-type specific and should be created from scratch

2. **Document Uploader** (Extend: `src/components/documents/DocumentUploader.tsx`)
   - Add support for new MIME types/content formats
   - Update file validation
   - Add custom preview components if needed

3. **Processing Pipeline** (Extend: `src/lib/clientProcessing.ts`)
   - Create a new processing function like `process[DataType]Document`
   - Or extend the existing `processDocument` to handle multiple types

4. **Type Definitions** (Create or extend: `src/types/document.ts`)
   - Add new types or interfaces for your data type
   - Define metadata structure specific to your content type

## Step-by-Step Guide to Adding a New Data Type

### Step 1: Create Data Extraction Utilities

Create a new file `src/lib/[dataType]Utils.ts` with these functions:

```typescript
// Example for email: src/lib/emailUtils.ts
import { Document } from "@/types/document";

// Define constants
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB for emails
export const DEFAULT_CHUNK_SIZE = 1000;
export const DEFAULT_CHUNK_OVERLAP = 200;

// Define interfaces
export interface EmailExtractionResult {
  valid: boolean;
  error?: string;
  metadata?: {
    from: string;
    to: string[];
    subject: string;
    date: string;
    // other email-specific metadata
  };
  chunks?: EmailChunk[];
}

export interface EmailChunk {
  content: string;
  metadata: {
    chunkNumber: number;
    section: string; // e.g., 'header', 'body', 'attachment'
    // other email-specific chunk metadata
  };
}

// Validation function
export function validateEmailFile(file: File): { valid: boolean; error?: string } {
  // Check MIME type
  if (file.type !== 'message/rfc822') {
    return { valid: false, error: 'File is not a valid email (.eml) file.' };
  }
  
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `File size exceeds maximum allowed (${MAX_FILE_SIZE / (1024 * 1024)}MB).` };
  }
  
  return { valid: true };
}

// Content extraction function
export async function extractEmailContent(file: File): Promise<EmailExtractionResult> {
  try {
    const text = await file.text();
    // Parse email content - implement email parsing logic here
    // This would extract headers, body, attachments
    
    // Example structure:
    const metadata = {
      from: "extracted-from@example.com",
      to: ["recipient@example.com"],
      subject: "Email Subject",
      date: new Date().toISOString(),
      // other metadata
    };
    
    return {
      valid: true,
      metadata,
      chunks: await chunkEmailContent(text, metadata)
    };
  } catch (error) {
    return {
      valid: false,
      error: `Error extracting email content: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

// Chunking function - content-specific
export async function chunkEmailContent(
  text: string,
  metadata: any,
  chunkSize: number = DEFAULT_CHUNK_SIZE,
  chunkOverlap: number = DEFAULT_CHUNK_OVERLAP
): Promise<EmailChunk[]> {
  const chunks: EmailChunk[] = [];
  
  // Email-specific chunking logic here
  // For emails, you might want to chunk differently:
  // 1. Headers as one chunk
  // 2. Body paragraphs as separate chunks
  // 3. Each attachment as its own chunk
  
  // Example implementation:
  // This is simplified - you'd need proper email parsing
  const headerEnd = text.indexOf("\n\n");
  const header = text.substring(0, headerEnd);
  const body = text.substring(headerEnd + 2);
  
  // Add header as first chunk
  chunks.push({
    content: header,
    metadata: {
      chunkNumber: 0,
      section: 'header'
    }
  });
  
  // Chunk body with overlap
  let chunkNumber = 1;
  for (let start = 0; start < body.length; start += (chunkSize - chunkOverlap)) {
    const end = Math.min(start + chunkSize, body.length);
    const chunkText = body.slice(start, end);
    
    chunks.push({
      content: chunkText,
      metadata: {
        chunkNumber,
        section: 'body'
      }
    });
    
    chunkNumber++;
  }
  
  return chunks;
}

// Main processing function
export async function processEmailFile(
  file: File,
  options: { chunkSize?: number; chunkOverlap?: number } = {}
): Promise<EmailExtractionResult> {
  // Validate file
  const validationResult = validateEmailFile(file);
  if (!validationResult.valid) {
    return {
      valid: false,
      error: validationResult.error
    };
  }
  
  // Extract content
  const extraction = await extractEmailContent(file);
  if (!extraction.valid) {
    return extraction;
  }
  
  // Use provided options or defaults
  const chunkSize = options.chunkSize || DEFAULT_CHUNK_SIZE;
  const chunkOverlap = options.chunkOverlap || DEFAULT_CHUNK_OVERLAP;
  
  // Process chunks if not already done
  if (!extraction.chunks) {
    const chunks = await chunkEmailContent(
      // You'd need to extract the raw text here
      "raw email text",
      extraction.metadata,
      chunkSize,
      chunkOverlap
    );
    
    extraction.chunks = chunks;
  }
  
  return extraction;
}
```

### Step 2: Create or Extend Type Definitions

Update or create the necessary type definitions in `src/types`:

```typescript
// In src/types/document.ts (extend)
export type DocumentType = 'pdf' | 'email' | 'webpage' | 'video';

// Add email-specific interfaces
export interface EmailMetadata {
  from: string;
  to: string[];
  subject: string;
  date: string;
  hasAttachments: boolean;
  attachmentCount?: number;
  // other email-specific fields
}
```

### Step 3: Update the Processing Pipeline

Modify the client-side processing in one of two ways:

**Option A: Extend the existing processDocument function**

```typescript
// In src/lib/clientProcessing.ts
import { processEmailFile, EmailExtractionResult } from './emailUtils';

// Extend the existing function to handle multiple file types
export async function processDocument(
  projectId: string,
  file: File,
  symmetricKey: CryptoKey,
  options: DocumentProcessingOptions = {}
): Promise<ProcessingResult> {
  // ... existing code

  // Determine file type and use appropriate processing
  let extractionResult;
  if (file.type === 'application/pdf') {
    // Existing PDF processing
    extractionResult = await processPdfFile(
      file,
      { chunkSize: config.chunkSize, chunkOverlap: config.chunkOverlap }
    );
  } else if (file.type === 'message/rfc822') {
    // New email processing
    extractionResult = await processEmailFile(
      file,
      { chunkSize: config.chunkSize, chunkOverlap: config.chunkOverlap }
    );
  } else {
    throw new Error(`Unsupported file type: ${file.type}`);
  }

  // ... rest of the function can largely remain the same
  // as the extraction result structure is compatible
}
```

**Option B: Create a specialized processing function**

```typescript
// In src/lib/clientProcessing.ts
import { processEmailFile, EmailExtractionResult } from './emailUtils';

// Create a specialized function for email processing
export async function processEmailDocument(
  projectId: string,
  file: File,
  symmetricKey: CryptoKey,
  options: DocumentProcessingOptions = {}
): Promise<ProcessingResult> {
  // Similar structure to processDocument but email-specific
  // ...

  const extractionResult = await processEmailFile(
    file,
    { chunkSize: config.chunkSize, chunkOverlap: config.chunkOverlap }
  );

  // ... encryption and storage code, similar to processDocument
}
```

### Step 4: Update Document Uploader Component

Extend the DocumentUploader component to handle new file types:

```typescript
// In src/components/documents/DocumentUploader.tsx

// Add new accepted file types
const ACCEPTED_FILE_TYPES = {
  'application/pdf': 'PDF Document',
  'message/rfc822': 'Email File (.eml)',
  'text/html': 'Webpage'
  // Add more as needed
};

// Update the startUpload function to use the appropriate processor
const startUpload = async () => {
  // ...existing code

  try {
    let result;
    
    // Use different processing functions based on file type
    if (selectedFile.type === 'application/pdf') {
      result = await processFile(projectId, selectedFile, {
        signal: abortController.current?.signal
      });
    } else if (selectedFile.type === 'message/rfc822') {
      // Either use the extended processFile function if it handles multiple types
      // Or use a specialized function
      result = await processEmailFile(projectId, selectedFile, {
        signal: abortController.current?.signal
      });
    }
    
    // ...rest of the function
  } catch (error) {
    // ...error handling
  }
};

// Add type-specific preview components
const renderPreview = () => {
  if (!selectedFile) return null;
  
  if (selectedFile.type === 'application/pdf') {
    return <PDFPreview file={selectedFile} />;
  } else if (selectedFile.type === 'message/rfc822') {
    return <EmailPreview file={selectedFile} />;
  }
  
  return <div>No preview available for this file type.</div>;
};
```

### Step 5: Create Preview Components for Your Data Type

Add specialized preview components for your data type:

```typescript
// In src/components/uploads/EmailPreview.tsx
import { useState, useEffect } from 'react';

interface EmailPreviewProps {
  file: File;
}

export function EmailPreview({ file }: EmailPreviewProps) {
  const [previewData, setPreviewData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const loadPreview = async () => {
      try {
        const text = await file.text();
        // Basic extraction of email headers for preview
        const headers: Record<string, string> = {};
        const headerLines = text.split('\n\n')[0].split('\n');
        
        headerLines.forEach(line => {
          const colonIndex = line.indexOf(':');
          if (colonIndex > 0) {
            const key = line.substring(0, colonIndex).trim();
            const value = line.substring(colonIndex + 1).trim();
            headers[key.toLowerCase()] = value;
          }
        });
        
        setPreviewData(headers);
      } catch (err) {
        setError(`Failed to load email preview: ${err}`);
      }
    };
    
    loadPreview();
  }, [file]);
  
  if (error) {
    return <div className="error-message">{error}</div>;
  }
  
  if (!previewData) {
    return <div>Loading email preview...</div>;
  }
  
  return (
    <div className="email-preview">
      <h3>Email Preview</h3>
      <table>
        <tbody>
          <tr>
            <td><strong>From:</strong></td>
            <td>{previewData.from || 'Unknown'}</td>
          </tr>
          <tr>
            <td><strong>To:</strong></td>
            <td>{previewData.to || 'Unknown'}</td>
          </tr>
          <tr>
            <td><strong>Subject:</strong></td>
            <td>{previewData.subject || 'No subject'}</td>
          </tr>
          <tr>
            <td><strong>Date:</strong></td>
            <td>{previewData.date || 'Unknown'}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
```

### Step 6: Update the Document Processor Hook

If you created specialized processing functions, update the document processor hook:

```typescript
// In src/hooks/useDocumentProcessor.ts
import { processDocument, processEmailDocument } from '@/lib/clientProcessing';

// Add new processor methods
export function useDocumentProcessor() {
  // ...existing code

  const processFile = async (projectId: string, file: File, options?: DocumentProcessingOptions) => {
    // ...existing code
    
    try {
      let result;
      
      // Use appropriate processor based on file type
      if (file.type === 'application/pdf') {
        result = await processDocument(projectId, file, symmetricKey!, options);
      } else if (file.type === 'message/rfc822') {
        result = await processEmailDocument(projectId, file, symmetricKey!, options);
      } else {
        throw new Error(`Unsupported file type: ${file.type}`);
      }
      
      // ...rest of the function
    } catch (error) {
      // ...error handling
    }
  };

  // Alternatively, add a specialized method
  const processEmailFile = async (projectId: string, file: File, options?: DocumentProcessingOptions) => {
    // Similar to processFile but specific to emails
    // ...
  };

  return {
    processFile,
    processEmailFile, // If you added this specialized method
    status,
    progress,
    error,
    resetStatus
  };
}
```

## Practical Example: Adding Support for Email (.eml) Files

Let's walk through the complete process of adding support for email (.eml) files:

1. **Create EmailUtils.ts**
   - Implement email-specific validation
   - Implement content extraction with email parsing
   - Implement chunking strategy that respects email structure
   - See Step 1 above for the code example

2. **Update Document Types**
   ```typescript
   // In src/types/document.ts
   export type DocumentType = 'pdf' | 'email' | 'webpage' | 'video';
   
   export interface EmailDocument extends Document {
     type: 'email';
     encrypted_metadata: {
       from: string;
       to: string[];
       subject: string;
       date: string;
       // other fields
     };
   }
   ```

3. **Update File Upload Component**
   ```typescript
   // In FileUploader.tsx
   const ACCEPTED_TYPES = {
     'application/pdf': '.pdf',
     'message/rfc822': '.eml'
   };
   
   // Update validation
   const validateFile = (file: File) => {
     if (file.type === 'application/pdf') {
       return validatePdfFile(file);
     } else if (file.type === 'message/rfc822') {
       return validateEmailFile(file);
     }
     return { valid: false, error: 'Unsupported file type' };
   };
   ```

4. **Create Email Preview Component**
   - Create src/components/uploads/EmailPreview.tsx
   - See Step 5 above for the code example

5. **Update DocumentUploader Component**
   - Add support for .eml files
   - Use the appropriate preview component
   - See Step 4 above for the code example

6. **Update Processing Pipeline**
   - Extend processDocument or create a specialized function
   - See Step 3 above for both options

7. **Reuse Key Management Service**
   - Continue using the same encryption functions:
   ```typescript
   const encryptedEmailContent = await encryptText(emailText, symmetricKey);
   const encryptedSubject = await encryptMetadata(email.subject, symmetricKey);
   ```

8. **Reuse Embedding Generation**
   ```typescript
   const embeddings = await generateBatchEmbeddings(emailChunks);
   ```

## Common Pitfalls and Solutions

1. **Problem**: Chunking strategy doesn't match content structure
   **Solution**: Create content-specific chunking strategies (e.g., email by section, webpages by HTML elements)

2. **Problem**: Metadata structure doesn't fit the new data type
   **Solution**: Define data type-specific metadata interfaces and ensure they're properly encrypted

3. **Problem**: Unable to generate meaningful previews
   **Solution**: Create specialized preview components that extract the most important information

4. **Problem**: File size limitations for browser processing
   **Solution**: Implement streaming approaches or chunked processing for large files

5. **Problem**: MIME type detection issues
   **Solution**: Add fallback detection methods beyond just checking file.type

## Best Practices

1. **Maintain Zero-Trust**: Keep all processing and encryption client-side
2. **Consistent Interface**: Make your utils match the pattern of existing ones
3. **Reuse Components**: Use the Key Management Service and embedding utilities as-is
4. **Clear Type Definitions**: Define proper interfaces for your data types
5. **Comprehensive Testing**: Test your pipeline with various sizes and formats
6. **Progressive Enhancement**: Add features incrementally and test thoroughly

## Conclusion

Extending the Confidential-Copilot ingestion pipeline for new data types is primarily about creating data-specific extraction and chunking utilities, while reusing the existing infrastructure for encryption, embedding generation, and storage. By following this guide, you can add support for virtually any content type while maintaining the zero-trust architecture and security guarantees of the system.

Remember these key points:

1. Create dedicated utilities for your data type's unique processing needs
2. Update or extend the types and interfaces to support your data structure
3. Modify the upload and preview components to handle your file type
4. Reuse the Key Management Service and embedding generation as-is
5. Test your implementation thoroughly, particularly for larger files