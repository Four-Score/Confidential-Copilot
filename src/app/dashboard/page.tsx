'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import { ModesContainer } from '@/components/dashboard/ModesContainer';
import { useModal } from '@/contexts/ModalContext';
import { RemindersDropdown } from '@/components/dashboard/RemindersDropdown';
import { UserDropdown } from '@/components/dashboard/UserDropdown';
import { useUnreadRemindersCount } from '@/hooks/ReminderCount';
import Image from 'next/image';

export default function DashboardPage() {
    const router = useRouter();
    const { user } = useAuthStore();
    const { openModal } = useModal();
    const [showReminders, setShowReminders] = useState(false);
    const [showUserDropdown, setShowUserDropdown] = useState(false);
    const { count, fetchCount } = useUnreadRemindersCount(showReminders);

    // Navigate to the meeting summarizer page
    const navigateToMeetingSummarizer = () => {
        router.push('/dashboard/meeting-summarizer');
    };

    // Navigate to projects page
    const navigateToProjects = () => {
        router.push('/projects');
    };

    // Navigate to YouTube summarizer page
    const navigateToYouTubeSummarizer = () => {
        router.push('/dashboard/youtube-summarizer'); // Assuming this is the route
    };

    // Define modes data for the cards
    const modes = [
        {
            icon: <div className="w-12 h-12 rounded-lg bg-sky-100 flex items-center justify-center"> {/* Updated color */}
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-sky-600">
                        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                        <line x1="10" y1="9" x2="8" y2="9"></line>
                    </svg>
                  </div>,
            title: 'Your Projects', // Updated title
            description: 'Access and manage your data projects', // Updated description
            onClick: navigateToProjects
        },
        {
            icon: <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                  </div>,
            title: 'Chat Mode',
            description: 'Interact with your documents through conversational AI',
            onClick: () => router.push('/dashboard/chat')
        },
        {
            icon: <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-600">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                      <polyline points="22,6 12,13 2,6"></polyline>
                    </svg>
                  </div>,
            title: 'Email Mode',
            description: 'Generate and analyze emails with AI assistance',
            onClick: () => router.push('/dashboard/email-ingestor')
        },
        {
            icon: <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
                      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                      <line x1="12" y1="19" x2="12" y2="23"></line>
                      <line x1="8" y1="23" x2="16" y2="23"></line>
                    </svg>
                  </div>,
            title: 'Meeting Mode',
            description: 'Summarize and extract insights from meeting transcripts',
            onClick: navigateToMeetingSummarizer
        },
        {
            icon: <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="16" y1="13" x2="8" y2="13"></line>
                      <line x1="16" y1="17" x2="8" y2="17"></line>
                      <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                  </div>,
            title: 'Document Mode',
            description: 'Process and interact with your document collection',
            onClick: () => router.push('/dashboard/document')
        },
        {
            icon: <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center"> {/* YouTube icon */}
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-600">
                        <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"></path>
                        <path d="m10 15 5-3-5-3z"></path>
                    </svg>
                  </div>,
            title: 'YouTube Summarizer',
            description: 'Summarize and get insights from YouTube videos',
            onClick: navigateToYouTubeSummarizer
        }
    ];
    return (
        <div className="h-screen flex flex-col overflow-hidden bg-gradient-to-br from-gray-100 to-slate-100"> {/* Fixed height and eliminated scroll */}
            {/* Header */}
            <header className="bg-white/95 backdrop-blur-lg shadow-sm p-4 flex justify-between items-center border-b border-gray-200 sticky top-0 z-30">
                <div className="flex items-center gap-3"> {/* Increased gap */}
                    <div 
                        onClick={() => router.push('/')} 
                        className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center shadow-md cursor-pointer hover:shadow-lg transition-all duration-200"
                    > {/* Style update & made clickable */}
                        <span className="text-xl font-bold text-white">CC</span>
                    </div>
                    <h1 className="text-xl font-semibold text-gray-800">CONFIDENTIAL COPILOT</h1> {/* Style update */}
                </div>
                <div className="flex items-center gap-4">
                    {/* Search bar removed */}
                    <div className="relative">
                        <Button
                            variant="outline"
                            size="sm"
                            className="rounded-full hover:bg-gray-200/70 p-2" // Style update
                            onClick={() => setShowReminders(!showReminders)}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"></path></svg>
                            {count > 0 && (
                                <span className="absolute top-0 right-0 block h-4 w-4 rounded-full bg-red-500 ring-2 ring-white text-xs text-white flex items-center justify-center">
                                    {count}
                                </span>
                            )}
                        </Button>
                        <RemindersDropdown open={showReminders} onClose={() => setShowReminders(false)} />
                    </div>
                      {/* Enhanced user profile section */}
                    <div className="flex items-center gap-3 border-l pl-4 border-gray-200">
                        {user && (
                            <div className="text-right">
                                <p className="text-sm font-medium text-gray-800">{user.email}</p>
                            </div>
                        )}                        <div className="relative cursor-pointer" onClick={() => setShowUserDropdown(!showUserDropdown)}>
                            <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-full flex items-center justify-center text-lg font-semibold shadow-sm hover:shadow-md transition-all duration-200 border-2 border-white">
                                {user?.email?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <UserDropdown open={showUserDropdown} onClose={() => setShowUserDropdown(false)} />
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex flex-1">
                {/* Main Dashboard */}
                <main className="flex-1 p-8 overflow-y-auto"> {/* Added overflow handling */}
                    {/* Welcome Card */}
                    <div className="mb-10"> {/* Increased margin-bottom */}
                        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200/80 hover:shadow-xl transition-all duration-300"> {/* Style update */}
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="text-2xl font-semibold text-gray-800">Welcome to Your Dashboard</h2>
                                    <p className="text-gray-600 mt-1">Access your projects and use different interaction modes to work with your data securely.</p>
                                </div>
                                <div className="p-3 bg-gradient-to-tr from-amber-400 to-orange-500 rounded-full shadow-md">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Interaction Modes Section */}
                    <div className="mb-8">
                        <ModesContainer modes={modes} />
                    </div>
                </main>
            </div>
        </div>
    );
}