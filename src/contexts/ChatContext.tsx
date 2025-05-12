'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ProcessedSearchResult } from '@/types/search';




// Define message type
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  // Use just one consistent property for storing context
  contextResults?: ProcessedSearchResult | null;
}

// Define model type
export interface Model {
  id: string;
  name: string;
}

// Define the context state shape
interface ChatContextState {
  messages: ChatMessage[];
  selectedModel: string;
  isLoading: boolean;
  error: string | null;
}

// Define the context actions
interface ChatContextActions {
  addMessage: (role: 'user' | 'assistant', content: string, contextResults?: ProcessedSearchResult | null) => void;
  clearMessages: () => void;
  setModel: (modelId: string) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

// Combine state and actions for the full context value
interface ChatContextValue extends ChatContextState, ChatContextActions {}

// Create the context
const ChatContext = createContext<ChatContextValue | undefined>(undefined);

// Default available models
export const AVAILABLE_MODELS: Model[] = [
  { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B' },
  { id: 'deepseek-r1-distill-llama-70b', name: 'Deepseek R1' },
  { id: 'meta-llama/llama-4-maverick-17b-128e-instruct', name: 'Llama 4 Maverick' }
];

// Provider component
export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // State for the chat
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>(AVAILABLE_MODELS[0].id);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Add a message to the chat
  const addMessage = (
    role: 'user' | 'assistant', 
    content: string,
    contextResults?: ProcessedSearchResult | null
  ) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      role,
      content,
      timestamp: new Date(),
      contextResults
    };
    
    setMessages(prevMessages => [...prevMessages, newMessage]);
    
    // Clear any error when adding a new message
    if (error) {
      setError(null);
    }
  };

  // Clear all messages
  const clearMessages = () => {
    setMessages([]);
    setError(null);
  };

  // Set the selected model
  const setModel = (modelId: string) => {
    setSelectedModel(modelId);
  };

  // Provide the context value
  const value: ChatContextValue = {
    // State
    messages,
    selectedModel,
    isLoading,
    error,
    
    // Actions
    addMessage,
    clearMessages,
    setModel,
    setLoading: setIsLoading,
    setError
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

// Hook to use the chat context
export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
};