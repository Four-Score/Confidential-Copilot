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
  const [responseDetails, setResponseDetails] = useState<string | null>(null);
  
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
    setResponseDetails(null);
  };

  const handleProcess = async () => {
    if (!transcriptText.trim()) {
      setError('Please provide a transcript either by uploading a file or entering text.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setResponseDetails(null);

    try {
      console.log("Sending request to process transcript API...");
      
      // Call the API endpoint
      const response = await fetch('/api/process-transcript', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transcript: transcriptText }),
      });

      console.log("Response received:", response.status, response.statusText);
      
      // Capture response details for debugging
      const contentType = response.headers.get('content-type');
      console.log("Content-Type:", contentType);
      
      // Get the raw text response for debugging
      const rawText = await response.text();
      
      // Store first 500 chars of response for debugging
      const previewText = rawText.slice(0, 500) + (rawText.length > 500 ? '...' : '');
      setResponseDetails(`Status: ${response.status} ${response.statusText}\nContent-Type: ${contentType}\nPreview: ${previewText}`);
      
      // If the response doesn't look like JSON, throw an error
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`Server returned a non-JSON response (${contentType})`);
      }
      
      // Parse the response as JSON
      let result;
      try {
        result = JSON.parse(rawText);
      } catch (e) {
        throw new Error(`Failed to parse response as JSON: ${e instanceof Error ? e.message : 'Unknown parsing error'}`);
      }

      if (!response.ok) {
        // Handle HTTP errors
        throw new Error(result.error || `Failed to process transcript (Status ${response.status})`);
      }
      
      // Validate the result structure
      if (!result.summary || !Array.isArray(result.action_items)) {
        throw new Error('Invalid response format from server');
      }
      
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
          <p className="font-semibold">Error:</p>
          <p>{error}</p>
        </div>
      )}

      {responseDetails && (
        <div className="mb-6 p-4 bg-gray-100 text-gray-800 rounded-lg border border-gray-300 overflow-auto">
          <p className="font-semibold">Response Details (for debugging):</p>
          <pre className="whitespace-pre-wrap text-xs mt-2">{responseDetails}</pre>
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