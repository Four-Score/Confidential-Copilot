'use client';

import { Button } from '@/components/ui/Button';

export default function ConnectExtensionButton() {
  const handleConnect = () => {
    const url = 'https://confidential-copilot.onrender.com/connect-extension';
    window.open(url, '_blank');
  };

  return (
    <div className="flex flex-col items-start space-y-2">
      <Button onClick={handleConnect}>Connect to Extension</Button>
    </div>
  );
}
