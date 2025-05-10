import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';

interface ErrorDisplayProps {
  /**
   * Error message to display
   */
  error: string;
  
  /**
   * Additional CSS class to apply
   */
  className?: string;

  /**
   * Optional function to retry the operation
   */
  retryFn?: () => void;

  /**
   * Optional function to dismiss the error
   */
  dismissFn?: () => void;

  /**
   * Optional technical details about the error
   */
  errorDetails?: any;
}

export default function ErrorDisplay({
  error,
  className = '',
  retryFn,
  dismissFn,
  errorDetails
}: ErrorDisplayProps) {
  const [showDetails, setShowDetails] = useState(false);
  
  // Log error to console for debugging
  useEffect(() => {
    if (errorDetails) {
      console.error('Error details:', errorDetails);
    }
  }, [errorDetails]);

  if (!error) return null;
  
  return (
    <div className={`mt-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md ${className}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <svg 
            className="h-5 w-5 text-red-500" 
            viewBox="0 0 20 20" 
            fill="currentColor"
            aria-hidden="true"
          >
            <path 
              fillRule="evenodd" 
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" 
              clipRule="evenodd" 
            />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm">
            {error}
          </p>
          
          {/* Show technical details if available */}
          {errorDetails && (
            <div className="mt-2">
              <button
                type="button"
                className="text-xs text-red-600 underline hover:text-red-800"
                onClick={() => setShowDetails(!showDetails)}
              >
                {showDetails ? 'Hide technical details' : 'Show technical details'}
              </button>
              
              {showDetails && (
                <pre className="mt-2 p-2 text-xs bg-red-100 rounded overflow-x-auto">
                  {typeof errorDetails === 'string'
                    ? errorDetails
                    : JSON.stringify(errorDetails, null, 2)}
                </pre>
              )}
            </div>
          )}
          
          {/* Show action buttons if retry or dismiss functions provided */}
          {(retryFn || dismissFn) && (
            <div className="mt-3 flex space-x-2">
              {retryFn && (
                <Button
                  onClick={retryFn}
                  size="sm"
                  variant="secondary"
                  className="flex items-center"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Retry
                </Button>
              )}
              
              {dismissFn && (
                <Button
                  onClick={dismissFn}
                  size="sm"
                  variant="outline"
                  className="flex items-center"
                >
                  Dismiss
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}