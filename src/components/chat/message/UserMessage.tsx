'use client';

import React from 'react';

interface UserMessageProps {
  message: string;
  timestamp?: number;
}

export default function UserMessage({ message, timestamp }: UserMessageProps) {
  // Format timestamp if provided
  const formattedTime = timestamp 
    ? new Date(timestamp).toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit', 
        hour12: true 
      }) 
    : '';

  return (
    <div className="flex justify-end mb-4">
      <div className="flex flex-col">
        <div className="bg-blue-600 text-white py-2 px-4 rounded-tl-xl rounded-br-xl rounded-bl-xl max-w-[80%] sm:max-w-[70%] break-words shadow-sm">
          <p className="whitespace-pre-wrap">{message}</p>
        </div>
        {timestamp && (
          <span className="text-xs text-gray-500 mt-1 self-end mr-1">
            {formattedTime}
          </span>
        )}
      </div>
    </div>
  );
}