'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import { ModesContainer } from '@/components/dashboard/ModesContainer';
import { useModal } from '@/contexts/ModalContext';
import { MODAL_ROUTES } from '@/constants/modalRoutes';
import { RemindersDropdown } from '@/components/dashboard/RemindersDropdown';
import { useUnreadRemindersCount } from '@/hooks/ReminderCount';

export default function DashboardPage() {
    const router = useRouter();
    const { user } = useAuthStore();
    const { openModal } = useModal();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [showReminders, setShowReminders] = useState(false);
    const { count, fetchCount } = useUnreadRemindersCount(showReminders);

    // Navigate to the meeting summarizer page
    const navigateToMeetingSummarizer = () => {
        router.push('/dashboard/meeting-summarizer');
    };

    // Navigate to projects page
    const navigateToProjects = () => {
        router.push('/projects');
    };

    // Define modes data for the cards
    const modes = [
        {
            icon: '💬',
            title: 'Chat Mode',

            description: 'Interact with your documents through conversational AI',
            onClick: () => router.push('/dashboard/chat')  // Add this line
        },
        {
            icon: '✉️',
            title: 'Email Mode',
            description: 'Generate and analyze emails with AI assistance',
            onClick: () => router.push('/dashboard/email-ingestor') // no .tsx in routes
        },
        {
            icon: '🗣️',
            title: 'Meeting Mode',

            description: 'Summarize and extract insights from meeting transcripts',
            onClick: navigateToMeetingSummarizer

        },
        {
            icon: '📄',
            title: 'Document Mode',
            description: 'Process and interact with your document collection',
            onClick: () => router.push('/dashboard/document') // route 

        }
    ];

    // Retrieval button click handler - will be implemented later
    const handleRetrievalClick = () => {
        openModal(MODAL_ROUTES.PROJECT_SELECTION, { currentView: MODAL_ROUTES.PROJECT_SELECTION });
    };

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm p-3 flex justify-between items-center border-b border-gray-200">
                <div className="flex items-center">
                    <h1 className="text-xl font-bold text-purple-700 ml-2">CONFIDENTIAL COPILOT</h1>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <div className="absolute left-3 top-2.5 h-4 w-4 text-gray-400">🔍</div>
                        <input
                            type="text"
                            placeholder="SEARCH"
                            className="pl-10 border border-gray-300 rounded-md px-4 py-2 w-64"
                        />
                    </div>
                    <div className="relative">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowReminders((prev) => !prev)}
                        >
                            🔔
                            {count > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1.5">
                                    {count}
                                </span>
                            )}
                        </Button>
                        <RemindersDropdown open={showReminders} onClose={() => setShowReminders(false)} />
                    </div>
                    <Button variant="outline" size="sm" className="flex items-center gap-1">
                        <span className="text-xs">NEW FOLDER</span>
                        📁
                    </Button>
                    <div className="flex items-center gap-2">
                        <div className="text-right">
                            <p className="font-medium">{user?.email || 'MAHA KHAN'}</p>
                            <p className="text-xs text-gray-500">Software Engineer</p>
                        </div>
                        <div className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center">
                            <span className="text-sm">MK</span>
                        </div>
                    </div>
                    <Button 
                        variant="secondary" 
                        size="sm" 
                        onClick={async () => {
                            await useAuthStore.getState().logout();
                            router.push('/');  // Redirect to homepage after logout
                        }}
                    >
                        LOG OUT
                    </Button>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex flex-1">
                {/* Sidebar Toggle Button - Outside of sidebar */}
                <div className="relative">
                    <button 
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
                        className="absolute top-4 left-4 z-10 p-2 bg-white border border-gray-200 rounded-md"
                    >
                        {isSidebarOpen ? '◀' : '▶'}
                    </button>
                </div>
                
                {/* Sidebar - Completely hideable */}
                {isSidebarOpen && (
                    <aside className="w-48 bg-white border-r border-gray-200 transition-all duration-300 flex flex-col pt-16">
                        {/* Sidebar Content */}
                        <nav className="space-y-6 px-2">
                            {/* First Icon */}
                            <div className="flex flex-col items-center">
                                <div className="text-xl">🏠</div>
                                <span className="text-xs mt-1">COMPONENTS</span>
                            </div>

                            {/* Projects Icon */}
                            <div className="flex flex-col items-center">
                                <div
                                    onClick={navigateToProjects}
                                    className="text-xl cursor-pointer hover:text-blue-600 transition-colors"
                                    title="My Projects"
                                >
                                    📁
                                </div>
                                <span className="text-xs mt-1">Projects</span>
                            </div>

                            {/* Meeting Summarizer Icon - Second Position */}
                            <div className="flex flex-col items-center">
                                <div
                                    onClick={navigateToMeetingSummarizer}
                                    className="text-xl cursor-pointer hover:text-blue-600 transition-colors"
                                    title="Transcript Summarizer"
                                >
                                    📝
                                </div>
                                <span className="text-xs mt-1">Transcript Summarizer</span>
                            </div>

                            {/* Other Icons */}
                            <div className="flex flex-col items-center">
                            <div
                            onClick={() => router.push('/dashboard/document')}
                            className="text-xl cursor-pointer hover:text-blue-600 transition-colors"
                            title="Document Mode">📄</div>
                                <span className="text-xs mt-1">Document mode</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <div className="text-xl">💬</div>
                                <span className="text-xs mt-1">Chat mode</span>
                            </div>
                            <div className="flex flex-col items-center">
                            <div
                            onClick={() => router.push('/dashboard/email-summarizer')}
                            className="text-xl cursor-pointer hover:text-blue-600 transition-colors"
                            title="Email Mode">✉️</div>
                            <span className="text-xs mt-1">Email mode</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <div 
                                onClick={() => router.push('/dashboard/youtube-transcript')}
                                className="text-xl cursor-pointer hover:text-blue-600 transition-colors"
                                title="YouTube Transcript">
                                    🎥
                                </div>

                                <span className="text-xs mt-1">Youtube</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <div className="text-xl">📑</div>
                                <span className="text-xs mt-1">Templates</span>
                            </div>
                        </nav>
                    </aside>
                )}

                {/* Main Dashboard */}
                <main className={`flex-1 p-4 ${!isSidebarOpen ? 'ml-10' : ''}`}>
                    {/* Top Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <div 
                            onClick={navigateToProjects}
                            className="bg-white p-4 rounded-md shadow-sm border border-gray-100 hover:shadow-md cursor-pointer transition-all duration-200"
                        >
                            <h2 className="font-bold text-sm text-blue-700">PROJECTS</h2>
                            <p className="text-xs text-gray-500">Since last month</p>
                        </div>
                        <div className="bg-white p-4 rounded-md shadow-sm border border-gray-100">
                            <h2 className="font-bold text-sm">RESEARCH PAPER</h2>
                            <p className="text-xs text-gray-500">MALWARE DETECTION</p>
                        </div>
                        <div className="bg-white p-4 rounded-md shadow-sm border border-gray-100">
                            <h2 className="font-bold text-sm">AGREEMENT</h2>
                            <p className="text-xs text-gray-500">COMPANY</p>
                        </div>
                        <div className="bg-white p-4 rounded-md shadow-sm border border-gray-100">
                            <h2 className="font-bold text-sm">RESUME</h2>
                            <p className="text-xs text-gray-500">MAHA KHAN</p>
                        </div>
                    </div>

                    {/* Replace Content Sections with ModesContainer */}
                    <div className="mb-8">
                        <ModesContainer modes={modes} />
                    </div>
                    
                    {/* Retrieval Button - Small and unobtrusive in the corner */}
                    <div className="flex justify-end mt-4">
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-xs bg-gray-50 border-gray-300 text-gray-600 hover:bg-gray-100"
                            onClick={handleRetrievalClick}
                        >
                            Retrieval
                        </Button>
                    </div>
                </main>
            </div>
        </div>
    );
}