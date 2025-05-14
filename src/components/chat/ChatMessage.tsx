'use client';

import React from 'react';

export interface ChatMessageProps {
  message: {
    role: 'user' | 'assistant';
    content: string;
  };
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center 
          ${isUser ? 'bg-blue-600 ml-2' : 'bg-gray-300 mr-2'}`}>          {isUser ? (
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.5 8.5c0-1.5 1-2.5 3.5-2.5s3.5 1 3.5 2.5c0 1.5-1.5 2-1.5 3m-2 3h.01M12 3c-1.333 0-8 .6-8 9l1 3h14l1-3c0-8.4-6.667-9-8-9z" />
            </svg>
          )}
        </div>
        
        {/* Message Content */}
        <div 
          className={`rounded-lg p-3 break-words ${
            isUser 
              ? 'bg-blue-600 text-white shadow-sm' 
              : 'bg-white border border-gray-200 text-gray-800 shadow-sm'
          }`}
        >
          {/* Format message content with proper line breaks */}
          {message.content.split('\n').map((line, index) => (
            <React.Fragment key={index}>
              {line}
              {index < message.content.split('\n').length - 1 && <br />}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};