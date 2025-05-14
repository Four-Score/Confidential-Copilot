import { useState } from 'react';
import Link from 'next/link';
import { Project } from '@/types/project';

interface ProjectCardProps {
  project: Project;
  onDelete: (projectId: string) => Promise<{ error: string } | undefined>;
}

export default function ProjectCard({ project, onDelete }: ProjectCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return;
    }
    
    setIsDeleting(true);
    setError(null);
    
    try {
      const result = await onDelete(project.id);
      if (result?.error) {
        setError(result.error);
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
    return (
    <Link href={`/projects/${project.id}`} className="block group">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 group-hover:shadow-xl group-hover:border-blue-300 transition-all duration-300 transform group-hover:-translate-y-1 relative overflow-hidden h-full flex flex-col">
        {/* Card accent color top bar */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-600 to-indigo-700"></div>
        
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center">
            <div className="mr-3 bg-blue-100 p-2.5 rounded-lg shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 truncate group-hover:text-blue-700 transition-colors">{project.name}</h3>
          </div>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-gray-400 hover:text-red-500 transition duration-200 p-1.5 rounded-full hover:bg-red-50 opacity-70 group-hover:opacity-100"
            aria-label="Delete project"
          >
            {isDeleting ? (
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            )}
          </button>
        </div>
        
        {project.description && (
          <p className="text-gray-600 mb-5 line-clamp-2 text-sm">{project.description}</p>
        )}
        
        {/* Flexible space to push the footer to the bottom */}
        <div className="flex-grow"></div>
        
        {/* Project stats */}
        <div className="mt-auto">
          {/* Divider */}
          <div className="border-t border-gray-100 pt-3 mb-3"></div>

          <div className="flex justify-between items-center text-xs text-gray-500 mt-3">
            <span className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {formatDate(project.created_at)}
            </span>
              <div className="bg-blue-50 text-blue-700 px-3.5 py-1.5 rounded-full text-xs font-medium group-hover:bg-blue-500 group-hover:text-white transition-all duration-300 shadow-sm">
              View Project →
            </div>
          </div>
        </div>
        
        {error && (
          <div className="mt-4 p-2 bg-red-50 border border-red-100 rounded text-red-600 text-sm">
            {error}
          </div>
        )}
      </div>
    </Link>
  );
}