'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';

export default function DashboardPage() {
    const router = useRouter();
    const { user } = useAuthStore();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    // Navigate to the meeting summarizer page
    const navigateToMeetingSummarizer = () => {
        router.push('/dashboard/meeting-summarizer');
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
                            className="pl-10 border border-gray-300 rounded-md px-4 py-2 w-64 text-xs text-black"
                        />
                    </div>
                    <Button variant="outline" size="sm">
                        🔔
                    </Button>
                    <Button variant="outline" size="sm" className="flex items-center gap-1">
                        <span className="text-xs text-black">NEW FOLDER</span>
                        📁
                    </Button>
                    <div className="flex items-center gap-2">
                        <div className="text-right">
                            <p className="font-medium text-xs text-black">{user?.email || 'USER'}</p>
                            <p className="text-xs text-black">Software Engineer</p>
                        </div>
                        <div className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center">
                            <span className="text-sm">MK</span>
                        </div>
                    </div>
                    <Button variant="secondary" size="sm" onClick={() => router.push('/log-out')}>
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
                        <span className="text-blue-800">{isSidebarOpen ? '◀' : '▶'}</span>
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
                                <span className="text-xs text-black mt-1">COMPONENTS</span>
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
                                <span className="text-xs text-black mt-1">Summarizer</span>
                            </div>

                            {/* Other Icons */}
                            <div className="flex flex-col items-center">
                                <div className="text-xl">📄</div>
                                <span className="text-xs text-black mt-1">Document mode</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <div className="text-xl">💬</div>
                                <span className="text-xs text-black mt-1">Chat mode</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <div className="text-xl">✉️</div>
                                <span className="text-xs text-black mt-1">Email mode</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <div className="text-xl">🧭</div>
                                <span className="text-xs text-black mt-1">Discover</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <div className="text-xl">📑</div>
                                <span className="text-xs text-black mt-1">Templates</span>
                            </div>
                        </nav>
                    </aside>
                )}

                {/* Main Dashboard */}
                <main className={`flex-1 p-4 ${!isSidebarOpen ? 'ml-10' : ''}`}>
                    {/* Content area is now empty */}
                </main>
            </div>
        </div>
    );
}