import { useState, useEffect } from 'react';
import { UnencryptedDocument } from '@/types/document';

interface WebsiteCardProps {
  website: UnencryptedDocument;
  onDelete: (websiteId: string) => Promise<{ success: boolean; error?: string }>;
}

export default function WebsiteCard({ website, onDelete }: WebsiteCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [faviconUrl, setFaviconUrl] = useState<string | null>(null);

  const formattedDate = new Date(website.upload_date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const formattedSize = formatFileSize(website.file_size);
  const metadata = website.metadata || {};
  
  // First try to get URL from top level (API provides this), then from metadata
  // Using type assertion since the property might come from API but is not in TypeScript type
  const websiteUrl = (website as any).url || (website.metadata && website.metadata.url) || '';
  
  // First try to get title from top level (API provides this), then from metadata
  const websiteTitle = (website as any).title || (metadata as any).title || '';

  console.log(`WebsiteCard rendering for ${websiteTitle}:`, {
    id: website.id,
    websiteUrl,
    topLevelFavicon: (website as any).favicon,
    metadataFavicon: (metadata as any).favicon,
    metadata
  });

  useEffect(() => {
    // Get favicon URL from metadata or generate fallback
    const getFavicon = (): string => {
      // First check if favicon exists at top level (from API GET response)
      if ((website as any).favicon) {
        console.log(`Using top-level favicon for ${websiteTitle}`);
        return (website as any).favicon;
      }
      
      // Then check if favicon exists in metadata (from direct upload response)
      if ((metadata as any).favicon) {
        console.log(`Using metadata favicon for ${websiteTitle}`);
        return (metadata as any).favicon;
      }
      
      // If we have a URL (either from top level or metadata), generate a favicon
      if (websiteUrl) {
        const domain = getDomain(websiteUrl);
        console.log(`Generating favicon from URL for ${websiteTitle}: ${domain}`);
        return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
      }
      
      console.log(`Using default favicon for ${websiteTitle}`);
      return '/globe.svg'; // Fallback icon
    };

    setFaviconUrl(getFavicon());
  }, [website.id, websiteUrl, websiteTitle]);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent navigation
    
    if (isDeleting) return;
    
    setIsDeleting(true);
    setDeleteError(null);
    
    try {
      const result = await onDelete(website.id);
      if (!result.success) {
        setDeleteError(result.error || 'Failed to delete website');
        setShowDeleteConfirm(false);
      }
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete website');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(true);
  };

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  // Get domain from URL for display
  const getDomain = (url: string): string => {
    try {
      const urlObj = new URL(url || '');
      return urlObj.hostname;
    } catch {
      return 'Unknown website';
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
      <div className="p-5">
        <div className="flex justify-between items-start">
          <div className="flex items-center">
            <div className="h-12 w-12 flex items-center justify-center">
              <img 
                src={faviconUrl || '/globe.svg'} 
                alt={websiteTitle || 'Website icon'} 
                className="max-h-10 max-w-10"
                onError={(e) => {
                  console.log(`Favicon load error for ${websiteTitle}. Falling back to default.`);
                  // Fallback to default icon if the favicon fails to load
                  (e.target as HTMLImageElement).src = '/globe.svg';
                }}
              />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900 mb-1 truncate max-w-xs">
                {websiteTitle || getDomain(websiteUrl)}
              </h3>
              <p className="text-sm text-gray-500">Added on {formattedDate}</p>
            </div>
          </div>
          
          <div className="relative">
            <button 
              onClick={handleDeleteClick} 
              className="text-gray-400 hover:text-gray-600 p-1"
              aria-label="Delete website"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </button>
            
            {/* Delete confirmation popup */}
            {showDeleteConfirm && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                <div className="p-3">
                  <p className="text-sm text-gray-700 mb-2">Delete this website?</p>
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
            <span className="font-medium capitalize">{website.type}</span>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <span className="text-xs text-gray-500 block">Size</span>
            <span className="font-medium">{formattedSize}</span>
          </div>
          <div className="bg-gray-50 p-3 rounded col-span-2">
            <span className="text-xs text-gray-500 block">URL</span>
            <a 
              href={websiteUrl || '#'} 
              target="_blank" 
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="font-medium text-blue-600 hover:text-blue-800 truncate block"
            >
              {websiteUrl || 'Unknown URL'}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}