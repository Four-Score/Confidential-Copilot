'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';

interface TranscriptUploaderProps {
  onTranscriptReady: (transcript: string) => void;
  onProcessStart: () => void;
  isProcessing: boolean;
}

export function TranscriptUploader({
  onTranscriptReady,
  onProcessStart,
  isProcessing,
}: TranscriptUploaderProps) {
  const [transcriptText, setTranscriptText] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadOption, setUploadOption] = useState<'file' | 'text'>('file');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      setError(null);
      
      // Read file content
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const content = event.target.result as string;
          setTranscriptText(content);
          onTranscriptReady(content);
        }
      };
      reader.onerror = () => {
        setError('Error reading file. Please try again.');
      };
      reader.readAsText(file);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setTranscriptText(text);
    onTranscriptReady(text);
    setError(null);
  };

  const handleProcess = () => {
    if (!transcriptText.trim()) {
      setError('Please provide a transcript either by uploading a file or entering text.');
      return;
    }
    
    onProcessStart();
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-8">
      <div className="mb-4">
        <div className="flex space-x-4 mb-4">
          <button
            className={`px-4 py-2 rounded-md ${uploadOption === 'file' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            onClick={() => setUploadOption('file')}
          >
            Upload File
          </button>
          <button
            className={`px-4 py-2 rounded-md ${uploadOption === 'text' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            onClick={() => setUploadOption('text')}
          >
            Paste Text
          </button>
        </div>

        {uploadOption === 'file' ? (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              type="file"
              id="transcript-file"
              className="hidden"
              accept=".txt,.md,.doc,.docx"
              onChange={handleFileUpload}
            />
            <label
              htmlFor="transcript-file"
              className="cursor-pointer text-blue-600 hover:text-blue-800"
            >
              {uploadedFile ? (
                <span>File uploaded: {uploadedFile.name}</span>
              ) : (
                <span>Click to upload a transcript file</span>
              )}
            </label>
            <p className="text-sm text-gray-500 mt-2">
              Supported formats: .txt, .md, .doc, .docx
            </p>
          </div>
        ) : (
          <textarea
            className="w-full h-64 p-4 border border-gray-300 rounded-lg"
            placeholder="Paste your meeting transcript here..."
            value={transcriptText}
            onChange={handleTextChange}
          ></textarea>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}