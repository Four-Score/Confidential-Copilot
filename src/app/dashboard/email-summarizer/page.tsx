// components/ConnectExtensionButton.tsx
'use client';

import { Button } from '@/components/ui/Button';

export function ConnectExtensionButton() {
  const handleConnect = () => {
    const url = 'http://localhost:3000/connect-extension';
    window.open(url, '_blank');
  };

  return (
    <div className="flex flex-col items-start space-y-2">
      <p className="text-sm text-gray-600">Connect your browser extension:</p>
      <Button onClick={handleConnect}>Connect to Extension</Button>
    </div>
  );
}
