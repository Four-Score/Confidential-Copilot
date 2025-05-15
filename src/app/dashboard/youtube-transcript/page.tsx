'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, FileText, FileCheck, ExternalLink } from 'lucide-react';

export default function YouTubeTranscriptPage() {
  const router = useRouter();
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

    // Clear previous results BEFORE fetching
    setTranscript('');
    setSummary('');
    setVideoId('');
    setVideoTitle('');
    setError(null);

    const extractedVideoId = extractVideoId(videoUrl);
    if (!extractedVideoId) {
      setError('Could not extract a valid YouTube video ID from the URL.');
      return;
    }

    setVideoId(extractedVideoId);
    setIsProcessing(true);
    setIsProcessingStep('transcript');

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
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-4">
            Youtube Transcript Summarizer
          </h1>
          <p className="text-gray-600 mb-6">
            Enter a YouTube video URL to fetch its transcript and generate a concise summary using AI.
          </p>
          <div className="mb-6">
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-medium border border-blue-200">
              <svg className="w-4 h-4 mr-1 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z"/>
              </svg>
              This feature operates as a <span className="font-semibold ml-1"> temporary session</span>.
            </span>
          </div>
        </div>
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
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Summary</h2>
          </div>
          <div className="bg-gray-50 p-6 rounded-lg border border-blue-100">
            {summary.split('\n').map((paragraph, i) => {
              // Bold headings if line ends with ":" or looks like a markdown heading
              if (
                (paragraph.trim().endsWith(':') && paragraph.trim().length < 40) ||
                /^\*\*.*\*\*:?$/.test(paragraph.trim())
              ) {
                return (
                  <p key={i} className="font-bold text-blue-900 mt-4 mb-2 text-base">
                    {paragraph.replace(/\*\*/g, '')}
                  </p>
                );
              }
              // Bulleted lines (handle both "- " and "* " as bullets)
              if (
                paragraph.trim().startsWith('- ') ||
                paragraph.trim().startsWith('* ')
              ) {
                return (
                  <p key={i} className="ml-4 text-gray-700 mb-1">
                    <span className="text-blue-500 font-bold mr-2">•</span>
                    {paragraph.trim().substring(2).trim()}
                  </p>
                );
              }
              // Numbered lines
              if (/^\d+\./.test(paragraph.trim())) {
                return (
                  <p key={i} className="ml-4 text-gray-800 mb-1">
                    {paragraph.trim()}
                  </p>
                );
              }
              // Inline bold for markdown **...**
              const parts = paragraph.split(/(\*\*[^*]+\*\*)/g);
              return (
                <p key={i} className="mb-2 text-gray-800">
                  {parts.map((part, idx) =>
                    part.startsWith('**') && part.endsWith('**') ? (
                      <span key={idx} className="font-bold text-blue-900">
                        {part.replace(/\*\*/g, '')}
                      </span>
                    ) : (
                      part
                    )
                  )}
                </p>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}