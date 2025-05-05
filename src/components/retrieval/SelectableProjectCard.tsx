import React from 'react';
import { Project } from '@/types/project';

interface SelectableProjectCardProps {
  project: Project;
  isSelected: boolean;
  onClick: (project: Project) => void;
}

export const SelectableProjectCard: React.FC<SelectableProjectCardProps> = ({
  project,
  isSelected,
  onClick
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  return (
    <div 
      onClick={() => onClick(project)}
      className={`
        bg-white p-6 rounded-lg shadow-sm border-2 transition duration-200 cursor-pointer
        ${isSelected 
          ? 'border-blue-500 shadow-md bg-blue-50' 
          : 'border-gray-200 hover:shadow-md hover:border-blue-300'
        }
      `}
    >
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-semibold text-gray-800 truncate">{project.name}</h3>
        
        {/* Selection indicator */}
        {isSelected && (
          <div className="bg-blue-500 text-white rounded-full p-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>
      
      {project.description && (
        <p className="text-gray-600 mb-4 line-clamp-2">{project.description}</p>
      )}
      
      <div className="text-sm text-gray-500">
        <span>Created {formatDate(project.created_at)}</span>
      </div>
    </div>
  );
};