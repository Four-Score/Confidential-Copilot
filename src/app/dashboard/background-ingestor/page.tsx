// src/app/dashboard/background-ingestor/page.tsx
'use client';

import dynamic from 'next/dynamic';

const EmailIngestor = dynamic(() => import('../email-ingestor/page'), {
  ssr: false,
});

export default function BackgroundIngestor() {
  return (
    <div style={{ display: 'none' }}>
      <EmailIngestor />
    </div>
  );
}
