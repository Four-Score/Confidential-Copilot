'use client';

import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useModal } from '@/contexts/ModalContext';
import { useChatInitialization } from '@/hooks/useChatInitialization';
import { useRetrievalFlow } from '@/hooks/useRetrievalFlow';

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NewChatModal({ isOpen, onClose }: NewChatModalProps) {
  const { startRetrievalForChat } = useRetrievalFlow();
  const { initializeChat, hasSelectedDocuments } = useChatInitialization();

  // Handler for continuing with current document selection
  const handleContinueWithCurrent = () => {
    initializeChat(false); // false = start new chat (don't keep existing chat)
    onClose();
  };

  // Handler for selecting new documents
  const handleSelectNewDocuments = () => {
    startRetrievalForChat();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Start New Chat"
      width="md"
    >
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-2">Select Documents for Chat</h2>
          <p className="text-sm text-gray-600">
            Choose which documents you'd like to use for your new chat session.
          </p>
        </div>

        <div className="space-y-4">
          {/* Continue with current selection */}
          <div 
            className={`
              p-4 border rounded-lg flex items-start space-x-3 cursor-pointer transition-colors
              ${hasSelectedDocuments() ? 'hover:bg-blue-50 border-gray-300' : 'bg-gray-100 border-gray-200 opacity-60 cursor-not-allowed'}
            `}
            onClick={hasSelectedDocuments() ? handleContinueWithCurrent : undefined}
          >
            <div className="flex-shrink-0">
              <div className={`p-2 rounded-full ${hasSelectedDocuments() ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-500'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 017 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H5.414l2.293 2.293a1 1 0 11-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">Continue with current selection</h3>
              <p className="text-sm text-gray-600">
                {hasSelectedDocuments() 
                  ? `Use your current selection of documents (${
                      typeof hasSelectedDocuments() === 'number' 
                        ? hasSelectedDocuments() 
                        : 'multiple'
                    } documents)`
                  : 'No documents currently selected'}
              </p>
            </div>
          </div>

          {/* Select new documents */}
          <div 
            className="p-4 border border-gray-300 rounded-lg flex items-start space-x-3 cursor-pointer hover:bg-blue-50 transition-colors"
            onClick={handleSelectNewDocuments}
          >
            <div className="flex-shrink-0">
              <div className="bg-green-100 text-green-600 p-2 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">Select new documents</h3>
              <p className="text-sm text-gray-600">
                Choose new documents from your projects to chat with
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button variant="outline" onClick={onClose} className="mr-2">
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
}