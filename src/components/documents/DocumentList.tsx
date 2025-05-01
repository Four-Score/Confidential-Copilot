import { useState } from 'react';
import { Document } from '@/types/document';
import DocumentCard from './DocumentCard';

interface DocumentListProps {
  documents: Document[];
  onDelete: (documentId: string) => Promise<{ success: boolean; error?: string }>;
}

export default function DocumentList({ documents, onDelete }: DocumentListProps) {
  const [sortBy, setSortBy] = useState<'name' | 'upload_date'>('upload_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter and sort documents
  const filteredAndSortedDocuments = documents
    .filter(doc => 
      doc.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'name') {
        return sortOrder === 'asc' 
          ? a.name.localeCompare(b.name) 
          : b.name.localeCompare(a.name);
      } else {
        return sortOrder === 'asc' 
          ? new Date(a.upload_date).getTime() - new Date(b.upload_date).getTime() 
          : new Date(b.upload_date).getTime() - new Date(a.upload_date).getTime();
      }
    });

  // Toggle sort order
  const handleSort = (field: 'name' | 'upload_date') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
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
        <div className="flex items-center gap-2">
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
      </div>

      {filteredAndSortedDocuments.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900">No matching documents found</h3>
          <p className="mt-2 text-gray-500">Try adjusting your search criteria</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedDocuments.map(document => (
            <DocumentCard 
              key={document.id} 
              document={document} 
              onDelete={onDelete} 
            />
          ))}
        </div>
      )}
    </div>
  );
}