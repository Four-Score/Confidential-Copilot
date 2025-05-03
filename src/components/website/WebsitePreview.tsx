'use client';

import { useState, useEffect } from 'react';

interface WebsitePreviewProps {
  /**
   * The URL to preview
   */
  url: string;
  
  /**
   * Additional CSS class to apply
   */
  className?: string;
}

export default function WebsitePreview({
  url,
  className = ''
}: WebsitePreviewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [favicon, setFavicon] = useState<string | null>(null);
  const [title, setTitle] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchWebsiteInfo() {
      if (!url) return;

      setIsLoading(true);
      setError(null);

      try {
        // Extract the domain for the favicon
        const urlObj = new URL(url);
        const domain = urlObj.hostname;
        
        // Try to get the favicon using Google's favicon service
        // This is a fallback method since we can't directly access the website's HTML in this component
        const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
        setFavicon(faviconUrl);
        
        // We'll use the domain name as a fallback title
        // In a real implementation, we'd parse the HTML to get the actual title
        setTitle(domain);
        
      } catch (err) {
        console.error('Error fetching website info:', err);
        setError('Failed to load website preview');
      } finally {
        setIsLoading(false);
      }
    }

    fetchWebsiteInfo();
  }, [url]);

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center p-4 bg-gray-100 rounded-lg ${className}`}>
        <div className="flex flex-col items-center">
          <div className="animate-spin h-8 w-8 border-2 border-blue-500 rounded-full border-t-transparent mb-2"></div>
          <p className="text-sm text-gray-600">Loading website preview...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-4 bg-red-50 rounded-lg ${className}`}>
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className={`p-4 border border-gray-200 rounded-lg bg-white ${className}`}>
      <div className="flex items-center space-x-3">
        {favicon && (
          <img 
            src={favicon} 
            alt={`${title || 'Website'} favicon`} 
            className="w-8 h-8 rounded"
            onError={(e) => {
              // If favicon fails to load, replace with a generic icon
              (e.target as HTMLImageElement).src = '/globe.svg';
            }}
          />
        )}
        <div>
          <h3 className="font-medium text-gray-900">
            {title || 'Website'}
          </h3>
          <p className="text-sm text-gray-600 truncate max-w-md">
            {url}
          </p>
        </div>
      </div>
      
      <div className="mt-3 pt-3 border-t border-gray-100">
        <p className="text-xs text-gray-500">
          This website content will be processed and stored in your project. No data will be encrypted since it's publicly available content.
        </p>
      </div>
    </div>
  );
}