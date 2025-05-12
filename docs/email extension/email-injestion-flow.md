Confidential Copilot: Email Ingestion Flow
Overview
This document outlines the detailed flow of how email data is ingested from a Chrome Extension into the Confidential Copilot application. The ingestion process is designed to securely receive, process, encrypt, and store email data for downstream AI-driven summarization and analysis.
1. Data Flow Overview
The flow consists of several key components:
- Chrome Extension
- Iframe Integration
- EmailIngestor Component
- Encryption Services
- Backend API Endpoint
- Supabase Storage

2. Detailed Ingestion Flow
1.	Step 1: Email Queue Preparation (Extension Side)
- The Chrome Extension collects emails from the user's inbox.
- These emails are structured as `EmailQueueItem` objects.
- The queue is sent using `window.postMessage()` with type `EMAIL_QUEUE_SYNC` to a specific iframe embedded in the app.
2.	Step 2: Queue Reception (Iframe + App Side)
- The application includes a hidden iframe pointing to the extension's sync.html.
- A `message` event listener in the `EmailIngestor` component captures the data from the extension.
- The queue is stored in a `useRef` hook for processing.
3.	Step 3: Email Processing
- For each email, the email body is chunked using `chunkText`.
- Embeddings are generated for each chunk using `generateBatchEmbeddings`.
- Each chunk and its embeddings are encrypted using the `keyService`.
- Metadata (subject, sender, timestamp, key points) is also encrypted.
4.	Step 4: API Submission
- An API request is sent to `/api/projects/{projectId}/documents`.
- The payload includes encrypted content, metadata, and chunked embeddings.
- The server stores this data securely (e.g., in Supabase).
5.	Step 5: Cleanup and Confirmation
- The local queue is cleared via `chrome.storage.local.set({ email_queue: [] })`.
- A `CLEAR_EMAIL_QUEUE` message is sent back to the extension to reset its queue.
- Logs confirm ingestion success or failure.
3. Security and Encryption
All sensitive content and vector embeddings are encrypted using user-specific keys via the `keyService`. This ensures end-to-end security and confidentiality of user data.
