'use client';

import React, { useState } from 'react';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top'
}) => {
  const [isVisible, setIsVisible] = useState(false);
  
  // Determine position classes
  const getPositionClasses = () => {
    switch (position) {
      case 'bottom': return 'top-full left-1/2 transform -translate-x-1/2 mt-1';
      case 'left': return 'right-full top-1/2 transform -translate-y-1/2 mr-1';
      case 'right': return 'left-full top-1/2 transform -translate-y-1/2 ml-1';
      case 'top':
      default: return 'bottom-full left-1/2 transform -translate-x-1/2 mb-1';
    }
  };

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      
      {isVisible && (
        <div 
          className={`absolute z-50 px-2 py-1 text-xs font-medium text-white bg-gray-900 rounded shadow-sm whitespace-nowrap ${getPositionClasses()}`}
          role="tooltip"
        >
          {content}
          <div 
            className={`absolute w-2 h-2 bg-gray-900 transform rotate-45 ${
              position === 'top' ? 'top-full -translate-x-1/2 left-1/2 -mt-1' :
              position === 'bottom' ? 'bottom-full -translate-x-1/2 left-1/2 -mb-1' :
              position === 'left' ? 'left-full top-1/2 -translate-y-1/2 -ml-1' :
              'right-full top-1/2 -translate-y-1/2 -mr-1'
            }`}
          />
        </div>
      )}
    </div>
  );
};