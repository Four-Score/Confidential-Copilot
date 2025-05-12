'use client';

import { useEffect, useState } from 'react';
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

export function useClientEmailQueueProcessor() {
  const [queueLength, setQueueLength] = useState(0);
  const [processedCount, setProcessedCount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const { service: keyService, isLoading } = useKeyManagement();

  useEffect(() => {
    if (!keyService || isLoading || typeof window === 'undefined') return;

    const interval = setInterval(() => {
      chrome.storage.local.get(['email_queue'], async (result) => {
        const queue: EmailQueueItem[] = result.email_queue || [];
        setQueueLength(queue.length);

        if (queue.length === 0 || isProcessing) return;

        const [email, ...remaining] = queue;
        setIsProcessing(true);

        try {
          const { chunkText } = await import('@/lib/pdfUtils'); // dynamically load browser-only
          const chunks = await chunkText(
            email.body,
            {
              fileName: email.subject,
              documentId: email.id
            },
            1000,
            200
          );

          const embeddings = await generateBatchEmbeddings(chunks);

          const encryptedChunks = await Promise.all(
            embeddings.map(async ({ chunk, embedding }, i: number) => ({
              chunkNumber: i,
              encryptedContent: await keyService.encryptText(chunk.content),
              encryptedEmbeddings: await keyService.encryptVector(embedding),
              metadata: chunk.metadata
            }))
          );

          const encryptedMetadata = {
            subject: await keyService.encryptMetadata(email.subject),
            sender: await keyService.encryptMetadata(email.sender),
            timestamp: email.timestamp,
            keyPoints: email.entities?.keyPoints || []
          };

          const encryptedContent = await keyService.encryptText(email.body);

          const payload = {
            name: encryptedMetadata.subject,
            type: 'email',
            encryptedContent,
            encryptedMetadata,
            fileSize: email.body.length,
            pageCount: 1,
            chunks: encryptedChunks
          };

          await fetch(`/api/projects/${email.projectId}/documents`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });

          chrome.storage.local.set({ email_queue: remaining });
          setProcessedCount((prev) => prev + 1);
        } catch (err) {
          console.error('❌ Email ingestion failed:', err);
        } finally {
          setIsProcessing(false);
        }
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [keyService, isLoading, isProcessing]);

  return {
    queueLength,
    processedCount,
    isProcessing,
    pending: queueLength - processedCount
  };
}
