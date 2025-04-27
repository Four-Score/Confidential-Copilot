'use client';

import { useState } from 'react';
import { TranscriptUploader } from '@/features/meeting-summarizer/components/TranscriptUploader';
import { MeetingResults } from '@/features/meeting-summarizer/components/MeetingResults';

// Define or import ActionItem type
type ActionItem = {
  task: string;
  assignee: string | null;
  deadline: string | null;
};

export default function MeetingSummarizerPage() {
  const [transcriptText, setTranscriptText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<{ summary: string; action_items: ActionItem[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleTranscriptReady = (text: string) => {
    setTranscriptText(text);
    setError(null);
  };

  const handleProcess = async () => {
    if (!transcriptText.trim()) {
      setError('Please upload or enter a transcript before processing.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/process-transcript', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: transcriptText }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process transcript');
      }

      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Helper to convert action items to readable text
  function actionItemsToText(actionItems: ActionItem[]): string {
    return actionItems.map((item, idx) =>
      `Action Item ${idx + 1}:\nTask: ${item.task}\nAssignee: ${item.assignee ?? 'N/A'}\nDeadline: ${item.deadline ?? 'N/A'}\n`
    ).join('\n');
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Meeting Summarizer</h1>
      <p className="text-gray-600 mb-8">
        Upload a meeting transcript to generate a summary and extract action items.
      </p>

      {error && <div className="text-red-600 mb-4">{error}</div>}

      <TranscriptUploader
        onTranscriptReady={handleTranscriptReady}
        onProcessStart={handleProcess}
        isProcessing={isProcessing}
      />

      {results && (
        <MeetingResults
          summary={results.summary}
          actionItems={results.action_items}
          onDownloadSummary={() => {
            const blob = new Blob([results.summary], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'summary.txt';
            a.click();
            URL.revokeObjectURL(url);
          }}
          onDownloadActionItems={() => {
            const text = actionItemsToText(results.action_items);
            const blob = new Blob([text], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'action_items.txt';
            a.click();
            URL.revokeObjectURL(url);
          }}
        />
      )}
    </div>
  );
}