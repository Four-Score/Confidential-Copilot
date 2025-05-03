'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';

export default function EmailSummarizerPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user) router.push('/log-in');
  }, [user]);

  const handleConnectExtension = () => {
    const extensionLoginUrl = 'http://localhost:3000/connect-extension';
    window.open(extensionLoginUrl, '_blank');  
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Email Summarizer</h1>
      <p className="mb-4 text-gray-600">Connect your browser extension to start sending email summaries.</p>
      <Button onClick={handleConnectExtension}>
        Connect to Extension
      </Button>
    </div>
  );
}
