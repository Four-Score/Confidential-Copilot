'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useDataSelection } from '@/contexts/DataSelectionContext';
import { useChatContext } from '@/contexts/ChatContext';

/**
 * Hook to manage initialization of chat with selected documents
 * Handles transition from retrieval flow to chat interface
 */
export const useChatInitialization = () => {
  const router = useRouter();
  const { 
    selectedProjectId, 
    selectedProjectName,
    selectedDocuments,
    hasSelectedDocuments 
  } = useDataSelection();
  
  const { 
    setSelectedDocuments,
    setSelectedProjects,
    startNewChat
  } = useChatContext();

  /**
   * Initialize chat with current document selection
   * @param keepExistingChat If true, adds documents to current chat instead of creating a new one
   */
  const initializeChat = (keepExistingChat: boolean = false) => {
    if (!hasSelectedDocuments) {
      console.error('No documents selected for chat initialization');
      return false;
    }
    
    // Get document IDs from selection
    const documentIds = selectedDocuments.map(doc => doc.id);
    
    // Get project IDs (either from multi-select or single select)
    // Get project ID
    const projectIds = selectedProjectId ? [selectedProjectId] : [];
    // Update chat context with selections
    setSelectedDocuments(documentIds);
    setSelectedProjects(projectIds);
    
    if (!keepExistingChat) {
      startNewChat(true); // Start new chat but keep document selections
    }
    
    // Navigate to chat page
    router.push('/dashboard/chat');
    return true;
  };
  
  /**
   * Check if we're coming from a retrieval flow that's targeting chat
   * @param destination The destination specified in the retrieval flow
   */
  const handleRetrievalCompletion = (destination?: string) => {
    if (destination === 'chat' && hasSelectedDocuments()) {
      return initializeChat();
    }
    return false;
  };
  
  return {
    initializeChat,
    handleRetrievalCompletion,
    hasSelectedDocuments,
    selectedDocuments,
    selectedProjectIds: selectedProjectId ? [selectedProjectId] : []
  };
};
