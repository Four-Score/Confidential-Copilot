'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { MeetingSummarizerStyles } from '@/features/meeting-summarizer/components/MeetingSummarizerStyles';

export default function MeetingSummarizerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  // Check authentication and redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/log-in');
    }
  }, [isAuthenticated, router]);
  
  return (
    <div className="meeting-summarizer">
      <MeetingSummarizerStyles />
      {children}
    </div>
  );
}