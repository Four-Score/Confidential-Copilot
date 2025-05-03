import { useState } from 'react';
import { Document, UnencryptedDocument, isUnencryptedDocument } from '@/types/document';
import DocumentCard from './DocumentCard';
import WebsiteCard from '../websites/WebsiteCard';

interface DocumentListProps {
  documents: (Document | UnencryptedDocument)[];
  onDelete: (documentId: string) => Promise<{ success: boolean; error?: string }>;
  onWebsiteDelete?: (websiteId: string) => Promise<{ success: boolean; error?: string }>;
}

export default function DocumentList({ 
  documents, 
  onDelete,
  onWebsiteDelete
}: DocumentListProps) {
  const [sortBy, setSortBy] = useState<'name' | 'upload_date'>('upload_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string | null>(null);

  // Function to get document name safely (considering both Document and UnencryptedDocument)
  const getDocumentName = (doc: Document | UnencryptedDocument): string => {
    return doc.name || '';
  };
  
  // Function to get document type
  const getDocumentType = (doc: Document | UnencryptedDocument): string => {
    return doc.type || '';
  };

  // Handler for website deletion - ensures we don't use document deletion handler
  const handleWebsiteDelete = async (websiteId: string) => {
    if (onWebsiteDelete) {
      return onWebsiteDelete(websiteId);
    } else {
      console.error("Website deletion handler not provided");
      return { 
        success: false, 
        error: "Website deletion handler not properly configured" 
      };
    }
  };

  // Filter and sort documents
  const filteredAndSortedDocuments = documents
    .filter(doc => {
      // Apply type filter if selected
      if (typeFilter && getDocumentType(doc) !== typeFilter) {
        return false;
      }
      
      // Apply search filter
      return getDocumentName(doc).toLowerCase().includes(searchQuery.toLowerCase());
    })
    .sort((a, b) => {
      if (sortBy === 'name') {
        return sortOrder === 'asc' 
          ? getDocumentName(a).localeCompare(getDocumentName(b)) 
          : getDocumentName(b).localeCompare(getDocumentName(a));
      } else {
        return sortOrder === 'asc' 
          ? new Date(a.upload_date).getTime() - new Date(b.upload_date).getTime() 
          : new Date(b.upload_date).getTime() - new Date(a.upload_date).getTime();
      }
    });

  // Get unique document types for filtering
  const documentTypes = Array.from(new Set(documents.map(doc => doc.type)));

  // Toggle sort order
  const handleSort = (field: 'name' | 'upload_date') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Handle type filter
  const handleTypeFilter = (type: string | null) => {
    setTypeFilter(type);
  };

  return (
    <div>
      <div className="mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="w-full md:w-1/2">
          <input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-gray-600">Type:</span>
          <div className="flex gap-1">
            <button
              onClick={() => handleTypeFilter(null)}
              className={`px-3 py-1 rounded ${!typeFilter ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}
            >
              All
            </button>
            {documentTypes.map((type) => (
              <button
                key={type}
                onClick={() => handleTypeFilter(type)}
                className={`px-3 py-1 rounded ${typeFilter === type ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="text-gray-600">Sort by:</span>
        <button
          onClick={() => handleSort('name')}
          className={`px-3 py-1 rounded ${sortBy === 'name' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}
        >
          Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
        </button>
        <button
          onClick={() => handleSort('upload_date')}
          className={`px-3 py-1 rounded ${sortBy === 'upload_date' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}
        >
          Date {sortBy === 'upload_date' && (sortOrder === 'asc' ? '↑' : '↓')}
        </button>
      </div>

      {filteredAndSortedDocuments.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900">No matching documents found</h3>
          <p className="mt-2 text-gray-500">Try adjusting your search criteria or filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedDocuments.map(document => (
            isUnencryptedDocument(document) ? (
              <WebsiteCard 
                key={document.id} 
                website={document} 
                onDelete={handleWebsiteDelete} 
              />
            ) : (
              <DocumentCard 
                key={document.id} 
                document={document as Document} 
                onDelete={onDelete} 
              />
            )
          ))}
        </div>
      )}
    </div>
  );
}