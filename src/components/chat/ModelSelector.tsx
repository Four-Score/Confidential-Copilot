'use client';

import React from 'react';

export interface Model {
  id: string;
  name: string;
}

export interface ModelSelectorProps {
  models: Model[];
  selectedModel: string;
  onModelChange: (modelId: string) => void;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  models,
  selectedModel,
  onModelChange
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onModelChange(e.target.value);
  };

  return (
    <div className="flex items-center">
      <label htmlFor="model-selector" className="mr-2 text-sm font-medium text-gray-700">
        Model:
      </label>
      <select
        id="model-selector"
        value={selectedModel}
        onChange={handleChange}
        className="border rounded-md py-1 px-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        aria-label="Select AI model"
      >
        {models.map((model) => (
          <option key={model.id} value={model.id}>
            {model.name}
          </option>
        ))}
      </select>
    </div>
  );
};