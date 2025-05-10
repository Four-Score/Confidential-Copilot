'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useChatContext } from '@/contexts/ChatContext';

interface ChatInputProps {
  onSubmit: (message: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export default function ChatInput({
  onSubmit,
  isLoading = false,
  disabled = false,
  placeholder = 'Ask a question about your documents...'
}: ChatInputProps) {
  const [inputValue, setInputValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea based on content
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [inputValue]);

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedMessage = inputValue.trim();
    if (!trimmedMessage || isLoading || disabled) return;
    
    onSubmit(trimmedMessage);
    setInputValue('');
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  // Handle keyboard shortcuts (Enter to send, Shift+Enter for new line)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="border-t border-gray-200 bg-white py-4 px-4 shadow-md">
      <form onSubmit={handleSubmit} className="flex items-end gap-2 max-w-4xl mx-auto">
        <div className="relative flex-grow">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || isLoading}
            className={`w-full resize-none rounded-lg border border-gray-300 px-4 py-3 pr-12 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 ${
              disabled ? 'bg-gray-100 text-gray-500' : 'bg-white'
            }`}
            rows={1}
            style={{ maxHeight: '200px', overflowY: 'auto' }}
          />
          {isLoading && (
            <div className="absolute right-3 bottom-3 flex items-center">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
            </div>
          )}
        </div>
        <button
          type="submit"
          disabled={!inputValue.trim() || isLoading || disabled}
          className={`flex h-10 items-center justify-center rounded-lg px-4 text-white transition-colors ${
            !inputValue.trim() || disabled
              ? 'bg-blue-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            className="h-5 w-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M14 5l7 7m0 0l-7 7m7-7H3"
            />
          </svg>
        </button>
      </form>
      <p className="text-xs text-gray-500 text-center mt-2">
        Press Enter to send, Shift+Enter for new line
      </p>
    </div>
  );
}