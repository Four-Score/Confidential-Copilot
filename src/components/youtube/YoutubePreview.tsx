import React from 'react';
import ProgressBar from '@/components/uploads/ProgressBar';// Adjust the path as needed

interface YoutubePreviewProps {
  videoId: string;
  transcript: string;
  onBack: () => void;
  onConfirm: () => void;
  isProcessing?: boolean;
  progress?: number;
  status?: string | null;
  error?: string | null;
}

export default function YoutubePreview({
  videoId,
  transcript,
  onBack,
  onConfirm,
  isProcessing,
  progress,
  status,
  error
}: YoutubePreviewProps) {
  return (
    <div className="bg-white shadow-lg rounded-lg p-6 mb-8">
      <div className="aspect-video rounded-md overflow-hidden bg-gray-100 mb-4">
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
      {isProcessing ? (
        <div className="mb-4">
          <div className="mb-2 flex justify-between text-sm">
            <span className="font-medium text-gray-700">
              {status || 'Processing YouTube content...'}
            </span>
            <span className="text-gray-500">{Math.round(progress || 0)}%</span>
          </div>
          <ProgressBar progress={progress || 0} height="h-2" showPercentage={false} />
          {error && <div className="text-red-600 text-sm mt-2">{error}</div>}
        </div>
      ) : (
        <>
          <h3 className="text-lg font-semibold mb-2">Transcript</h3>
          <div className="bg-gray-50 rounded p-4 text-sm text-gray-800" style={{ maxHeight: 300, overflowY: 'auto' }}>
            {transcript}
          </div>
          <div className="flex justify-end mt-4 space-x-2">
            <button
              onClick={onBack}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Confirm & Ingest
            </button>
          </div>
        </>
      )}
    </div>
  );
}