'use client';

import React, { useState } from 'react';
import { RetrievedContext } from '@/types/chat';
import { ContextDisplay } from '../context/ContextDisplay';
import LoadingStates from '../LoadingStates';

interface AIMessageProps {
  message: string;
  timestamp?: string;
  context?: RetrievedContext;
  isLoading?: boolean;
}

export const AIMessage: React.FC<AIMessageProps> = ({
  message,
  timestamp,
  context,
  isLoading = false
}) => {
  const [showContext, setShowContext] = useState(false);
  
  return (
    <div className="flex flex-col space-y-2 mb-4">
      <div className="flex items-start">
        <div className="flex-shrink-0 mr-2">
          <div className="bg-purple-600 rounded-full p-1.5">
            <svg 
              className="w-5 h-5 text-white" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
          </div>
        </div>
        <div className="flex-1 bg-white rounded-lg border border-gray-200 px-4 py-3 shadow-sm">
          {isLoading ? (
            <div className="flex items-center">
              <LoadingStates type="typing" />
            </div>
          ) : (
            <>
              <div className="whitespace-pre-wrap text-gray-800">{message}</div>
              
              {timestamp && (
                <div className="text-xs text-gray-400 mt-2">
                  {new Date(timestamp).toLocaleTimeString()}
                </div>
              )}
              
              {context && context.documents && context.documents.length > 0 && (
                <div className="mt-3">
                  <button
                    onClick={() => setShowContext(!showContext)}
                    className="text-xs flex items-center text-gray-500 hover:text-gray-800"
                  >
                    <svg
                      className={`w-4 h-4 mr-1 transition-transform ${showContext ? 'transform rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d={showContext ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"}
                      />
                    </svg>
                    {showContext ? 'Hide sources' : `Show sources (${context.documents.length} documents)`}
                  </button>
                  
                  {showContext && <ContextDisplay context={context} isExpanded={true} />}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};