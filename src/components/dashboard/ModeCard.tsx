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
      className="cursor-pointer p-4 bg-gray-50 hover:bg-gray-100 border rounded-md shadow-sm transition-all"
    >
      <div className="text-3xl mb-2">{icon}</div>
      <h3 className="font-semibold text-md">{title}</h3>
      <p className="text-sm text-gray-600 mt-1">{description}</p>
    </div>
  );
};
