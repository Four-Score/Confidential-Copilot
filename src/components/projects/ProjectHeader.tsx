import Link from 'next/link';
import { Project } from '@/types/project';

interface ProjectHeaderProps {
  project: Project;
}

export default function ProjectHeader({ project }: ProjectHeaderProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="mb-8">
      <div className="flex items-center mb-4">
        <Link 
          href="/projects" 
          className="flex items-center text-blue-600 hover:text-blue-800 transition-colors group bg-white border border-gray-200 hover:border-blue-300 rounded-lg px-3 py-2 shadow-sm hover:shadow"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform duration-200" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Back to Projects</span>
        </Link>
      </div>
      
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">{project.name}</h1>
          {project.description && (
            <p className="text-gray-600 mb-2">{project.description}</p>
          )}
          <p className="text-sm text-gray-500 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Created on {formatDate(project.created_at)}
          </p>
        </div>
      </div>
    </div>
  );
}