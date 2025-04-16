'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';

export default function DashboardPage() {
    const router = useRouter();
    const { user, isAuthenticated } = useAuthStore();

    // Navigate to the meeting summarizer page
    const navigateToMeetingSummarizer = () => {
        router.push('/dashboard/meeting-summarizer');
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
            <p className="text-gray-600 mb-8">
                Welcome to your secure AI workspace{user ? `, ${user.email}` : ''}!
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Meeting Summarizer Card */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <div className="mb-4">
                        <svg 
                            className="w-12 h-12 text-blue-600" 
                            xmlns="http://www.w3.org/2000/svg" 
                            fill="none" 
                            viewBox="0 0 24 24" 
                            stroke="currentColor"
                        >
                            <path 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                strokeWidth={2} 
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
                            />
                        </svg>
                    </div>
                    <h2 className="text-xl font-semibold mb-2">Meeting Summarizer</h2>
                    <p className="text-gray-600 mb-4">
                        Upload meeting transcripts to generate summaries and extract action items using AI.
                    </p>
                    <Button 
                        onClick={navigateToMeetingSummarizer}
                        className="w-full"
                    >
                        Summarize Meeting
                    </Button>
                </div>

                {/* Placeholder for future features */}
                <div className="bg-white p-6 rounded-lg shadow-md opacity-50">
                    <div className="mb-4">
                        <svg 
                            className="w-12 h-12 text-gray-400" 
                            xmlns="http://www.w3.org/2000/svg" 
                            fill="none" 
                            viewBox="0 0 24 24" 
                            stroke="currentColor"
                        >
                            <path 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                strokeWidth={2} 
                                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" 
                            />
                        </svg>
                    </div>
                    <h2 className="text-xl font-semibold mb-2">Coming Soon</h2>
                    <p className="text-gray-600 mb-4">
                        More secure AI features will be available soon.
                    </p>
                    <Button 
                        disabled={true}
                        className="w-full"
                    >
                        Coming Soon
                    </Button>
                </div>
            </div>
        </div>
    );
}