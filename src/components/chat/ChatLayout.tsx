'use client';

import React, { useState } from 'react';
import { useChatContext } from '@/contexts/ChatContext';
import DocumentSidebar from './DocumentSidebar';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import ModelSelection from './ModelSelection';
import NewChatModal from './NewChatModal';
import NewChatButton from './NewChatButton';

interface ChatLayoutProps {
  children: React.ReactNode;
}

export default function ChatLayout({ children }: ChatLayoutProps) {
  const { chatState, startNewChat } = useChatContext();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const router = useRouter();

  // Get project names from the selected project IDs
  const projectCount = chatState.selectedProjectIds.length;

  
  // Handle new chat button click
  const handleNewChat = () => {
    // For now, just start a new chat keeping current documents
    // Later we'll implement a modal asking if the user wants to keep the same documents
    startNewChat(true);
  };

  
  // Handle model selection dialog
  const [isModelSelectOpen, setIsModelSelectOpen] = useState(false);
  
  return (
    <div className="flex h-screen max-h-screen bg-gray-50">
      {/* Sidebar */}
      <div 
        className={`${
          isSidebarOpen ? 'w-80' : 'w-0'
        } transition-all duration-300 ease-in-out bg-white border-r overflow-hidden`}
      >
        {isSidebarOpen && <DocumentSidebar />}
      </div>
      
      {/* Main content */}
      <div className="flex flex-col flex-grow overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b px-6 py-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center">
            {/* Sidebar toggle */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="mr-4 p-2 rounded-full hover:bg-gray-100"
              aria-label={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-gray-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isSidebarOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
            
            {/* Project info */}
            <div>
              <h1 className="text-lg font-medium">
                {projectCount > 0 ? (
                  `Chat with ${projectCount} ${projectCount === 1 ? 'Project' : 'Projects'}`
                ) : (
                  'New Chat'
                )}
              </h1>
              <p className="text-sm text-gray-500">
                {chatState.selectedDocumentIds.length} documents selected
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
              {/* Model selection */}
              <ModelSelection />
              
              {/* New chat button */}
              <NewChatButton 
                size="sm" 
                className="shadow-sm"
              />
            </div>
        </header>
        
        {/* Model selection dropdown (conditionally rendered) */}
        {isModelSelectOpen && (
          <div className="absolute right-6 top-16 w-64 bg-white border rounded-md shadow-lg p-2 z-10">
            {/* This will be replaced with a proper ModelSelection component later */}
            <div className="py-2 px-3 hover:bg-gray-100 rounded cursor-pointer">
              <p>Model Selection Coming Soon</p>
            </div>
          </div>
        )}
        
        {/* Main chat area */}
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}