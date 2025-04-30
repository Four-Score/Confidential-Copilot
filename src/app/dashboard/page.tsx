'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import ProjectList from '@/components/dashboard/ProjectList';
import CreateProjectModal from '@/components/dashboard/CreateProjectModal';
import EmptyState from '@/components/dashboard/EmptyState';
import { Project } from '@/types/project';

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'created_at'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [searchQuery, setSearchQuery] = useState('');
  
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated());

  // Fetch projects when component mounts
  useEffect(() => {
    if (!isAuthenticated) return;
    
    async function fetchProjects() {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch('/api/projects');
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch projects');
        }
        
        const data = await response.json();
        setProjects(data.projects || []);
      } catch (err) {
        console.error('Error fetching projects:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchProjects();
  }, [isAuthenticated]);

  // Handle project creation
  const handleCreateProject = async (projectData: { name: string; description?: string }) => {
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create project');
      }
      
      const data = await response.json();
      setProjects([data.project, ...projects]);
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error creating project:', err);
      return { error: err instanceof Error ? err.message : 'An unknown error occurred' };
    }
  };

  // Handle project deletion
  const handleDeleteProject = async (projectId: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete project');
      }
      
      setProjects(projects.filter(project => project.id !== projectId));
    } catch (err) {
      console.error('Error deleting project:', err);
      return { error: err instanceof Error ? err.message : 'An unknown error occurred' };
    }
  };

  // Filter and sort projects
  const filteredAndSortedProjects = projects
    .filter(project => 
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (project.description || '').toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'name') {
        return sortOrder === 'asc' 
          ? a.name.localeCompare(b.name) 
          : b.name.localeCompare(a.name);
      } else {
        return sortOrder === 'asc' 
          ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime() 
          : new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

  // Toggle sort order
  const handleSort = (field: 'name' | 'created_at') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">My Projects</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition duration-200"
        >
          Create Project
        </button>
      </div>

      {/* Search and filter controls */}
      <div className="mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="w-full md:w-1/2">
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-600">Sort by:</span>
          <button
            onClick={() => handleSort('name')}
            className={`px-3 py-1 rounded ${sortBy === 'name' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}
          >
            Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
          </button>
          <button
            onClick={() => handleSort('created_at')}
            className={`px-3 py-1 rounded ${sortBy === 'created_at' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}
          >
            Date {sortBy === 'created_at' && (sortOrder === 'asc' ? '↑' : '↓')}
          </button>
        </div>
      </div>

      {/* Main content */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      ) : filteredAndSortedProjects.length === 0 ? (
        searchQuery ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900">No matching projects found</h3>
            <p className="mt-2 text-gray-500">Try adjusting your search criteria</p>
          </div>
        ) : (
          <EmptyState onCreateProject={() => setIsModalOpen(true)} />
        )
      ) : (
        <ProjectList 
          projects={filteredAndSortedProjects} 
          onDeleteProject={handleDeleteProject} 
        />
      )}

      {/* Create project modal */}
      <CreateProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreateProject={handleCreateProject}
      />
    </div>
  );
}