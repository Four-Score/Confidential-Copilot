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
    <div className="w-full p-6 bg-white rounded-lg shadow-sm border border-gray-100">
      <h2 className="font-bold text-lg mb-6 border-b pb-2">INTERACTION MODES</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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