'use client';

import React, { useState, useEffect } from 'react';
import { keyManagementService } from '@/services/keyManagement';
import { useDataSelection } from '@/contexts/DataSelectionContext';

// Define type for document source
type DocumentSource = 'encrypted' | 'unencrypted';

interface DocumentData {
  id: string;
  name: string;
  type: string;
  upload_date?: string;
  file_size?: number;
  page_count?: number;
  encryptedName?: boolean;
  url?: string; // Add URL field for website documents
}

interface SelectableDocumentCardProps {
  document: DocumentData;
  source: DocumentSource;
  onSelect?: (id: string, selected: boolean) => void;
}

export const SelectableDocumentCard: React.FC<SelectableDocumentCardProps> = ({
  document,
  source,
  onSelect
}) => {
  const { isDocumentSelected, toggleDocument } = useDataSelection();
  const [displayName, setDisplayName] = useState<string>(document.name);
  const [isSelected, setIsSelected] = useState<boolean>(isDocumentSelected(document.id));
  const [favicon, setFavicon] = useState<string | null>(null);
  const [faviconError, setFaviconError] = useState<boolean>(false);

  // Format date for display
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Unknown date';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format file size for display
  const formatFileSize = (bytes: number | undefined) => {
    if (bytes === undefined) return 'Unknown size';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };
  
  // Extract domain from URL
  const getDomain = (url: string | undefined): string => {
    if (!url) return '';
    try {
      const domain = new URL(url).hostname;
      return domain;
    } catch (e) {
      return url;
    }
  };
  
  // Get document icon based on type
  const getDocumentIcon = () => {
    if (document.type === 'pdf') return '📄';
    if (document.type === 'website') {
      // If we have a favicon, return null since we'll use the img tag
      if (favicon && !faviconError) return null;
      return '🌐';
    }
    return '📄';
  };

  // Effect to load favicon for website type documents
  useEffect(() => {
    if (document.type === 'website' && document.url) {
      const domain = getDomain(document.url);
      if (!domain) return;
      
      // Use Google's favicon service as a reliable source
      const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
      setFavicon(faviconUrl);
    }
  }, [document.type, document.url]);

  // Handle document selection
  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.checked;
    setIsSelected(selected);
    
    // Update context
    toggleDocument({
      id: document.id,
      name: displayName,
      type: source
    });
    
    // Call optional callback if provided
    if (onSelect) {
      onSelect(document.id, selected);
    }
  };

  // Effect to decrypt name if needed
  useEffect(() => {
    const decryptDocumentName = async () => {
      if (source === 'encrypted' && document.encryptedName) {
        try {
          // Use decryptMetadata instead of decryptText for document names
          // Document names are encrypted using encryptMetadata, not encryptText
          const decryptedName = await keyManagementService.decryptMetadata(document.name);
          setDisplayName(decryptedName || 'Untitled Document');
        } catch (error) {
          console.error('Failed to decrypt document name:', error);
          setDisplayName('Encrypted Document');
        }
      }
    };

    decryptDocumentName();
  }, [document.name, document.encryptedName, source]);

  // Effect to sync selection state with context
  useEffect(() => {
    // Keep local selection state in sync with context
    const selected = isDocumentSelected(document.id);
    if (selected !== isSelected) {
      setIsSelected(selected);
    }
  }, [document.id, isDocumentSelected, isSelected]);

  return (
    <div 
      className={`
        relative bg-white p-4 rounded-lg shadow-sm border-2 transition duration-200
        ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}
      `}
    >
      {/* Checkbox in the top right */}
      <div className="absolute top-3 right-3">
        <label className="inline-flex items-center">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={handleSelect}
            className="form-checkbox h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
          />
        </label>
      </div>

      <div className="flex items-start space-x-3 pr-8">
        {/* Document icon */}
        <div className="text-2xl">
          {getDocumentIcon() || (
            favicon && !faviconError && (
              <img
                src={favicon}
                alt="Favicon"
                className="h-8 w-8"
                onError={() => setFaviconError(true)}
              />
            )
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          {/* Document title */}
          <h3 className="text-lg font-medium text-gray-900 truncate">{displayName}</h3>
          
          {/* Document metadata */}
          <div className="mt-1 flex flex-wrap text-sm text-gray-500">
            <div className="mr-4">Type: {document.type.toUpperCase()}</div>
            
            {document.upload_date && (
              <div className="mr-4">Added: {formatDate(document.upload_date)}</div>
            )}
            
            {document.file_size !== undefined && (
              <div className="mr-4">Size: {formatFileSize(document.file_size)}</div>
            )}
            
            {document.page_count !== undefined && document.page_count > 0 && (
              <div>Pages: {document.page_count}</div>
            )}
            
            {/* Source indicator */}
            <div className="mt-1 w-full">
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                source === 'encrypted' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
              }`}>
                {source === 'encrypted' ? 'Encrypted' : 'Unencrypted'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};