import { useState } from 'react';

interface YoutubeCardProps {
  document: any; // Use 'any' to avoid TS errors with metadata
  onDelete: (documentId: string) => void;
}

export default function YoutubeCard({ document, onDelete }: YoutubeCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const formattedDate = new Date(document.upload_date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const formattedSize = formatFileSize(document.file_size || 0);

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  const youtubeIcon = "/youtube.svg";
  const videoTitle = document.name || document.metadata?.title || 'YouTube Video';
  const videoUrl = document.metadata?.url || '';

  const handleDelete = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsDeleting(true);
    try {
      await onDelete(document.id);
      setShowDeleteConfirm(false);
    } catch (error) {
      setDeleteError('Failed to delete the video. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
      <div className="p-5">
        <div className="flex justify-between items-start">
          <div className="flex items-center">
            <div className="h-12 w-12 flex items-center justify-center">
              <img
                src={youtubeIcon}
                alt="YouTube"
                className="max-h-10 max-w-10"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/globe.svg';
                }}
              />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900 mb-1 truncate max-w-xs">
                {videoTitle}
              </h3>
              <p className="text-sm text-gray-500">Uploaded on {formattedDate}</p>
            </div>
          </div>
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDeleteConfirm(true);
              }}
              className="text-gray-400 hover:text-gray-600 p-1"
              aria-label="Delete video"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </button>
            {showDeleteConfirm && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                <div className="p-3">
                  <p className="text-sm text-gray-700 mb-2">Delete this video?</p>
                  <div className="flex justify-between">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDeleteConfirm(false);
                      }}
                      className="px-3 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className={`px-3 py-1 text-sm text-white bg-red-600 hover:bg-red-700 rounded ${isDeleting ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {isDeleting ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                  {deleteError && (
                    <p className="mt-2 text-xs text-red-600">{deleteError}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-4">
          <div className="bg-gray-50 p-3 rounded">
            <span className="text-xs text-gray-500 block">Type</span>
            <span className="font-medium capitalize">YouTube</span>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <span className="text-xs text-gray-500 block">Size</span>
            <span className="font-medium">{formattedSize}</span>
          </div>
          <div className="bg-gray-50 p-3 rounded col-span-2">
            <span className="text-xs text-gray-500 block">URL</span>
            <a
              href={videoUrl || '#'}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="font-medium text-blue-600 hover:text-blue-800 truncate block"
            >
              {videoUrl || 'Unknown URL'}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}