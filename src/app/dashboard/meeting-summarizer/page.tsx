'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TranscriptUploader } from '@/features/meeting-summarizer/components/TranscriptUploader';
import { MeetingResults } from '@/features/meeting-summarizer/components/MeetingResults';

type ActionItem = {
  task: string;
  assignee: string | null;
  deadline: string | null;
};

export default function MeetingSummarizerPage() {
  const router = useRouter();
  const [transcriptText, setTranscriptText] = useState('');
  const [summary, setSummary] = useState<string | null>(null);
  const [actionItems, setActionItems] = useState<ActionItem[] | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastClicked, setLastClicked] = useState<'summary' | 'action_items' | null>(null);

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
    setLastClicked('summary');
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
    setLastClicked('action_items');
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

  // --- UI order logic ---
  const results = [];
  if (lastClicked === 'summary' && summary) {
    results.push(
      <MeetingResults
        key="summary"
        summary={summary}
        actionItems={null}
        onDownloadSummary={() => {
          const blob = new Blob([summary], { type: 'text/plain' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'summary.txt';
          a.click();
          URL.revokeObjectURL(url);
        }}
        onDownloadActionItems={() => {}}
        show="summary"
      />
    );
    if (actionItems) {
      results.push(
        <MeetingResults
          key="action"
          summary=""
          actionItems={actionItems}
          onDownloadSummary={() => {}}
          onDownloadActionItems={() => {
            const text = actionItemsToText(actionItems);
            const blob = new Blob([text], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'action_items.txt';
            a.click();
            URL.revokeObjectURL(url);
          }}
          show="action_items"
        />
      );
    }
  } else if (lastClicked === 'action_items' && actionItems) {
    results.push(
      <MeetingResults
        key="action"
        summary=""
        actionItems={actionItems}
        onDownloadSummary={() => {}}
        onDownloadActionItems={() => {
          const text = actionItemsToText(actionItems);
          const blob = new Blob([text], { type: 'text/plain' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'action_items.txt';
          a.click();
          URL.revokeObjectURL(url);
        }}
        show="action_items"
      />
    );
    if (summary) {
      results.push(
        <MeetingResults
          key="summary"
          summary={summary}
          actionItems={null}
          onDownloadSummary={() => {
            const blob = new Blob([summary], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'summary.txt';
            a.click();
            URL.revokeObjectURL(url);
          }}
          onDownloadActionItems={() => {}}
          show="summary"
        />
      );
    }
  } else {
    // If neither or both are null, show nothing
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Back Button */}
      <button
        onClick={() => router.push('/dashboard')}
        className="mb-6 flex items-center px-4 py-2 rounded-lg border border-blue-200 bg-white text-blue-600 font-medium hover:bg-blue-50 hover:border-blue-400 transition-all shadow-sm"
      >
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to Dashboard
      </button>

      <div className="mb-8 flex flex-col md:flex-row items-start md:items-center gap-6">
        {/* Visual/Illustration */}
        {/* <div className="flex-shrink-0 flex items-center justify-center bg-blue-100 rounded-xl p-6 shadow-md">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
                      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                      <line x1="12" y1="19" x2="12" y2="23"></line>
                      <line x1="8" y1="23" x2="16" y2="23"></line>
          </svg>
        </div> */}
        {/* Textual Info */}
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-4">
            Meeting Summarizer
          </h1>
          <p className="text-gray-600 mb-6">
            Upload a meeting transcript to generate a summary and extract action items.
          </p>
          <div className="mb-6">
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-medium border border-blue-200">
              <svg className="w-4 h-4 mr-1 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z"/>
              </svg>
              This feature operates as a <span className="font-semibold ml-1"> temporary session</span>.
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="h-4 w-1 bg-blue-400 rounded-full"></span>
            <span className="text-xs text-blue-700 font-medium">
              Audio transcript support coming soon!
            </span>
          </div>
        </div>
      </div>

      {error && <div className="text-red-600 mb-4 bg-red-100 rounded p-3">{error}</div>}

      <TranscriptUploader
        onTranscriptReady={handleTranscriptReady}
        onProcessStart={() => {}}
        isProcessing={false}
      />

      <div className="flex gap-4 mt-4">
        <button
          className={`px-4 py-2 rounded-lg font-semibold shadow-sm transition-all duration-200 ${
            isSummarizing
              ? 'bg-blue-300 text-white'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
          onClick={handleSummarize}
          disabled={isSummarizing}
        >
          {isSummarizing ? 'Generating Summary...' : 'Generate Summary'}
        </button>
        <button
          className={`px-4 py-2 rounded-lg font-semibold shadow-sm transition-all duration-200 ${
            isExtracting
              ? 'bg-green-300 text-white'
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
          onClick={handleExtractActionItems}
          disabled={isExtracting}
        >
          {isExtracting ? 'Extracting Action Items...' : 'Generate Action Items'}
        </button>
      </div>

      <div className="mt-10 space-y-8">
        {results}
      </div>
    </div>
  );
}