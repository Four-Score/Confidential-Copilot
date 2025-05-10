'use client';

import React from 'react';
import { useChatContext } from '@/contexts/ChatContext';

interface ContextControlsProps {
  className?: string;
  onSettingsChange?: () => void;
}

export default function ContextControls({ className = '', onSettingsChange }: ContextControlsProps) {
  const { chatState, updateSettings } = useChatContext();

  // Handle setting change
  const handleSettingChange = (settingKey: keyof typeof chatState.settings, value: any) => {
    updateSettings({ [settingKey]: value });
    if (onSettingsChange) {
      onSettingsChange();
    }
  };

  return (
    <div className={`p-4 rounded-lg border border-gray-200 bg-white shadow-sm ${className}`}>
      <h3 className="text-sm font-medium text-gray-700 mb-4">Context Controls</h3>
      
      {/* Similarity threshold slider */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <label htmlFor="similarityThreshold" className="text-xs text-gray-700">
            Similarity Threshold: {(chatState.settings.similarityThreshold ?? 0.75).toFixed(2)}
          </label>
        </div>
        <input
          type="range"
          id="similarityThreshold"
          min="0.1"
          max="0.99"
          step="0.01"
          value={chatState.settings.similarityThreshold ?? 0.75}
          onChange={(e) => handleSettingChange('similarityThreshold', parseFloat(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>0.1</span>
          <span>0.99</span>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Higher values require closer matches to your query
        </p>
      </div>
      
      {/* Max chunks slider */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <label htmlFor="maxChunks" className="text-xs text-gray-700">
            Max Chunks: {chatState.settings.maxChunks ?? 10}
          </label>
        </div>
        <input
          type="range"
          id="maxChunks"
          min="1"
          max="50"
          step="1"
          value={chatState.settings.maxChunks ?? 10}
          onChange={(e) => handleSettingChange('maxChunks', parseInt(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>1</span>
          <span>50</span>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Number of document chunks to include in context
        </p>
      </div>
      
      {/* Show context cards toggle */}
      <div className="flex items-center justify-between">
        <div>
          <label htmlFor="showContextCards" className="text-xs text-gray-700">
            Show context cards
          </label>
          <p className="text-xs text-gray-500">
            Display source documents with AI responses
          </p>
        </div>
        <label className="inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            id="showContextCards"
            checked={chatState.settings.showContextCards ?? true}
            onChange={(e) => handleSettingChange('showContextCards', e.target.checked)}
            className="sr-only peer"
          />
          <div className="relative w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>
    </div>
  );
}