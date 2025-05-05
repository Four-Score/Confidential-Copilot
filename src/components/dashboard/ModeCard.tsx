import React from 'react';

interface ModeCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick?: () => void;
}

export const ModeCard: React.FC<ModeCardProps> = ({
  icon,
  title,
  description,
  onClick
}) => {
  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-xl shadow-md transition-all duration-300 hover:shadow-lg hover:translate-y-[-5px] p-6 cursor-pointer flex flex-col items-center text-center h-full"
    >
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2 text-purple-700">{title}</h3>
      <p className="text-gray-500 text-sm">{description}</p>
    </div>
  );
};