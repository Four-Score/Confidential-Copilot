'use client';

import { useEffect } from 'react';

export default function ExtensionLoginCallback() {
  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const access_token = hashParams.get('access_token');
    const refresh_token = hashParams.get('refresh_token');

    if (access_token && refresh_token) {
      const extensionUrl = `chrome-extension://kfllijpookcgihkcclkjeobcdcejcmlb/auth.html#access_token=${access_token}&refresh_token=${refresh_token}`;
      window.location.href = extensionUrl;
    } else {
      console.error('❌ Missing access_token or refresh_token in hash');
    }
  }, []);

  return (
    <div className="p-6 text-center">
      <h2 className="text-lg font-semibold">Logging in...</h2>
      <p className="text-sm text-gray-500">Redirecting to your extension...</p>
    </div>
  );
}
