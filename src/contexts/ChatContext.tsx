'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { 
  ChatMessage, 
  ChatModel, 
  ChatSettings, 
  ChatState,
  RetrievedContext
} from '@/types/chat';
import { v4 as uuidv4 } from 'uuid';
import { defaultModels, getDefaultSettings } from '@/config/modelConfig';
import { ChatSessionManager } from '@/services/chatSessionManager';


// Define the shape of our context
interface ChatContextType {
  // Current chat state
  chatState: ChatState;
  
  // Retrieved context for current query
  currentContext: RetrievedContext | null;
  
  // Available models
  availableModels: ChatModel[];

  
  
  // Chat management functions
  setModel: (modelId: string) => void;
  updateSettings: (settings: Partial<ChatSettings>) => void;
  addMessage: (role: 'user' | 'assistant' | 'system', content: string) => void;
  clearMessages: () => void;
  
  // Document selection functions
  setSelectedDocuments: (documentIds: string[]) => void;
  setSelectedProjects: (projectIds: string[]) => void;
  
  // Context management
  setCurrentContext: (context: RetrievedContext | null) => void;
  
  // Chat session management
  startNewChat: (keepDocuments?: boolean) => void;
  loadChat: (chatId: string) => boolean;
}

// Create the context with a default value
const defaultSettings = getDefaultSettings(defaultModels[0].id);

const defaultChatState: ChatState = {
  id: uuidv4(),
  messages: [],
  selectedDocumentIds: [],
  selectedProjectIds: [],
  modelId: defaultModels[0].id,
  settings: defaultSettings,
  createdAt: Date.now(),
  lastUpdatedAt: Date.now()
};

// Create context with undefined as default
const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function useChatContext() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
}

export { ChatContext, defaultChatState };