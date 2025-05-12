'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { ModalTransition } from '@/components/ui/ModalTransition';
import { useModal } from '@/contexts/ModalContext';
import { useDataSelection } from '@/contexts/DataSelectionContext';
import { SelectableProjectCard } from './SelectableProjectCard';
import { Project } from '@/types/project';
import { Button } from '@/components/ui/Button';
import { MODAL_ROUTES } from '@/constants/modalRoutes';
import { useAuthStore } from '@/store/authStore';
import { authFetch, authFetchJson } from '@/lib/authFetch';
import { createClient } from '@/lib/supabase/client';

export const ProjectSelectionModal: React.FC = () => {
  // Context hooks
  const { isModalOpen, closeModal, openModal, modalProps } = useModal();
  const { selectProject } = useDataSelection();
  const isAuthenticated = useAuthStore(state => state.isAuthenticated());
  
  // Local state
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [hasFetchedProjects, setHasFetchedProjects] = useState(false);
  const [authInitialized, setAuthInitialized] = useState(false);

  useEffect(() => {
  // Check if auth is initialized
  const checkAuth = async () => {
    const supabase = createClient();
    try {
      const { data } = await supabase.auth.getSession();
      setAuthInitialized(!!data.session);
    } catch (err) {
      console.error("Error checking auth session:", err);
    }
  };
  
  if (isAuthenticated) {
    checkAuth();
  }
}, [isAuthenticated]);
  // Only fetch projects when modal is open AND user is authenticated
  const shouldFetchProjects = 
    isModalOpen && 
    modalProps.currentView === MODAL_ROUTES.PROJECT_SELECTION && 
    isAuthenticated && 
    !hasFetchedProjects;

  // Fetch projects when modal is opened and user is authenticated
  useEffect(() => {
    async function fetchProjects() {
      if (!shouldFetchProjects) return;
      
      setIsLoading(true);
      setError(null);
      setHasFetchedProjects(true);
      
      try {
        const data = await authFetchJson<Project[]>('/api/projects', {}, {
        maxRetries: 5,
        maxDelay: 500,
        onRetry: (attempt, delay) => {
          console.log(`Retrying projects fetch (attempt ${attempt}) in ${delay}ms...`);
        }
      });
      } catch (err) {
        console.error('Error fetching projects:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchProjects();
  }, [shouldFetchProjects, isAuthenticated, isModalOpen, modalProps.currentView]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isModalOpen || modalProps.currentView !== MODAL_ROUTES.PROJECT_SELECTION) {
      setHasFetchedProjects(false);
      setSelectedProjectId(null);
    }
  }, [isModalOpen, modalProps.currentView]);

  // Filter projects when search query changes
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredProjects(projects);
    } else {
      const filtered = projects.filter(project => 
        project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (project.description || '').toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredProjects(filtered);
    }
  }, [searchQuery, projects]);

  // Handle project selection
  const handleProjectSelect = (project: Project) => {
    setSelectedProjectId(project.id);
  };

  // Handle continue button click
  const handleContinue = () => {
    const selectedProject = projects.find(p => p.id === selectedProjectId);
    if (selectedProject) {
      // Store selected project in context
      selectProject(selectedProject.id, selectedProject.name);
      
      // Navigate to data selection modal
      openModal(MODAL_ROUTES.DATA_SELECTION, { 
        currentView: MODAL_ROUTES.DATA_SELECTION,
        projectId: selectedProject.id, 
        projectName: selectedProject.name 
      });
    }
  };

  return (
    <Modal
      isOpen={isModalOpen && modalProps.currentView === MODAL_ROUTES.PROJECT_SELECTION}
      onClose={closeModal}
      title="Select a Project"
      width="lg"
    >
      <ModalTransition 
        show={isModalOpen && modalProps.currentView === MODAL_ROUTES.PROJECT_SELECTION} 
        type={MODAL_ROUTES.PROJECT_SELECTION}
      >
        <div className="p-6 w-full">
          {/* Search input */}
          <div className="mb-6">
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {/* Loading state */}
          {isLoading && (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          )}
          
          {/* Error state */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6" role="alert">
              <p><strong>Error:</strong> {error}</p>
            </div>
          )}
          
          {/* No projects state */}
          {!isLoading && !error && filteredProjects.length === 0 && (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              {searchQuery ? (
                <>
                  <h3 className="text-lg font-medium text-gray-900">No matching projects found</h3>
                  <p className="mt-2 text-gray-500">Try adjusting your search criteria</p>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-medium text-gray-900">No projects found</h3>
                  <p className="mt-2 text-gray-500">Create a project first to proceed</p>
                </>
              )}
            </div>
          )}
          
          {/* Projects grid */}
          {!isLoading && filteredProjects.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {filteredProjects.map(project => (
                <SelectableProjectCard
                  key={project.id}
                  project={project}
                  isSelected={project.id === selectedProjectId}
                  onClick={handleProjectSelect}
                />
              ))}
            </div>
          )}
          
          {/* Continue button */}
          <div className="flex justify-end mt-6">
            <Button 
              disabled={!selectedProjectId} 
              onClick={handleContinue}
              className={`px-6 py-2 rounded ${!selectedProjectId ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Continue
            </Button>
          </div>
        </div>
      </ModalTransition>
    </Modal>
  );
};