'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Project } from '@/types/project';

interface ProjectCardProps {
  project: Project;
  onDelete: (projectId: string) => Promise<{ error?: string } | undefined>;
}

export default function ProjectCard({ project, onDelete }: ProjectCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const router = useRouter();

  const formattedDate = new Date(project.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent navigation to project page
    
    if (isDeleting) return;
    
    setIsDeleting(true);
    setDeleteError(null);
    
    try {
      const result = await onDelete(project.id);
      if (result?.error) {
        setDeleteError(result.error);
        setShowDeleteConfirm(false);
      }
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete project');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCardClick = () => {
    router.push(`/projects/${project.id}`);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent navigation to project page
    setShowDeleteConfirm(true);
  };

  return (
    <div 
      className="bg-white border border-gray-200 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden cursor-pointer"
      onClick={handleCardClick}
    >
      <div className="p-5">
        <div className="flex justify-between items-start">
          <h3 className="text-xl font-semibold text-gray-900 mb-1 truncate">{project.name}</h3>
          <div className="relative">
            <button 
              onClick={(e) => handleDeleteClick(e)} 
              className="text-gray-400 hover:text-gray-600 p-1"
              aria-label="Delete project"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </button>
            
            {/* Delete confirmation popup */}
            {showDeleteConfirm && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                <div className="p-3">
                  <p className="text-sm text-gray-700 mb-2">Delete this project?</p>
                  <div className="flex justify-between">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDeleteConfirm(false);
                      }}
                      className="px-3 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className={`px-3 py-1 text-sm text-white bg-red-600 hover:bg-red-700 rounded ${isDeleting ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {isDeleting ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                  {deleteError && (
                    <p className="mt-2 text-xs text-red-600">{deleteError}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        
        <p className="text-sm text-gray-500 mb-4">Created on {formattedDate}</p>
        
        {project.description && (
          <p className="text-gray-700 mb-4 line-clamp-2">{project.description}</p>
        )}
        
        <div className="pt-2 border-t border-gray-100">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-sm text-gray-500">Click to view documents</span>
          </div>
        </div>
      </div>
    </div>
  );
}