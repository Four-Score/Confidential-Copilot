'use client';

import { useState, useEffect } from 'react';

interface PDFPreviewProps {
  /**
   * The File object to preview
   */
  file: File;
  
  /**
   * Height for the preview container
   */
  height?: string;
  
  /**
   * Additional CSS class to apply
   */
  className?: string;
}

export default function PDFPreview({
  file,
  height = 'h-64',
  className = ''
}: PDFPreviewProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  useEffect(() => {
    // Create a blob URL for the file
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    
    // Clean up the URL when the component unmounts
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [file]);
  
  if (!previewUrl) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded-md ${height} ${className}`}>
        <div className="animate-pulse text-gray-400">Loading preview...</div>
      </div>
    );
  }
  
  return (
    <div className={`overflow-hidden rounded-md border border-gray-200 ${height} ${className}`}>
      <object
        data={previewUrl}
        type="application/pdf"
        className="w-full h-full"
      >
        <div className="flex items-center justify-center h-full bg-gray-100">
          <p className="text-gray-500">
            PDF preview not available. 
            <a 
              href={previewUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-blue-600 hover:underline ml-1"
            >
              Open in new tab
            </a>
          </p>
        </div>
      </object>
    </div>
  );
}