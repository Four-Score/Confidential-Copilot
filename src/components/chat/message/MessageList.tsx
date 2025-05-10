'use client';

import React, { useRef, useEffect } from 'react';
import UserMessage from './UserMessage';
import AIMessage from './AIMessage';
import { ChatMessage } from '@/types/chat';
import { RetrievedContext } from '@/types/chat';

interface MessageListProps {
  messages: ChatMessage[];
  isLoading?: boolean;
  currentContext?: RetrievedContext | null;
}

export default function MessageList({ 
  messages, 
  isLoading = false, 
  currentContext
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  
  // Scroll to bottom when messages change or when loading state changes
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);
  
  // If there are no messages and not loading, show welcome message
  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-4">
        <div className="max-w-md text-center">
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Welcome to Confidential Chat</h2>
          <p className="text-gray-600 mb-6">
            Ask questions about your selected documents. Your data remains encrypted and private.
          </p>
          <div className="bg-gray-100 p-4 rounded-lg">
            <h3 className="font-medium text-gray-700 mb-2">Example questions:</h3>
            <ul className="text-sm text-gray-600 space-y-2 text-left">
              <li>• Summarize the key points from my documents</li>
              <li>• What are the main findings in the research paper?</li>
              <li>• Extract action items from the meeting notes</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col p-4 space-y-2 overflow-y-auto">
      {messages.map((msg, index) => {
        // Determine if this is the last AI message and should show context
        const isLastAiMessage = 
          msg.role === 'assistant' && 
          index === messages.length - 1;
        
        // For user messages
        if (msg.role === 'user') {
          return (
            <UserMessage 
              key={msg.id} 
              message={msg.content} 
              timestamp={msg.timestamp} 
            />
          );
        }
        
        // For AI messages
        if (msg.role === 'assistant') {
          return (
            <AIMessage 
              key={msg.id} 
              message={msg.content}
              timestamp={msg.timestamp}
              // Only pass context to the last AI message
              context={isLastAiMessage ? currentContext : null}
            />
          );
        }
        
        // For system messages (not shown in UI)
        return null;
      })}
      
      {/* Loading indicator for new AI message */}
      {isLoading && (
        <AIMessage 
          message="" 
          isLoading={true}
        />
      )}
      
      {/* Invisible element to scroll to */}
      <div ref={bottomRef} />
    </div>
  );
}