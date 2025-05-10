'use client';

import React, { useState } from 'react';
import { useChatContext } from '@/contexts/ChatContext';
import { ChatModel, ChatSettings } from '@/types/chat';
import { validateSettings } from '@/config/modelConfig';
import { useModelSwitching } from '@/hooks/useModelSwitching';
import ComprehensiveSettings from './ComprehensiveSettings';



export default function ModelSelection() {
  const { chatState, updateSettings } = useChatContext();
  const { 
    currentModel, 
    availableModels,
    compatibleModels,
    switchModel,
    isSwitching, 
    error 
  } = useModelSwitching();
  
  const [isOpen, setIsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  
  // Get current model data
  const selectedModel = availableModels.find(model => model.id === chatState.modelId) || availableModels[0];

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
  const handleModelChange = async (modelId: string) => {
    const success = await switchModel(modelId, true);
    if (success) {
      setIsOpen(false);
    }
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
        className={`
          flex items-center gap-2 px-3 py-2 rounded-md border border-gray-300 
          ${isSwitching ? 'bg-gray-100 cursor-wait' : 'hover:bg-gray-50 cursor-pointer'}
        `}
        onClick={() => {
          if (!isSwitching) {
            setIsOpen(!isOpen);
            setIsSettingsOpen(false);
          }
        }}
      >
        <span className="font-medium truncate max-w-[120px]">
          {currentModel?.name || 'Select Model'}
        </span>
        {isSwitching ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
        ) : (
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className={`h-4 w-4 text-gray-500 transition-transform ${isOpen ? 'transform rotate-180' : ''}`}
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
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
            {availableModels.map(model => {
              const isCompatible = compatibleModels.some(m => m.id === model.id);
              const isSelected = model.id === chatState.modelId;
              
              return (
                <div
                  key={model.id}
                  className={`
                    px-3 py-2 flex items-center justify-between 
                    ${!isCompatible && !isSelected ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-50'} 
                    ${isSelected ? 'bg-blue-50 text-blue-700' : ''}
                  `}
                  onClick={() => isCompatible || isSelected ? handleModelChange(model.id) : null}
                >
                  <div>
                    <div className="text-sm font-medium flex items-center">
                      {model.name}
                      {!isCompatible && !isSelected && (
                        <span className="ml-2 px-1.5 py-0.5 text-xs bg-amber-100 text-amber-800 rounded">
                          Too small
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">{model.description}</div>
                  </div>
                  {isSelected && (
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
              );
            })}
          </div>
          
          {/* Show error if present */}
          {error && (
            <div className="px-3 py-2 text-sm text-red-600 border-t border-gray-100">
              {error}
            </div>
          )}
        </div>
      )}
      
      {/* Settings panel */}
      {isSettingsOpen && (
        <div 
          className="absolute z-10 mt-2 w-80 right-0"
          data-settings-panel
        >
          <ComprehensiveSettings onClose={() => setIsSettingsOpen(false)} />
        </div>
      )}
    </div>
  );
}