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
      className="cursor-pointer p-8 h-full bg-white hover:translate-y-[-8px] border border-gray-200 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 group relative overflow-hidden flex flex-col"
    >
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-600 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
      <div className="flex items-center mb-4">
        <div className="p-3 rounded-lg bg-blue-50 group-hover:bg-blue-100 transition-colors duration-300">
          <div className="text-4xl text-blue-600">{icon}</div>
        </div>
      </div>
      <h3 className="font-semibold text-lg text-gray-800 mb-2 group-hover:text-blue-700 transition-colors">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  );
};
