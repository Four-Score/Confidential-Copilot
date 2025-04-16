'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { TranscriptUploader } from '@/features/meeting-summarizer/components/TranscriptUploader';
import { MeetingResults } from '@/features/meeting-summarizer/components/MeetingResults';

interface ActionItem {
  task: string;
  assignee: string | null;
  deadline: string | null;
}

export default function MeetingSummarizerPage() {
  const [transcriptText, setTranscriptText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<{ summary: string; action_items: ActionItem[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();

  // Check authentication on component mount
  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/log-in');
    }
  }, [isAuthenticated, router]);

  // If not authenticated, don't render the page content
  if (!user) {
    return null;
  }

  const handleTranscriptReady = (text: string) => {
    setTranscriptText(text);
    setError(null);
  };

  const handleProcess = async () => {
    if (!transcriptText.trim()) {
      setError('Please provide a transcript either by uploading a file or entering text.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Call the API endpoint instead of the direct function
      const response = await fetch('/api/process-transcript', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transcript: transcriptText }),
      });

      if (!response.ok) {
        // Handle HTTP errors
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process transcript');
      }

      const result = await response.json();
      setResults(result);
    } catch (err: any) {
      console.error('Error processing transcript:', err);
      setError(err.message || 'An error occurred while processing the transcript. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = (content: string, filename: string) => {
    const element = document.createElement('a');
    const file = new Blob([content], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const formatActionItemsForDownload = (actionItems: ActionItem[]) => {
    let content = "# ACTION ITEMS\n\n";
    actionItems.forEach((item, index) => {
      content += `${index + 1}. Task: ${item.task}\n`;
      if (item.assignee) {
        content += `   Assignee: ${item.assignee}\n`;
      }
      if (item.deadline) {
        content += `   Deadline: ${item.deadline}\n`;
      }
      content += '\n';
    });
    return content;
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Meeting Summarizer</h1>
      <p className="text-gray-600 mb-8">
        Upload a meeting transcript to generate a summary and extract action items.
      </p>

      {error && (
        <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg border border-red-300">
          {error}
        </div>
      )}

      {/* Input Section */}
      <TranscriptUploader
        onTranscriptReady={handleTranscriptReady}
        onProcessStart={handleProcess}
        isProcessing={isProcessing}
      />

      {/* Results Section */}
      {results && (
        <MeetingResults
          summary={results.summary}
          actionItems={results.action_items}
          onDownloadSummary={() => handleDownload(results.summary, 'meeting_summary.txt')}
          onDownloadActionItems={() => 
            handleDownload(formatActionItemsForDownload(results.action_items), 'action_items.txt')
          }
        />
      )}
    </div>
  );
}