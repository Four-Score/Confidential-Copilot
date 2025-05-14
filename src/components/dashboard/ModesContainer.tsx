import React from 'react';
import { ModeCard } from './ModeCard';

interface ModeData {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick?: () => void;
}

interface ModesContainerProps {
  modes: ModeData[];
}

export const ModesContainer: React.FC<ModesContainerProps> = ({ modes }) => {
  return (
    <div className="w-full bg-transparent mb-16"> {/* Increased bottom margin for better spacing */}
      <h2 className="font-semibold text-2xl mb-8 text-gray-700 flex items-center">
        <span className="mr-3 text-blue-600">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="9" y1="3" x2="9" y2="21"></line>
            <line x1="15" y1="3" x2="15" y2="21"></line>
            <line x1="3" y1="9" x2="21" y2="9"></line>
            <line x1="3" y1="15" x2="21" y2="15"></line>
          </svg>
        </span>
        INTERACTION MODES
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {modes.map((mode, index) => (
          <ModeCard
            key={index}
            icon={mode.icon}
            title={mode.title}
            description={mode.description}
            onClick={mode.onClick}
          />
        ))}
      </div>
    </div>
  );
};