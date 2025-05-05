'use client';

import React from 'react';
import { Tooltip } from '@/components/ui/Tooltip';

interface SimilarityScoreProps {
  score: number;  // Value between 0 and 1
  size?: 'sm' | 'md' | 'lg';  // Size variants
  showValue?: boolean;  // Whether to show the numerical value
}

export const SimilarityScore: React.FC<SimilarityScoreProps> = ({
  score,
  size = 'md',
  showValue = true
}) => {
  // Ensure score is between 0 and 1
  const normalizedScore = Math.max(0, Math.min(1, score));
  
  // Calculate percentage for display
  const percentage = Math.round(normalizedScore * 100);
  
  // Determine color based on score
  const getColor = () => {
    if (percentage >= 90) return 'bg-green-500';
    if (percentage >= 75) return 'bg-green-400';
    if (percentage >= 60) return 'bg-yellow-500';
    if (percentage >= 40) return 'bg-yellow-400';
    return 'bg-red-400';
  };
  
  // Determine width of indicator and text size based on component size
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          container: 'h-1.5 w-16',
          text: 'text-xs'
        };
      case 'lg':
        return {
          container: 'h-3 w-32',
          text: 'text-base'
        };
      case 'md':
      default:
        return {
          container: 'h-2 w-24',
          text: 'text-sm'
        };
    }
  };
  
  const sizeClasses = getSizeClasses();
  
  return (
    <Tooltip content="Similarity score indicates how closely this content matches your search query">
      <div className="flex items-center space-x-2">
        <div className={`relative bg-gray-200 rounded-full overflow-hidden ${sizeClasses.container}`}>
          <div 
            className={`absolute top-0 left-0 h-full ${getColor()} rounded-full`} 
            style={{ width: `${percentage}%` }} 
          />
        </div>
        
        {showValue && (
          <span className={`font-medium ${sizeClasses.text}`}>
            {percentage}%
          </span>
        )}
      </div>
    </Tooltip>
  );
};