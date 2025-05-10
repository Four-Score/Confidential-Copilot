'use client';

import { useCallback, useState } from 'react';
import { useChatContext } from '@/contexts/ChatContext';
import { getDefaultSettings, getModelById } from '@/config/modelConfig';
import { ChatSettings, ChatModel } from '@/types/chat';

/**
 * Hook for managing model switching in chat conversations
 * Handles preserving history and updating settings when changing models
 */
export function useModelSwitching() {
  const { 
    chatState, 
    availableModels, 
    setModel, 
    updateSettings 
  } = useChatContext();
  
  const [isSwitching, setIsSwitching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  /**
   * Get the current model object
   */
  const currentModel = getModelById(chatState.modelId);
  
  /**
   * Switch to a new model while preserving chat history
   * @param modelId The ID of the model to switch to
   * @param keepCustomSettings Whether to preserve user's custom settings where possible
   * @returns Success status of the model switch
   */
  const switchModel = useCallback(async (
    modelId: string, 
    keepCustomSettings: boolean = true
  ): Promise<boolean> => {
    setIsSwitching(true);
    setError(null);
    
    try {
      // Validate the model ID
      const newModel = getModelById(modelId);
      if (!newModel) {
        setError(`Invalid model ID: ${modelId}`);
        return false;
      }
      
      // Get default settings for the new model
      const defaultSettingsForModel = getDefaultSettings(modelId);
      
      // If keeping custom settings, merge with current settings where appropriate
      let newSettings: ChatSettings;
      
      if (keepCustomSettings && chatState.settings) {
        const currentSettings = chatState.settings;
        
        // Determine which settings to preserve and which to reset to defaults
        newSettings = {
          ...defaultSettingsForModel,
          
          // Preserve temperature if within valid range for the new model
          temperature: currentSettings.temperature >= 0 && currentSettings.temperature <= 1
            ? currentSettings.temperature
            : defaultSettingsForModel.temperature,
          
          // Preserve top-p if within valid range
          topP: currentSettings.topP !== undefined && currentSettings.topP >= 0 && currentSettings.topP <= 1
            ? currentSettings.topP 
            : defaultSettingsForModel.topP,
          
          // Adjust maxTokens if needed for the new model's context window
          maxTokens: Math.min(
            currentSettings.maxTokens,
            newModel.contextWindow - 500 // Ensure we don't exceed the new model's limits
          ),
          
          // Preserve penalty settings
          presencePenalty: currentSettings.presencePenalty,
          frequencyPenalty: currentSettings.frequencyPenalty,
          
          // Preserve RAG settings
          similarityThreshold: currentSettings.similarityThreshold,
          maxChunks: currentSettings.maxChunks,
          showContextCards: currentSettings.showContextCards
        };
      } else {
        // Use default settings for the new model
        newSettings = defaultSettingsForModel;
      }
      
      // Change the model (this should preserve messages)
      setModel(modelId);
      
      // Update settings for the new model
      updateSettings(newSettings);
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred while switching models';
      setError(errorMessage);
      return false;
    } finally {
      setIsSwitching(false);
    }
  }, [chatState.settings, setModel, updateSettings]);
  
  /**
   * Get compatible models for the current context size
   * Filters available models to those that can handle the current conversation
   */
  const getCompatibleModels = useCallback((): ChatModel[] => {
    // Estimate current token usage
    const estimatedTokens = chatState.messages.reduce((total, message) => {
      // Rough estimation: ~4 chars per token for English text
      const messageLength = typeof message.content === 'string' 
        ? message.content.length 
        : JSON.stringify(message.content).length;
      
      return total + Math.ceil(messageLength / 4);
    }, 0);
    
    // Add a buffer for future messages
    const estimatedTotalTokens = estimatedTokens + 1000;
    
    // Filter models that can handle this context
    return availableModels.filter(model => {
      // Model should have enough context window for the conversation + some room
      return model.contextWindow >= estimatedTotalTokens;
    });
  }, [availableModels, chatState.messages]);
  
  return {
    currentModel,
    availableModels,
    compatibleModels: getCompatibleModels(),
    switchModel,
    isSwitching,
    error
  };
}