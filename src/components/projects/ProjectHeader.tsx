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
      <div className="flex items-center mb-2">
        <Link href="/projects" className="text-blue-600 hover:text-blue-800 mr-2">
          &larr; Back to Projects
        </Link>
      </div>
      
      <div className="flex flex-col md:flex-row md:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">{project.name}</h1>
          {project.description && (
            <p className="text-gray-600 mb-2">{project.description}</p>
          )}
          <p className="text-sm text-gray-500">
            Created on {formatDate(project.created_at)}
          </p>
        </div>
      </div>
    </div>
  );
}