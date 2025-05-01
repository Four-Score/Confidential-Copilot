interface EmptyStateProps {
  onCreateProject: () => void;
}

export default function EmptyState({ onCreateProject }: EmptyStateProps) {
  return (
    <div className="text-center py-14 bg-gray-50 rounded-lg flex flex-col items-center">
      <svg
        className="h-16 w-16 text-gray-400 mb-4"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1}
          d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
        />
      </svg>
      <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
      <p className="text-gray-500 max-w-md mb-6">
        Start by creating your first project to organize your documents and data.
      </p>
      <button
        onClick={onCreateProject}
        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition duration-200"
      >
        Create Your First Project
      </button>
    </div>
  );
}