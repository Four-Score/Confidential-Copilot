import React from 'react';

interface YoutubePreviewProps {
  videoId: string;
  transcript: string;
  onBack: () => void;
  onConfirm: () => void;
}

export default function YoutubePreview({ videoId, transcript, onBack, onConfirm }: YoutubePreviewProps) {
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
      <h3 className="text-lg font-semibold mb-2">Transcript</h3>
      <div className="bg-gray-50 rounded p-4 text-sm text-gray-800" style={{ maxHeight: 300, overflowY: 'auto' }}>
        {transcript}
      </div>
      <div className="flex justify-end mt-4 space-x-2">
        <button
          onClick={onBack}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
        >
          Back to Project
        </button>
        <button
          onClick={onConfirm}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Confirm & Ingest
        </button>
      </div>
    </div>
  );
}