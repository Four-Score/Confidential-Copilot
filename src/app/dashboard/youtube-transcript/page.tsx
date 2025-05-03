'use client';

import { useState } from 'react';
import { Loader2, FileText, FileCheck, ExternalLink } from 'lucide-react';

export default function YouTubeTranscriptPage() {
  const [videoUrl, setVideoUrl] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [videoId, setVideoId] = useState('');
  const [transcript, setTranscript] = useState('');
  const [summary, setSummary] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isProcessingStep, setIsProcessingStep] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const extractVideoId = (url: string) => {
    const regex = /(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const fetchTranscript = async () => {
    if (!videoUrl.trim()) {
      setError('Please provide a valid YouTube video URL.');
      return;
    }

    const extractedVideoId = extractVideoId(videoUrl);
    if (!extractedVideoId) {
      setError('Could not extract a valid YouTube video ID from the URL.');
      return;
    }

    setVideoId(extractedVideoId);
    setIsProcessing(true);
    setIsProcessingStep('transcript');
    setError(null);

    try {
      const response = await fetch('/api/get-transcript', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ video_url: videoUrl }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch transcript.');
      }

      const data = await response.json();
      setTranscript(data.transcript);
      
      // Set video title based on video ID
      setVideoTitle(`YouTube Video (ID: ${extractedVideoId})`);
      
      // Note: For a more complete implementation, you could fetch the video title 
      // using the YouTube Data API, but that would require a YouTube API key
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred.');
    } finally {
      setIsProcessing(false);
      setIsProcessingStep(null);
    }
  };

  const summarizeTranscript = async () => {
    if (!transcript.trim()) {
      setError('Transcript is empty. Please fetch the transcript first.');
      return;
    }

    setIsProcessing(true);
    setIsProcessingStep('summary');
    setError(null);

    try {
      const response = await fetch('/api/summarize-transcript', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to summarize transcript.');
      }

      const data = await response.json();
      setSummary(data.summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred.');
    } finally {
      setIsProcessing(false);
      setIsProcessingStep(null);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">YouTube Video Summarizer</h1>
        <p className="text-gray-600">
          Enter a YouTube video URL to fetch its transcript and generate a concise summary using AI.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
          <p className="font-medium">Error</p>
          <p>{error}</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="mb-4">
          <label htmlFor="videoUrl" className="block text-sm font-medium text-gray-700 mb-1">
            YouTube Video URL
          </label>
          <div className="flex">
            <input
              id="videoUrl"
              type="text"
              placeholder="https://www.youtube.com/watch?v=..."
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              className="flex-1 p-3 border border-gray-300 rounded-l-md focus:ring-blue-500 focus:border-blue-500"
              disabled={isProcessing}
            />
            <button
              onClick={fetchTranscript}
              disabled={isProcessing || !videoUrl.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
            >
              {isProcessingStep === 'transcript' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Fetching...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Fetch Transcript
                </>
              )}
            </button>
          </div>
        </div>

        {videoId && (
          <div className="mb-6">
            <div className="aspect-video rounded-md overflow-hidden bg-gray-100">
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${videoId}`}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
            {videoTitle && (
              <div className="mt-2 flex justify-between">
                <h2 className="text-lg font-medium text-gray-900">{videoTitle}</h2>
                <a
                  href={`https://www.youtube.com/watch?v=${videoId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                >
                  Open on YouTube <ExternalLink className="ml-1 h-3 w-3" />
                </a>
              </div>
            )}
          </div>
        )}

        {transcript && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-semibold">Transcript</h2>
              <button
                onClick={summarizeTranscript}
                disabled={isProcessing || !transcript.trim()}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center"
              >
                {isProcessingStep === 'summary' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Summarizing...
                  </>
                ) : (
                  <>
                    <FileCheck className="mr-2 h-4 w-4" />
                    Generate Summary
                  </>
                )}
              </button>
            </div>
            <div className="max-h-64 overflow-y-auto bg-gray-50 rounded-md p-4 text-gray-800 whitespace-pre-line">
              {transcript}
            </div>
          </div>
        )}
      </div>

      {summary && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Summary</h2>
          <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
            <div className="whitespace-pre-line text-gray-800">{summary}</div>
          </div>
        </div>
      )}
    </div>
  );
}