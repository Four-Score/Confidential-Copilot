'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
import { generateBatchEmbeddings } from '@/lib/embeddingUtils';
import { useKeyManagement } from '@/services/keyManagement/useKeyManagement';

interface EmailQueueItem {
  id: string;
  subject: string;
  sender: string;
  body: string;
  timestamp: string;
  summary: string;
  entities: {
    keyPoints: string[];
  };
  projectName: string;
  projectId: string;
}

// ✅ Text chunking logic (moved from pdfUtils)
function chunkText(
  text: string,
  metadata: { fileName: string; documentId?: string },
  chunkSize = 1000,
  chunkOverlap = 200
) {
  const chunks = [];
  let start = 0;
  let chunkNumber = 1;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    const chunkText = text.slice(start, end);

    chunks.push({
      content: chunkText,
      metadata: {
        chunkNumber,
        fileName: metadata.fileName,
        documentId: metadata.documentId,
      },
    });

    chunkNumber++;
    start += chunkSize - chunkOverlap;
  }

  return chunks;
}

export default function EmailSummarizerPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { service: keyService, isLoading } = useKeyManagement();
  const pendingQueue = useRef<EmailQueueItem[] | null>(null);

  // 🧠 Prevent duplicate processing
  const processedEmailIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!user) router.push('/log-in');
  }, [user]);

  // ✅ Receive email queue from extension via iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (
        event.origin !== 'chrome-extension://kfllijpookcgihkcclkjeobcdcejcmlb' ||
        event.data?.type !== 'EMAIL_QUEUE_SYNC'
      ) return;

      const queue = event.data.data as EmailQueueItem[];
      console.log('✅ Received email queue from extension:', queue);

      pendingQueue.current = queue;
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // ✅ Process queue on load (only once per email ID)
  useEffect(() => {
    const processQueue = async () => {
      const queue = pendingQueue.current;
      if (!queue || !keyService || isLoading) return;

      for (const email of queue) {
        if (processedEmailIds.current.has(email.id)) {
          console.log(`⏩ Skipping already-processed email: ${email.subject}`);
          continue;
        }

        try {
          const chunks = chunkText(email.body, {
            fileName: email.subject,
            documentId: email.id,
          });

          const embeddings = await generateBatchEmbeddings(chunks);

          const encryptedChunks = await Promise.all(
            embeddings.map(async ({ chunk, embedding }, i: number) => ({
              chunkNumber: i,
              encryptedContent: await keyService.encryptText(chunk.content),
              encryptedEmbeddings: await keyService.encryptVector(embedding),
              metadata: chunk.metadata,
            }))
          );

          const encryptedMetadata = {
            subject: await keyService.encryptMetadata(email.subject),
            sender: await keyService.encryptMetadata(email.sender),
            timestamp: email.timestamp,
            keyPoints: email.entities?.keyPoints || [],
          };

          const encryptedContent = await keyService.encryptText(email.body);

          const payload = {
            name: encryptedMetadata.subject,
            type: 'email',
            encryptedContent,
            encryptedMetadata,
            fileSize: email.body.length,
            pageCount: 1,
            chunks: encryptedChunks,
          };

          const res = await fetch(`/api/projects/${email.projectId}/documents`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });

          if (res.ok) {
            console.log(`✅ Ingested email: ${email.subject}`);
            processedEmailIds.current.add(email.id); // ✅ Mark as processed
          } else {
            console.error(`❌ Failed to upload ${email.subject}`);
          }
        } catch (err) {
          console.error('❌ Error processing email:', err);
        }
      }

      pendingQueue.current = null;
      chrome.storage?.local?.set?.({ email_queue: [] });

      const iframe = document.getElementById('email-sync-iframe') as HTMLIFrameElement;
      iframe?.contentWindow?.postMessage({ type: 'CLEAR_EMAIL_QUEUE' }, 'chrome-extension://kfllijpookcgihkcclkjeobcdcejcmlb');
      console.log('✅ Sent CLEAR_EMAIL_QUEUE message to extension');
    };

    processQueue();
  }, [keyService, isLoading]);

  const handleConnectExtension = () => {
    const extensionLoginUrl = 'http://localhost:3000/connect-extension';
    window.open(extensionLoginUrl, '_blank');
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Email Summarizer</h1>
      <p className="mb-4 text-gray-600">Connect your browser extension to start sending email summaries.</p>
      <Button onClick={handleConnectExtension}>Connect to Extension</Button>

      {/* Hidden iframe for extension sync */}
      <iframe
        src="chrome-extension://kfllijpookcgihkcclkjeobcdcejcmlb/sync.html"
        id="email-sync-iframe"
        style={{ display: 'none' }}
        title="Email Queue Sync"
      />
    </div>
  );
}
