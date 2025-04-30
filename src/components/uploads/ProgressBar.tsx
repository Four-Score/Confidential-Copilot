interface ProgressBarProps {
  /**
   * Progress percentage (0-100)
   */
  progress: number;
  
  /**
   * Background color class for the progress bar
   */
  color?: string;
  
  /**
   * Show percentage text
   */
  showPercentage?: boolean;
  
  /**
   * Height class for the progress bar
   */
  height?: string;
}

export default function ProgressBar({
  progress,
  color = 'bg-blue-600',
  showPercentage = true,
  height = 'h-2'
}: ProgressBarProps) {
  // Ensure progress is within 0-100 range
  const normalizedProgress = Math.min(100, Math.max(0, progress));
  
  return (
    <div className="w-full">
      <div className={`w-full bg-gray-200 rounded-full ${height}`}>
        <div 
          className={`${color} ${height} rounded-full transition-all duration-300 ease-out`}
          style={{ width: `${normalizedProgress}%` }}
          role="progressbar"
          aria-valuenow={normalizedProgress}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      
      {showPercentage && (
        <div className="flex justify-end mt-1">
          <span className="text-xs text-gray-500">
            {Math.round(normalizedProgress)}%
          </span>
        </div>
      )}
    </div>
  );
}