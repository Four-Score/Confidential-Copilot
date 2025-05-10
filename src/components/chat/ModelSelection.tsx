'use client';

import React, { useState } from 'react';
import { useChatContext } from '@/contexts/ChatContext';
import { ChatModel, ChatSettings } from '@/types/chat';
import { validateSettings } from '@/config/modelConfig';

export default function ModelSelection() {
  const { chatState, availableModels, setModel, updateSettings } = useChatContext();
  const [isOpen, setIsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Get current model data
  const currentModel = availableModels.find(model => model.id === chatState.modelId) || availableModels[0];

  // Close dropdowns when clicking outside
  const handleClickOutside = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    
    // Close if clicking outside the dropdown
    if (!target.closest('[data-model-dropdown]') && !target.closest('[data-settings-panel]')) {
      setIsOpen(false);
      setIsSettingsOpen(false);
    }
  };

  // Add and remove event listeners
  React.useEffect(() => {
    if (isOpen || isSettingsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, isSettingsOpen]);

  // Handle model change
  const handleModelChange = (modelId: string) => {
    setModel(modelId);
    setIsOpen(false);
  };

  // Handle settings change
  const handleSettingChange = (settingKey: keyof ChatSettings, value: any) => {
    updateSettings({ [settingKey]: value });
  };

  // Format number for token display
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  return (
    <div className="relative" data-model-dropdown>
      {/* Model selector button */}
      <div 
        className="flex items-center gap-2 px-3 py-2 rounded-md border border-gray-300 hover:bg-gray-50 cursor-pointer text-sm"
        onClick={() => {
          setIsOpen(!isOpen);
          setIsSettingsOpen(false);
        }}
      >
        <span className="font-medium truncate max-w-[120px]">
          {currentModel.name}
        </span>
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className={`h-4 w-4 text-gray-500 transition-transform ${isOpen ? 'transform rotate-180' : ''}`}
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      
      {/* Settings button */}
      <button
        className="ml-2 p-2 rounded-full hover:bg-gray-100 text-gray-600"
        onClick={(e) => {
          e.stopPropagation();
          setIsSettingsOpen(!isSettingsOpen);
          setIsOpen(false);
        }}
        title="Model settings"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-5 w-5" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" 
          />
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" 
          />
        </svg>
      </button>
      
      {/* Model dropdown menu */}
      {isOpen && (
        <div className="absolute z-10 mt-2 w-64 rounded-md bg-white shadow-lg border border-gray-200 right-0">
          <div className="py-1">
            <div className="px-3 py-2 text-sm font-medium text-gray-700 border-b border-gray-100">
              Select Model
            </div>
            {availableModels.map(model => (
              <div
                key={model.id}
                className={`px-3 py-2 flex items-center justify-between cursor-pointer hover:bg-gray-50 ${
                  model.id === currentModel.id ? 'bg-blue-50 text-blue-700' : ''
                }`}
                onClick={() => handleModelChange(model.id)}
              >
                <div>
                  <div className="text-sm font-medium">{model.name}</div>
                  <div className="text-xs text-gray-500">{model.description}</div>
                </div>
                {model.id === currentModel.id && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-blue-600"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Settings panel */}
      {isSettingsOpen && (
        <div 
          className="absolute z-10 mt-2 w-80 rounded-md bg-white shadow-lg border border-gray-200 right-0"
          data-settings-panel
        >
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Model Settings</h3>
            
            {/* Temperature slider */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="temperature" className="text-xs text-gray-700">
                  Temperature: {chatState.settings.temperature.toFixed(1)}
                </label>
                <span className="text-xs text-gray-500">
                  {chatState.settings.temperature === 0 
                    ? 'Deterministic' 
                    : chatState.settings.temperature < 0.5 
                      ? 'More focused' 
                      : chatState.settings.temperature > 0.8 
                        ? 'More creative' 
                        : 'Balanced'}
                </span>
              </div>
              <input
                type="range"
                id="temperature"
                min="0"
                max="1"
                step="0.1"
                value={chatState.settings.temperature}
                onChange={(e) => handleSettingChange('temperature', parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>0</span>
                <span>1</span>
              </div>
            </div>
            
            {/* Max tokens slider */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="maxTokens" className="text-xs text-gray-700">
                  Max Tokens: {formatNumber(chatState.settings.maxTokens)}
                </label>
                <span className="text-xs text-gray-500">
                  {`Max: ${formatNumber(currentModel.contextWindow - 500)}`}
                </span>
              </div>
              <input
                type="range"
                id="maxTokens"
                min="100"
                max={currentModel.contextWindow - 500}
                step="100"
                value={chatState.settings.maxTokens}
                onChange={(e) => handleSettingChange('maxTokens', parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>100</span>
                <span>{formatNumber(currentModel.contextWindow - 500)}</span>
              </div>
            </div>
            
            {/* Context settings */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="similarityThreshold" className="text-xs text-gray-700">
                  Similarity Threshold: {(chatState.settings.similarityThreshold || 0.5).toFixed(2)}
                </label>
              </div>
              <input
                type="range"
                id="similarityThreshold"
                min="0.1"
                max="0.99"
                step="0.01"
                value={chatState.settings.similarityThreshold || 0.5}
                onChange={(e) => handleSettingChange('similarityThreshold', parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>0.1</span>
                <span>0.99</span>
              </div>
            </div>
            
            {/* Max chunks setting */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="maxChunks" className="text-xs text-gray-700">
                  Max Chunks: {chatState.settings.maxChunks}
                </label>
              </div>
              <input
                type="range"
                id="maxChunks"
                min="1"
                max="50"
                step="1"
                value={chatState.settings.maxChunks}
                onChange={(e) => handleSettingChange('maxChunks', parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>1</span>
                <span>50</span>
              </div>
            </div>
            
            {/* Show context cards toggle */}
            <div className="flex items-center justify-between">
              <label htmlFor="showContextCards" className="text-xs text-gray-700">
                Show context cards
              </label>
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  id="showContextCards"
                  checked={chatState.settings.showContextCards}
                  onChange={(e) => handleSettingChange('showContextCards', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="relative w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}