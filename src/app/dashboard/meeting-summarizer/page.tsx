'use client';

import { useState } from 'react';
import { TranscriptUploader } from '@/features/meeting-summarizer/components/TranscriptUploader';
import { MeetingResults } from '@/features/meeting-summarizer/components/MeetingResults';

type ActionItem = {
  task: string;
  assignee: string | null;
  deadline: string | null;
};

export default function MeetingSummarizerPage() {
  const [transcriptText, setTranscriptText] = useState('');
  const [summary, setSummary] = useState<string | null>(null);
  const [actionItems, setActionItems] = useState<ActionItem[] | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTranscriptReady = (text: string) => {
    setTranscriptText(text);
    setSummary(null);
    setActionItems(null);
    setError(null);
  };

  const handleSummarize = async () => {
    setIsSummarizing(true);
    setError(null);
    setSummary(null);
    try {
      const response = await fetch('/api/process-transcript', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: transcriptText, only: 'summary' }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate summary');
      }
      const data = await response.json();
      setSummary(data.summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleExtractActionItems = async () => {
    setIsExtracting(true);
    setError(null);
    setActionItems(null);
    try {
      const response = await fetch('/api/process-transcript', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: transcriptText, only: 'action_items' }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to extract action items');
      }
      const data = await response.json();
      setActionItems(data.action_items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsExtracting(false);
    }
  };

  // Helper for download
  function actionItemsToText(items: ActionItem[] | null): string {
    if (!items) return '';
    return items.map((item, idx) =>
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
        onProcessStart={() => {}}
        isProcessing={false}
      />

      <div className="flex gap-4 mt-4">
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
          onClick={handleSummarize}
          disabled={!transcriptText.trim() || isSummarizing}
        >
          {isSummarizing ? 'Generating Summary...' : 'Generate Summary'}
        </button>
        <button
          className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
          onClick={handleExtractActionItems}
          disabled={!transcriptText.trim() || !summary || isExtracting}
        >
          {isExtracting ? 'Extracting Action Items...' : 'Generate Action Items'}
        </button>
      </div>

      {(summary || actionItems) && (
        <div className="mt-8">
          <MeetingResults
            summary={summary || ''}
            actionItems={actionItems}
            onDownloadSummary={() => {
              if (!summary) return;
              const blob = new Blob([summary], { type: 'text/plain' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'summary.txt';
              a.click();
              URL.revokeObjectURL(url);
            }}
            onDownloadActionItems={() => {
              if (!actionItems) return;
              const text = actionItemsToText(actionItems);
              const blob = new Blob([text], { type: 'text/plain' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'action_items.txt';
              a.click();
              URL.revokeObjectURL(url);
            }}
          />
        </div>
      )}
    </div>
  );
}