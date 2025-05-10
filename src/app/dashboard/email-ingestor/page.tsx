'use client';

import { useEffect, useRef, useState } from 'react';
import { chunkText } from '@/lib/pdfUtils';
import { generateBatchEmbeddings } from '@/lib/embeddingUtils';
import { useKeyManagement } from '@/services/keyManagement/useKeyManagement';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';

export function ConnectExtensionButton() {
  const handleConnect = () => {
    const url = 'http://localhost:3000/connect-extension';
    window.open(url, '_blank');
  };

  return (
    <div className="flex flex-col items-start space-y-2">
      <Button onClick={handleConnect}>Connect to Extension</Button>
    </div>
  );
}

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

export default function EmailIngestor() {
  const { user } = useAuthStore();
  const { service: keyService, isLoading } = useKeyManagement();
  const pendingQueue = useRef<EmailQueueItem[] | null>(null);
  const [progress, setProgress] = useState(0);

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
      processQueue();
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const processQueue = async () => {
    const queue = pendingQueue.current;
    if (!queue || !keyService || isLoading) return;

    for (let index = 0; index < queue.length; index++) {
      const email = queue[index];
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
          console.error(`❌ Failed to upload ${email.subject}`, await res.text());
        }

        setProgress(((index + 1) / queue.length) * 100);
      } catch (err) {
        console.error('❌ Error processing email:', err);
      }
    }

    pendingQueue.current = null;

    if (typeof chrome !== 'undefined') {
      chrome.storage?.local?.set?.({ email_queue: [] });
      const iframe = document.getElementById('email-sync-iframe') as HTMLIFrameElement;
      iframe?.contentWindow?.postMessage(
        { type: 'CLEAR_EMAIL_QUEUE' },
        'chrome-extension://kfllijpookcgihkcclkjeobcdcejcmlb'
      );
      console.log('✅ Sent CLEAR_EMAIL_QUEUE message to extension');
    }
  };
  const [hasPendingEmails, setHasPendingEmails] = useState(false);

useEffect(() => {
  if (typeof chrome !== 'undefined') {
    chrome.storage?.local?.get('email_queue', (result) => {
      const hasPending = Array.isArray(result.email_queue) && result.email_queue.length > 0;
      setHasPendingEmails(hasPending);
    });
  }
}, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Email Ingestor</h1>
        <ConnectExtensionButton />
      </div>
      {hasPendingEmails ? (
  <div className="mb-4 p-4 bg-yellow-100 border border-yellow-300 text-yellow-800 rounded">
    📨 Pending emails detected. Ingestion will start automatically.
  </div>
) : (
  <div className="mb-4 p-4 bg-green-100 border border-green-300 text-green-800 rounded">
    ✅ All emails ingested. You're up to date!
  </div>
)}

      <div className="w-full bg-gray-200 rounded-full h-3 mb-6 overflow-hidden">
        <div
          className="bg-gradient-to-r from-blue-500 to-blue-700 h-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <iframe
        src="chrome-extension://kfllijpookcgihkcclkjeobcdcejcmlb/sync.html"
        id="email-sync-iframe"
        style={{ display: 'none' }}
        title="Email Queue Sync"
      />
    </div>
  );
}
