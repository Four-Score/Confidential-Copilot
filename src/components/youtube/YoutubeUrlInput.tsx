'use client';

import { useState } from 'react';
import ErrorDisplay from '@/components/uploads/ErrorDisplay';
import ProgressBar from '@/components/uploads/ProgressBar';

interface YoutubeUrlInputProps {
  onUrlSubmit: (url: string) => void;
  onCancel: () => void;
  isLoading: boolean;
  progress: number;
  currentStep?: string | null;
  error?: string | null;
  onUrlChange?: (url: string) => void; // <-- Add this
}

export default function YoutubeUrlInput({
  onUrlSubmit,
  onCancel,
  isLoading,
  progress,
  currentStep,
  error,
  onUrlChange, // <-- Add this
}: YoutubeUrlInputProps) {
  const [url, setUrl] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
    if (onUrlChange) onUrlChange(e.target.value); // <-- Track input in parent
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoading) onUrlSubmit(url);
  };

  const handleCancel = () => {
    setUrl(''); // Clear the input field
    onCancel(); // Call parent cancel logic
  };

  return (
    <div className="bg-white shadow-lg rounded-lg p-6 mb-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Add YouTube Content</h2>
        <button
          onClick={handleCancel}
          className="text-gray-500 hover:text-gray-700"
          disabled={isLoading}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="space-y-6">
        {!isLoading ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
              <input
                type="text"
                id="youtube-url"
                placeholder="Enter YouTube URL (e.g., https://www.youtube.com/watch?v=VIDEO_ID)"
                value={url}
                onChange={handleInputChange} // <-- Use the new handler
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                disabled={isLoading}
              />
            </div>

            {/* Show validation error or backend error below the input */}
            {error && <ErrorDisplay error={error} />}

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                disabled={isLoading}
              >
                Submit
              </button>
            </div>
          </form>
        ) : (
          <>
            <div className="mb-4">
              <div className="mb-2 flex justify-between text-sm">
                <span className="font-medium text-gray-700">
                  {currentStep || 'Processing YouTube content...'}
                </span>
                <span className="text-gray-500">{Math.round(progress)}%</span>
              </div>
              <ProgressBar progress={progress} height="h-2" showPercentage={false} />
            </div>
            {error && <ErrorDisplay error={error} />}
            <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-md">
              <svg className="h-5 w-5 text-blue-400 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-sm text-blue-700">
                  Processing YouTube content. This may take a moment depending on the video length.
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}