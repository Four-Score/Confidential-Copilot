import { Project } from '@/types/project';
import ProjectCard from './ProjectCard';

interface ProjectListProps {
  projects: Project[];
  onDeleteProject: (projectId: string) => Promise<{ error: string } | undefined>;
}

export default function ProjectList({ projects, onDeleteProject }: ProjectListProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => (
        <ProjectCard 
          key={project.id} 
          project={project} 
          onDelete={onDeleteProject} 
        />
      ))}
    </div>
  );
}