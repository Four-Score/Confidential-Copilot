'use client';

import React from 'react';
import { useChatContext } from '@/contexts/ChatContext';
import { getDefaultSettings } from '@/config/modelConfig';

interface SettingsPanelProps {
  className?: string;
  onSettingsChange?: () => void;
}

export default function SettingsPanel({ className = '', onSettingsChange }: SettingsPanelProps) {
  const { chatState, updateSettings } = useChatContext();
  
  // Format number for token display
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  // Handle setting change
  const handleSettingChange = (settingKey: keyof typeof chatState.settings, value: any) => {
    updateSettings({ [settingKey]: value });
    if (onSettingsChange) {
      onSettingsChange();
    }
  };

  // Reset settings to defaults for current model
  const handleResetToDefaults = () => {
    const defaultSettings = getDefaultSettings(chatState.modelId);
    updateSettings(defaultSettings);
    if (onSettingsChange) {
      onSettingsChange();
    }
  };

  return (
    <div className={`p-4 rounded-lg border border-gray-200 bg-white shadow-sm ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-medium text-gray-700">Model Settings</h3>
        <button
          onClick={handleResetToDefaults}
          className="text-xs text-blue-600 hover:text-blue-800"
        >
          Reset to defaults
        </button>
      </div>
      
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
        </div>
        <input
          type="range"
          id="maxTokens"
          min="100"
          max="8000"
          step="100"
          value={chatState.settings.maxTokens}
          onChange={(e) => handleSettingChange('maxTokens', parseInt(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>100</span>
          <span>8000</span>
        </div>
      </div>
      
      {/* Top-P slider (if available in settings) */}
      {chatState.settings.topP !== undefined && (
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1">
            <label htmlFor="topP" className="text-xs text-gray-700">
              Top-P: {chatState.settings.topP.toFixed(2)}
            </label>
          </div>
          <input
            type="range"
            id="topP"
            min="0"
            max="1"
            step="0.01"
            value={chatState.settings.topP}
            onChange={(e) => handleSettingChange('topP', parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>0</span>
            <span>1</span>
          </div>
        </div>
      )}

      {/* Frequency penalty slider (if available) */}
      {chatState.settings.frequencyPenalty !== undefined && (
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1">
            <label htmlFor="frequencyPenalty" className="text-xs text-gray-700">
              Frequency Penalty: {chatState.settings.frequencyPenalty.toFixed(2)}
            </label>
          </div>
          <input
            type="range"
            id="frequencyPenalty"
            min="-2"
            max="2"
            step="0.1"
            value={chatState.settings.frequencyPenalty}
            onChange={(e) => handleSettingChange('frequencyPenalty', parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>-2</span>
            <span>2</span>
          </div>
        </div>
      )}
      
      {/* Presence penalty slider (if available) */}
      {chatState.settings.presencePenalty !== undefined && (
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1">
            <label htmlFor="presencePenalty" className="text-xs text-gray-700">
              Presence Penalty: {chatState.settings.presencePenalty.toFixed(2)}
            </label>
          </div>
          <input
            type="range"
            id="presencePenalty"
            min="-2"
            max="2"
            step="0.1"
            value={chatState.settings.presencePenalty}
            onChange={(e) => handleSettingChange('presencePenalty', parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>-2</span>
            <span>2</span>
          </div>
        </div>
      )}
    </div>
  );
}