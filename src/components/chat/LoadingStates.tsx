'use client';

import React from 'react';

interface LoadingIndicatorProps {
  type?: 'search' | 'typing' | 'initial' | 'progress';
  progress?: number; // For progress indicator (0-100)
  text?: string;
  className?: string;
}

/**
 * Component to display various loading indicators for different states
 * in the chat interface
 */
export default function LoadingStates({
  type = 'typing',
  progress = 0,
  text,
  className = ''
}: LoadingIndicatorProps) {
  // Calculate width for progress bar
  const progressWidth = `${Math.min(100, Math.max(0, progress))}%`;
  
  switch (type) {
    // Typing indicator (dots animation)
    case 'typing':
      return (
        <div className={`flex items-center space-x-2 ${className}`}>
          <div className="dot-typing"></div>
          {text && <span className="text-sm text-gray-500">{text}</span>}
        </div>
      );
    
    // Search indicator (spinner)
    case 'search':
      return (
        <div className={`flex items-center space-x-2 ${className}`}>
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-blue-600"></div>
          <span className="text-sm text-gray-500">
            {text || 'Searching documents...'}
          </span>
        </div>
      );
    
    // Initial loading (pulsing dots)
    case 'initial':
      return (
        <div className={`flex flex-col items-center justify-center py-8 ${className}`}>
          <div className="flex space-x-2">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse delay-75"></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse delay-150"></div>
          </div>
          {text && (
            <span className="text-sm text-gray-500 mt-3">{text}</span>
          )}
        </div>
      );
    
    // Progress bar indicator  
    case 'progress':
      return (
        <div className={`flex flex-col w-full ${className}`}>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-in-out" 
              style={{ width: progressWidth }}
            ></div>
          </div>
          {text && (
            <span className="text-xs text-gray-500 mt-1">{text}</span>
          )}
        </div>
      );
    
    default:
      return null;
  }
}

// CSS for the typing indicator
// Add this to your globals.css or component style
export const loadingStateStyles = `
.dot-typing {
  position: relative;
  height: 6px;
  width: 6px;
  border-radius: 50%;
  background-color: #3b82f6;
  animation: dot-typing-bounce 1.5s infinite linear;
}

.dot-typing:before,
.dot-typing:after {
  content: '';
  position: absolute;
  top: 0;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: #3b82f6;
  animation: dot-typing-bounce 1.5s infinite linear;
}

.dot-typing:before {
  left: -12px;
  animation-delay: -0.3s;
}

.dot-typing:after {
  left: 12px;
  animation-delay: 0.3s;
}

@keyframes dot-typing-bounce {
  0%, 80%, 100% { 
    transform: scale(0.8);
    opacity: 0.5;
  }
  40% { 
    transform: scale(1);
    opacity: 1;
  }
}
`;

// Optional: Add to global styles
// This ensures the loading styles are available globally
export function LoadingStylesScript() {
  return (
    <style jsx global>
      {loadingStateStyles}
    </style>
  );
}