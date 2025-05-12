'use client';

import React from 'react';

export interface LoadingIndicatorProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  text = 'Loading...',
  size = 'md',
  className = ''
}) => {
  // Size mapping for the dots and text
  const sizeClasses = {
    sm: 'h-1 w-1 mx-0.5 text-xs',
    md: 'h-2 w-2 mx-1 text-sm',
    lg: 'h-3 w-3 mx-1.5 text-base'
  };

  return (
    <div className={`flex items-center justify-center ${className}`} aria-live="polite" role="status">
      <div className="flex items-center">
        <div className={`rounded-full bg-gray-500 ${sizeClasses[size]} animate-pulse`}></div>
        <div className={`rounded-full bg-gray-500 ${sizeClasses[size]} animate-pulse animation-delay-150`}></div>
        <div className={`rounded-full bg-gray-500 ${sizeClasses[size]} animate-pulse animation-delay-300`}></div>
      </div>
      {text && <span className={`ml-2 text-gray-500 ${size === 'lg' ? 'text-base' : size === 'sm' ? 'text-xs' : 'text-sm'}`}>{text}</span>}
    </div>
  );
};