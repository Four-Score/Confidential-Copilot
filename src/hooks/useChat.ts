'use client';

import { useState } from 'react';
import { useChatContext, AVAILABLE_MODELS } from '@/contexts/ChatContext';
import { useVectorSearch } from '@/hooks/useVectorSearch';
import { useDataSelection } from '@/contexts/DataSelectionContext';

export const useChat = () => {
  // Get chat context
  const {
    messages,
    selectedModel,
    isLoading,
    error,
    addMessage,
    clearMessages,
    setModel,
    setLoading,
    setError
  } = useChatContext();

  // Get vector search functionality 
  const { search, results: searchResults, isLoading: isSearching } = useVectorSearch();
  
  // Get selected documents data
  const { selectedDocuments, selectedProjectId } = useDataSelection();
  
  // Local state for current input
  const [inputValue, setInputValue] = useState('');

  // Check if there are any messages
  const hasMessages = messages.length > 0;
  
  // Get available models
  const models = AVAILABLE_MODELS;

  // Function to handle model change
  const handleModelChange = (modelId: string) => {
    setModel(modelId);
  };

  // Function to handle input change
  const handleInputChange = (value: string) => {
    setInputValue(value);
  };

  // Function to send a message
  const sendMessage = async (content: string) => {
    if (!content.trim()) return;
    
    // Reset error state
    if (error) setError(null);
    
    try {
      // Set loading state
      setLoading(true);
      
      // Add user message to chat
      addMessage('user', content);
      
      // Clear input
      setInputValue('');
      
      // Only proceed if we have selected documents
      if (!selectedDocuments || selectedDocuments.length === 0) {
        throw new Error('No documents selected. Please select at least one document to search.');
      }
      
      // Get document IDs for search
      const documentIds = selectedDocuments.map(doc => doc.id);
      
      // Execute vector search 
      const searchResponse = await search(content, selectedProjectId as string, documentIds);
      
      // Format context from search results
      let formattedContext = '';
      let contextSources: { id: string; content: string; metadata: any; score: number }[] = [];
      
      if (searchResponse && searchResponse.groupedResults.length > 0) {
        // Format search results into context string
        formattedContext = formatSearchResultsToContext(searchResponse);
        
        // Transform the groupedResults to match the expected format
        contextSources = searchResponse.groupedResults.map(group => ({
            id: group.documentId,
            content: group.chunks.map(c => c.content || '').join('\n'),
            metadata: {
            documentName: group.documentName,
            documentType: group.documentType,
            isEncrypted: group.isEncrypted
            },
            score: group.maxSimilarity
        }));
        } else {
        formattedContext = "No relevant information found in the selected documents.";
        }
            
      // Call LLM API with context and user query
      const llmResponse = await callLlmApi(content, formattedContext, selectedModel);
      
      // Add LLM response to chat
      addMessage('assistant', llmResponse, searchResponse);
      
    } catch (err) {
      console.error('Error in chat operation:', err);
      
      // Provide more specific error messages based on the error type
      let errorMessage = 'An unknown error occurred';
      
      if (err instanceof Error) {
        if (err.message.includes('No documents selected')) {
          errorMessage = 'Please select at least one document to search.';
        } else if (err.message.includes('API')) {
          errorMessage = 'Unable to reach the AI service. Please try again later.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      
      // Add assistant message explaining the error
      addMessage(
        'assistant', 
        'Sorry, I encountered an error while processing your request. Please try again or select different documents.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Function to start a new chat
  const startNewChat = () => {
    if (hasMessages) {
      if (confirm('Start a new chat? This will clear the current conversation.')) {
        clearMessages();
      }
    }
  };

  // Placeholder function - will implement in later steps
  const formatSearchResultsToContext = (results: any) => {
    // This will be implemented in chatUtils.ts
    return "Placeholder for formatted context";
  };

  // Placeholder function - will implement in later steps
  const callLlmApi = async (query: string, context: string, model: string) => {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query,
        context,
        model
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to get response from LLM');
    }
    
    const data = await response.json();
    return data.response;
  } catch (error) {
    console.error('Error calling LLM API:', error);
    throw new Error('Failed to get a response. Please try again later.');
  }
};

  return {
    // State
    messages,
    inputValue,
    selectedModel,
    isLoading: isLoading || isSearching,
    error,
    models,
    hasMessages,
    
    // Actions
    sendMessage,
    handleInputChange,
    handleModelChange,
    startNewChat
  };
};