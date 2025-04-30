interface EmptyStateProps {
  onCreateProject: () => void;
}

export default function EmptyState({ onCreateProject }: EmptyStateProps) {
  return (
    <div className="text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
      <svg 
        className="mx-auto h-16 w-16 text-gray-400"
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth="1.5" 
          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" 
        />
      </svg>
      
      <h3 className="mt-4 text-xl font-medium text-gray-900">No projects yet</h3>
      
      <p className="mt-2 text-gray-600 max-w-md mx-auto">
        Get started by creating your first project. Projects help you organize your documents and make them searchable with encryption.
      </p>
      
      <div className="mt-6">
        <button
          onClick={onCreateProject}
          className="inline-flex items-center px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition duration-200"
        >
          <svg 
            className="-ml-1 mr-2 h-5 w-5" 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Create New Project
        </button>
      </div>
      
      <p className="mt-8 text-sm text-gray-500">
        Your projects are securely encrypted and only accessible by you.
      </p>
    </div>
  );
}