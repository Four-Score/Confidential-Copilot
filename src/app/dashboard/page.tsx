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

    // Navigate to projects page
    const navigateToProjects = () => {
        router.push('/projects');
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
                    <Button variant="outline" size="sm">
                        🔔
                    </Button>
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
                                <span className="text-xs mt-1">Summarizer</span>
                            </div>

                            {/* Other Icons */}
                            <div className="flex flex-col items-center">
                                <div className="text-xl">📄</div>
                                <span className="text-xs mt-1">Document mode</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <div className="text-xl">💬</div>
                                <span className="text-xs mt-1">Chat mode</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <div className="text-xl">✉️</div>
                                <span className="text-xs mt-1">Email mode</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <div className="text-xl">🧭</div>
                                <span className="text-xs mt-1">Discover</span>
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
                        <div className="bg-white p-4 rounded-md shadow-sm border border-gray-100">
                            <h2 className="font-bold text-sm">PROJECTS</h2>
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

                    {/* Content Sections */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Most Recently Used */}
                        <div className="bg-white p-5 rounded-md shadow-sm border border-gray-100">
                            <h3 className="font-bold text-sm mb-4 border-b pb-2">MOST RECENTLY USED</h3>
                            <ul className="space-y-2">
                                <li className="flex items-center text-sm">
                                    <span className="mr-2">•</span>
                                    Reply to HR department
                                </li>
                                <li className="flex items-center text-sm">
                                    <span className="mr-2">•</span>
                                    A road map for AI project
                                </li>
                                <li className="flex items-center text-sm">
                                    <span className="mr-2">•</span>
                                    Tips for presentation
                                </li>
                                <li className="flex items-center text-sm">
                                    <span className="mr-2">•</span>
                                    Gradle build error fix
                                </li>
                            </ul>
                        </div>

                        {/* Ingest Data */}
                        <div className="bg-white p-5 rounded-md shadow-sm border border-gray-100">
                            <div className="flex justify-between items-center mb-4 border-b pb-2">
                                <h3 className="font-bold text-sm">INGEST DATA</h3>
                                <Button variant="outline" size="sm">
                                    📤
                                </Button>
                            </div>
                            <div className="space-y-3">
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="paste the URL here"
                                        className="w-full border border-gray-300 rounded-md px-4 py-2 text-sm"
                                    />
                                    <div className="absolute right-3 top-2 text-gray-400">📥</div>
                                </div>
                                <div className="relative">
                                    <Button variant="outline" className="w-full justify-between text-gray-500 text-sm">
                                        Inject email Data
                                        <span>📥</span>
                                    </Button>
                                </div>
                                <div className="relative">
                                    <Button variant="outline" className="w-full justify-between text-gray-500 text-sm">
                                        connect google drive
                                        <span>📥</span>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}