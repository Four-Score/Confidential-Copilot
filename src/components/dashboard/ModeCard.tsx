import React from 'react';

interface ModeCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick?: () => void;
}

export const ModeCard: React.FC<ModeCardProps> = ({ icon, title, description, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="cursor-pointer p-6 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-300"
    >
      <div className="text-4xl mb-3 text-purple-600">{icon}</div>
      <h3 className="font-semibold text-lg text-gray-800">{title}</h3>
      <p className="text-sm text-gray-600 mt-2">{description}</p>
    </div>
  );
};
