# YouTube Transcript Ingestion Feature

## Overview

This feature allows users to ingest YouTube video transcripts into the platform, chunk and embed the transcript client-side, and store both the document and its vectorized chunks in the database for semantic search and retrieval.

---

## Architecture

**Client Side:**
- Fetches transcript and video metadata.
- Chunks transcript into overlapping segments.
- Generates embeddings for each chunk (sequentially, to avoid session errors).
- Encrypts embeddings.
- Sends the document and all chunks to the `/api/projects/[id]/youtube-ingest` API.

**Server Side:**
- Receives the document and chunk data.
- Stores the document in `v2_documents` (type: `youtube`).
- Stores each chunk in `v2_vector_chunks` with encrypted embeddings and metadata.

---

## Data Flow

1. **User submits a YouTube URL.**
2. Client fetches the transcript and video ID using `fetchYoutubeTranscript`.
3. Client calls `processYoutubeTranscript`, which:
    - Chunks the transcript (default: 2000 chars, 200 overlap).
    - Generates and encrypts embeddings for each chunk (sequentially).
    - Prepares metadata for each chunk.
    - Sends all data to the API.
4. API route `/api/projects/[id]/youtube-ingest`:
    - Inserts the document into `v2_documents` with type `youtube`.
    - Inserts all chunks into `v2_vector_chunks`.
5. Chunks and document are now available for search and retrieval.

---

## Key Files & Functions

- **`src/lib/clientProcessing.ts`**
  - `processYoutubeTranscript`: Orchestrates chunking, embedding, encryption, and API upload.
- **`src/lib/youtubeUtils.ts`**
  - `fetchYoutubeTranscript`: Extracts transcript and video ID from a YouTube URL.
- **`src/app/api/projects/[id]/youtube-ingest/route.ts`**
  - API endpoint for storing YouTube documents and chunks.
- **`src/components/youtube/YoutubeUrlInput.tsx`**
  - UI for submitting YouTube URLs.
- **`src/components/youtube/YoutubePreview.tsx`**
  - UI for previewing transcript before ingestion.

---

## Database Schema

### `v2_documents`
| Column      | Type    | Description                  |
|-------------|---------|-----------------------------|
| id          | UUID    | Primary key                 |
| type        | ENUM    | Should include `'youtube'`  |
| ...         | ...     | Other document fields       |

### `v2_vector_chunks`
| Column               | Type         | Description                       |
|----------------------|--------------|-----------------------------------|
| document_id          | UUID         | FK to `v2_documents.id`           |
| chunk_number         | INTEGER      | Chunk index                       |
| chunk_content        | TEXT         | The chunk text                    |
| encrypted_embeddings | VECTOR(384)  | Encrypted embedding vector        |
| metadata             | JSON         | Chunk metadata (videoId, etc.)    |

---

## API

### `POST /api/projects/[id]/youtube-ingest`

**Request Body:**
```json
{
  "videoId": "string",
  "transcript": "string",
  "title": "string",
  "url": "string",
  "chunks": [
    {
      "chunkNumber": 1,
      "content": "string",
      "encrypted_embeddings": [0.1, -0.2, ...],
      "metadata": {
        "videoId": "string",
        "chunkIndex": 1,
        "startPosition": 0,
        "endPosition": 2000
      }
    }
    // ...
  ],
  "metadata": {
    "videoId": "string",
    "url": "string",
    "title": "string"
  }
}
```

**Response:**
```json
{
  "youtubeId": "string",
  "success": true
}
```

---

## Error Handling & Troubleshooting

- **Session Errors:**  
  Embedding generation must be sequential. Parallel embedding calls will cause `"Session already started"` or `"Session mismatch"` errors.
- **Missing Chunks:**  
  If only some chunks appear in the DB, check for embedding errors in the client logs.
- **Enum Errors:**  
  Ensure your `document_type` enum in the DB includes `'youtube'`.
- **Field Names:**  
  Field names in the API payload must match the DB schema (`chunk_content`, `encrypted_embeddings`, `metadata`).

---

## Example Usage

```typescript
import { processYoutubeTranscript } from '@/lib/clientProcessing';

await processYoutubeTranscript(
  projectId,
  transcript,
  videoId,
  videoUrl,
  title
);
```

---

## Best Practices

- Always use the provided client-side processing functions for ingestion.
- Do not send raw transcripts or empty chunks to the API.
- Monitor client and server logs for errors during ingestion.

---

## Extending

- To support other video platforms, implement a similar pipeline: fetch transcript, chunk, embed, encrypt, and upload.
- To adjust chunk size/overlap, modify the parameters in `processYoutubeTranscript`.

---

---

## Last Updated

May 2025
