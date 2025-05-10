'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore'; // Changed to use the existing auth store

export default function ChatPage() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated());
  const isLoading = useAuthStore((state) => state.isLoading);
  const router = useRouter();
  
  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/log-in'); // Changed to '/log-in' based on the auth directory structure
    }
  }, [isAuthenticated, isLoading, router]);
  
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  
  if (!user) {
    return null; // Will redirect
  }
  
  return (
    <div className="flex flex-col h-screen">
      <main className="flex-grow overflow-hidden">
        {/* Chat components will be added here in future steps */}
        <div className="flex items-center justify-center h-full">
          <p className="text-lg">Chat interface will be implemented in the next steps</p>
        </div>
      </main>
    </div>
  );
}