'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
import { chunkText } from '@/lib/pdfUtils';
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

export default function EmailSummarizerPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { service: keyService, isLoading } = useKeyManagement();
  const pendingQueue = useRef<EmailQueueItem[] | null>(null);

  useEffect(() => {
    if (!user) router.push('/log-in');
  }, [user]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (
        event.origin !== 'chrome-extension://kfllijpookcgihkcclkjeobcdcejcmlb' ||
        event.data?.type !== 'EMAIL_QUEUE_SYNC'
      )
        return;

      const queue = event.data.data as EmailQueueItem[];
      console.log('✅ Received email queue from extension:', queue);
      pendingQueue.current = queue;
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    const processQueue = async () => {
      const queue = pendingQueue.current;
      if (!queue || !keyService || isLoading) return;

      for (const email of queue) {
        try {
          const chunks = await chunkText(email.body, {
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
          } else {
            console.error(`❌ Failed to upload ${email.subject}`);
          }
        } catch (err) {
          console.error('❌ Error processing email:', err);
        }
      }

      // ✅ Clear local queue
      pendingQueue.current = null;
      chrome.storage?.local?.set?.({ email_queue: [] });

      // ✅ Notify extension to clear its own queue
      const iframe = document.getElementById('email-sync-iframe') as HTMLIFrameElement;
      iframe?.contentWindow?.postMessage(
        { type: 'CLEAR_EMAIL_QUEUE' },
        'chrome-extension://kfllijpookcgihkcclkjeobcdcejcmlb'
      );
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
      <p className="mb-4 text-gray-600">
        Connect your browser extension to start sending email summaries.
      </p>
      <Button onClick={handleConnectExtension}>Connect to Extension</Button>

      {/* Hidden iframe to sync with extension */}
      <iframe
        src="chrome-extension://kfllijpookcgihkcclkjeobcdcejcmlb/sync.html"
        id="email-sync-iframe"
        style={{ display: 'none' }}
        title="Email Queue Sync"
      />
    </div>
  );
}
