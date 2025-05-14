'use client';

import { useEffect, useRef, useState } from 'react';
import { chunkEmailText } from '@/lib/emailUtils';
import { generateBatchEmbeddings } from '@/lib/embeddingUtils';
import { useKeyManagement } from '@/services/keyManagement/useKeyManagement';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import ConnectExtensionButton from '@/components/extension/ConnectExtensionButton';

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
        const chunks = await chunkEmailText(email.body, {
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

  return (
    <div className="p-6 max-w-4xl mx-auto font-sans">

      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Email Ingestor</h1>
        <ConnectExtensionButton />
      </div>

      {/* Email Mode Info Card */}
      <div className="relative bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl shadow-sm p-6 mb-8">
        <div className="flex items-start space-x-4">
          <div className="text-3xl">📬</div>
          <div>
            <h2 className="text-lg font-semibold text-blue-900 mb-1">
              Welcome to <span className="text-blue-700">Email Mode</span>
            </h2>
            <p className="text-sm text-gray-700">
              Automatically ingest and summarize emails directly into your Confidential Copilot projects.
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Email Mode works with our browser extension — be sure it's connected!
            </p>
          </div>
        </div>
      </div>

      {/* Ingestion Status Feedback */}
{progress > 0 && (
  <div className="mb-4 font-medium flex items-center space-x-2 transition-opacity duration-300">
    {progress < 100 ? (
      <>
        <svg className="w-5 h-5 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        <span className="text-blue-700 animate-pulse">Ingesting emails... please wait</span>
      </>
    ) : (
      <>
        <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24">
          <path stroke="currentColor" strokeWidth="2" d="M5 13l4 4L19 7" />
        </svg>
        <span className="text-green-600">All emails ingested successfully!</span>
      </>
    )}
  </div>
)}

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-3 mb-6 overflow-hidden">
        <div
          className="bg-gradient-to-r from-blue-500 to-blue-700 h-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Hidden iframe for sync */}
      <iframe
        src="chrome-extension://kfllijpookcgihkcclkjeobcdcejcmlb/sync.html"
        id="email-sync-iframe"
        style={{ display: 'none' }}
        title="Email Queue Sync"
      />
      {/* Extension Setup Instructions */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5 mb-6 shadow-sm">
  <h2 className="text-lg font-semibold text-yellow-900 mb-2">How to Install Confidential Copilot Extension</h2>

  <div className="mb-4">
    <a
      href="https://drive.google.com/file/d/1awF66_GErs8-MXsFMBwQLwNL26-O53qR/view?usp=drive_link"
      className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
      target="_blank"
      rel="noopener noreferrer"
    >
      🔒 Request Access to Download Extension ZIP
    </a>
    <p className="text-sm text-yellow-800 mt-1">
      You will be prompted to request access. Our team will approve it shortly.
    </p>
  </div>

  <ul className="list-disc pl-5 text-sm text-yellow-800 space-y-1">
    <li>Once approved, download and unzip the file.</li>
    <li>Go to <strong>chrome://extensions</strong> in your browser.</li>
    <li>Enable <strong>Developer Mode</strong> (top right corner).</li>
    <li>Click <strong>"Load unpacked"</strong> and select the extracted folder.</li>
  </ul>
</div>

    </div>
    
  );
}
