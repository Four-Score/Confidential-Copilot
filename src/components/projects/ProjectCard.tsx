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
    <Link href={`/projects/${project.id}`} className="block">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition duration-200">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-semibold text-gray-800 truncate">{project.name}</h3>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-gray-400 hover:text-red-500 transition duration-200"
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
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            )}
          </button>
        </div>
        
        {project.description && (
          <p className="text-gray-600 mb-4 line-clamp-2">{project.description}</p>
        )}
        
        <div className="flex justify-between items-center text-sm text-gray-500">
          <span>Created {formatDate(project.created_at)}</span>
        </div>
        
        {error && (
          <div className="mt-3 text-sm text-red-500">{error}</div>
        )}
      </div>
    </Link>
  );
}