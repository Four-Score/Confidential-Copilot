'use client';

import { useState, useRef, useCallback } from 'react';
import { MAX_FILE_SIZE } from '@/lib/pdfUtils';
import ErrorDisplay from './ErrorDisplay';
import ProgressBar from './ProgressBar';

interface FileUploaderProps {
  /**
   * Callback function called when a file is selected
   */
  onFileSelect: (file: File) => void;
  
  /**
   * Callback function called when upload is canceled
   */
  onCancel?: () => void;
  
  /**
   * Whether the component is in loading/uploading state
   */
  isLoading?: boolean;
  
  /**
   * Upload progress (0-100)
   */
  progress?: number;
  
  /**
   * Current step or status message
   */
  currentStep?: string;
  
  /**
   * Error message to display
   */
  error?: string | null;
  
  /**
   * Allowed file types (e.g., ['application/pdf'])
   */
  acceptedFileTypes?: string[];
  
  /**
   * Maximum file size in bytes
   */
  maxFileSize?: number;
  
  /**
   * Text to display in the upload area
   */
  dropzoneText?: string;
}

export default function FileUploader({
  onFileSelect,
  onCancel,
  isLoading = false,
  progress = 0,
  currentStep = '',
  error = null,
  acceptedFileTypes = ['application/pdf'],
  maxFileSize = MAX_FILE_SIZE,
  dropzoneText = 'Drag & drop your file here or click to browse'
}: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Combine local and prop errors
  const displayError = localError || error;

  /**
   * Validate the file type and size
   */
  const validateFile = (file: File): { isValid: boolean; error?: string } => {
    // Check file type
    if (!acceptedFileTypes.includes(file.type)) {
      return {
        isValid: false,
        error: `Invalid file type. Accepted types: ${acceptedFileTypes.join(', ')}`
      };
    }
    
    // Check file size
    if (file.size > maxFileSize) {
      const maxSizeMB = Math.round(maxFileSize / (1024 * 1024));
      return {
        isValid: false,
        error: `File is too large. Maximum size is ${maxSizeMB} MB.`
      };
    }
    
    return { isValid: true };
  };

  /**
   * Handle file selection
   */
  const handleFileSelect = (selectedFile: File) => {
    const validation = validateFile(selectedFile);
    
    if (!validation.isValid) {
      setLocalError(validation.error ?? null);
      return;
    }
    
    setLocalError(null);
    setFile(selectedFile);
    onFileSelect(selectedFile);
  };
  
  /**
   * Handle drag events
   */
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isLoading) {
      setIsDragging(true);
    }
  }, [isLoading]);
  
  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);
  
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (isLoading) return;
    
    setLocalError(null);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }, [isLoading, onFileSelect]);

  /**
   * Handle file input change
   */
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isLoading) return;
    
    setLocalError(null);
    
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  /**
   * Open file browser on click
   */
  const triggerFileInput = () => {
    if (isLoading) return;
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  /**
   * Format file size for display
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  /**
   * Handle cancel button click
   */
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  // Get acceptable file types in a format suitable for the input element
  const acceptAttribute = acceptedFileTypes.join(',');
  
  // Format max file size for display
  const maxFileSizeDisplay = formatFileSize(maxFileSize);

  return (
    <div className="w-full">
      {!file || isLoading ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDragEnd={handleDragLeave}
          onDrop={handleDrop}
          onClick={!isLoading ? triggerFileInput : undefined}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center transition-all
            ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}
            ${isLoading ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'}
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptAttribute}
            onChange={handleFileInputChange}
            disabled={isLoading}
            className="hidden"
          />
          
          {isLoading ? (
            <div className="space-y-6">
              <div className="flex flex-col items-center">
                <svg 
                  className="animate-spin h-10 w-10 text-blue-500" 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24"
                >
                  <circle 
                    className="opacity-25" 
                    cx="12" 
                    cy="12" 
                    r="10" 
                    stroke="currentColor" 
                    strokeWidth="4"
                  />
                  <path 
                    className="opacity-75" 
                    fill="currentColor" 
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <h3 className="mt-4 text-lg font-medium text-gray-900">
                  {currentStep || 'Processing file...'}
                </h3>
              </div>
              
              <ProgressBar progress={progress} />
              
              {onCancel && (
                <button
                  onClick={handleCancel}
                  type="button"
                  className="mt-2 text-sm text-red-600 hover:text-red-800 focus:outline-none"
                >
                  Cancel
                </button>
              )}
            </div>
          ) : (
            <>
              <svg 
                className="mx-auto h-12 w-12 text-gray-400" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor" 
                aria-hidden="true"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={1.5} 
                  d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" 
                />
              </svg>
              
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                {isDragging ? 'Drop file here' : dropzoneText}
              </h3>
              
              <p className="mt-2 text-sm text-gray-500">
                Accepted file types: {acceptedFileTypes.map(type => type.split('/')[1]).join(', ')}
              </p>
              <p className="text-sm text-gray-500">
                Maximum file size: {maxFileSizeDisplay}
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="p-4 border border-gray-200 rounded-lg">
          <div className="flex items-center space-x-4">
            <svg 
              className="h-10 w-10 text-blue-500" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1.5} 
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
              />
            </svg>
            
            <div className="flex-1">
              <h4 className="text-sm font-medium text-gray-900">
                {file.name}
              </h4>
              <p className="text-sm text-gray-500">
                {formatFileSize(file.size)}
              </p>
            </div>
            
            <button
              onClick={() => {
                setFile(null);
                setLocalError(null);
              }}
              className="p-1 text-gray-400 hover:text-gray-500"
            >
              <svg 
                className="h-5 w-5" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M6 18L18 6M6 6l12 12" 
                />
              </svg>
            </button>
          </div>
        </div>
      )}
      
      {displayError && <ErrorDisplay error={displayError} />}
    </div>
  );
}