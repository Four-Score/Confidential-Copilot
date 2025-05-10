'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { ChatContext, defaultChatState } from '@/contexts/ChatContext';
import { 
  ChatState, 
  ChatSettings, 
  ChatMessage,
  RetrievedContext
} from '@/types/chat';
import { v4 as uuidv4 } from 'uuid';
import { defaultModels, getDefaultSettings } from '@/config/modelConfig';
import { ChatSessionManager } from '@/services/chatSessionManager';


const LOCAL_STORAGE_CHAT_KEY = 'confidential-copilot-chat-state';
const LOCAL_STORAGE_SETTINGS_KEY = 'confidential-copilot-chat-settings';

interface ChatProviderProps {
  children: React.ReactNode;
}

export function ChatProvider({ children }: ChatProviderProps) {
  // State
  const [chatState, setChatState] = useState<ChatState>(defaultChatState);
  const [currentContext, setCurrentContext] = useState<RetrievedContext | null>(null);
  const [availableModels] = useState(defaultModels);

  // Initialize chat state from localStorage on mount
  useEffect(() => {
    try {
      const savedChatState = localStorage.getItem(LOCAL_STORAGE_CHAT_KEY);
      if (savedChatState) {
        const parsedState = JSON.parse(savedChatState) as ChatState;
        setChatState(parsedState);
      }
      
      // Load custom settings if they exist
      const savedSettings = localStorage.getItem(LOCAL_STORAGE_SETTINGS_KEY);
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings) as ChatSettings;
        setChatState(current => ({
          ...current,
          settings: {
            ...current.settings,
            ...parsedSettings
          }
        }));
      }
    } catch (error) {
      console.error('Error loading chat state from localStorage:', error);
    }
  }, []);

  // Save chat state to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_CHAT_KEY, JSON.stringify(chatState));
    } catch (error) {
      console.error('Error saving chat state to localStorage:', error);
    }
  }, [chatState]);

  // Functions for updating chat state
  const setModel = useCallback((modelId: string) => {
    setChatState(current => {
      // Use default settings for the new model but preserve user overrides
      const defaultSettings = getDefaultSettings(modelId);
      return {
        ...current,
        modelId,
        settings: {
          ...defaultSettings,
          ...current.settings,
        }
      };
    });
  }, []);

  const updateSettings = useCallback((settings: Partial<ChatSettings>) => {
    setChatState(current => ({
      ...current,
      settings: {
        ...current.settings,
        ...settings
      }
    }));
    // Also persist settings separately to reuse across chats
    try {
      const currentSettings = localStorage.getItem(LOCAL_STORAGE_SETTINGS_KEY);
      const parsedSettings = currentSettings ? JSON.parse(currentSettings) as ChatSettings : {};
      localStorage.setItem(
        LOCAL_STORAGE_SETTINGS_KEY,
        JSON.stringify({
          ...parsedSettings,
          ...settings
        })
      );
    } catch (error) {
      console.error('Error saving settings to localStorage:', error);
    }
  }, []);

  const addMessage = useCallback((role: "user" | "assistant" | "system", content: string) => {
    const message: ChatMessage = {
      id: uuidv4(),
      role,
      content,
      timestamp: Date.now()
    };
    
    setChatState(prevState => {
      const updatedMessages = [...prevState.messages, message];
      
      // Use ChatSessionManager to limit the context window
      const limitedMessages = ChatSessionManager.limitMessagesByTokens(
        updatedMessages,
        prevState.settings.maxTokens - 1000 // Reserve 1000 tokens for the response
      );
      
      // Return updated state with limited messages
      return {
        ...prevState,
        messages: limitedMessages,
        lastUpdatedAt: Date.now()
      };
    });
  }, []);
  const clearMessages = useCallback(() => {
    setChatState(current => ({
      ...current,
      messages: []
    }));
  }, []);

  const setSelectedDocuments = useCallback((documentIds: string[]) => {
    setChatState(current => ({
      ...current,
      selectedDocumentIds: documentIds
    }));
  }, []);

  const setSelectedProjects = useCallback((projectIds: string[]) => {
    setChatState(current => ({
      ...current,
      selectedProjectIds: projectIds
    }));
  }, []);

  const startNewChat = (keepDocumentSelection = false) => {
    // Save current chat before starting a new one, if there are messages
    if (chatState.messages.length > 0) {
      ChatSessionManager.saveChat(chatState, chatState.id);
    }
    
    // Create a new chat state
    setChatState(prevState => ({
      ...defaultChatState,
      id: `chat_${Date.now()}`,
      createdAt: Date.now(),
      // Keep document selection if requested
      selectedDocumentIds: keepDocumentSelection ? prevState.selectedDocumentIds : [],
      selectedProjectIds: keepDocumentSelection ? prevState.selectedProjectIds : [],
    }));
  };

  const loadChat = (chatId: string) => {
    const storedChat = ChatSessionManager.getChat(chatId);
    if (storedChat) {
      setChatState({
        id: storedChat.id,
        name: storedChat.name,
        messages: storedChat.messages,
        selectedDocumentIds: storedChat.selectedDocumentIds || [],
        selectedProjectIds: storedChat.selectedProjectIds || [],
        modelId: storedChat.modelId,
        settings: chatState.settings, // Keep current settings
        createdAt: storedChat.createdAt,
        lastUpdatedAt: Date.now()
      });
      return true;
    }
    return false;
  };


  const contextValue = {
    chatState,
    currentContext,
    availableModels,
    setModel,
    updateSettings,
    addMessage,
    clearMessages,
    setSelectedDocuments,
    setSelectedProjects,
    setCurrentContext,
    startNewChat,
    loadChat
  };

  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  );
}