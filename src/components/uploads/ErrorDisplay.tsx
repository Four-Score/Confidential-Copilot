interface ErrorDisplayProps {
  /**
   * Error message to display
   */
  error: string;
  
  /**
   * Additional CSS class to apply
   */
  className?: string;
}

export default function ErrorDisplay({
  error,
  className = ''
}: ErrorDisplayProps) {
  if (!error) return null;
  
  return (
    <div className={`mt-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md ${className}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <svg 
            className="h-5 w-5 text-red-500" 
            viewBox="0 0 20 20" 
            fill="currentColor"
            aria-hidden="true"
          >
            <path 
              fillRule="evenodd" 
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" 
              clipRule="evenodd" 
            />
          </svg>
        </div>
        <div className="ml-3">
          <p className="text-sm">
            {error}
          </p>
        </div>
      </div>
    </div>
  );
}