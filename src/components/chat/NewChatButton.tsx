'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useChatContext } from '@/contexts/ChatContext';
import NewChatModal from './NewChatModal';

interface NewChatButtonProps {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Button component for starting a new chat session
 * Opens a modal with options to create a new chat
 */
export default function NewChatButton({ 
  variant = 'primary', 
  size = 'md',
  className = '' 
}: NewChatButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { startNewChat } = useChatContext();

  const handleNewChatClick = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleQuickNewChat = () => {
    // Start a new chat but keep the current document selection
    startNewChat(true);
    setIsModalOpen(false);
  };

  return (
    <>
      <Button 
        variant={variant} 
        size={size}
        onClick={handleNewChatClick}
        className={`flex items-center ${className}`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="w-5 h-5 mr-2"
        >
          <path
            fillRule="evenodd"
            d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
            clipRule="evenodd"
          />
        </svg>
        New Chat
      </Button>

      {/* Use the existing NewChatModal component */}
      {isModalOpen && (
        <NewChatModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}
    </>
  );
}