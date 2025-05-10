'use client';

import React, { useState } from 'react';
import SettingsPanel from './SettingsPanel';
import ContextControls from './ContextControls';

interface ComprehensiveSettingsProps {
  onClose?: () => void;
}

export default function ComprehensiveSettings({ onClose }: ComprehensiveSettingsProps) {
  const [activeTab, setActiveTab] = useState<'model' | 'context'>('model');

  return (
    <div className="w-full bg-white rounded-lg border border-gray-200 shadow-md">
      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          className={`px-4 py-2 text-sm font-medium flex-1 ${
            activeTab === 'model'
              ? 'text-blue-600 border-b-2 border-blue-500'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('model')}
        >
          Model Settings
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium flex-1 ${
            activeTab === 'context'
              ? 'text-blue-600 border-b-2 border-blue-500'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('context')}
        >
          Context Controls
        </button>
      </div>

      {/* Content */}
      <div className="p-1">
        {activeTab === 'model' ? (
          <SettingsPanel onSettingsChange={onClose} />
        ) : (
          <ContextControls onSettingsChange={onClose} />
        )}
      </div>
    </div>
  );
}