'use client';

import React from 'react';

export interface NewChatButtonProps {
  hasMessages: boolean;
  onNewChat: () => void;
}

export const NewChatButton: React.FC<NewChatButtonProps> = ({
  hasMessages,
  onNewChat
}) => {
  const handleClick = () => {
    if (hasMessages) {
      if (confirm('Start a new chat? This will clear the current conversation.')) {
        onNewChat();
      }
    } else {
      onNewChat();
    }
  };
  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 transition-all shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
      aria-label="Start new chat"
    >
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        className="h-4 w-4" 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M12 4v16m8-8H4" 
        />
      </svg>
      New Chat
    </button>
  );
};