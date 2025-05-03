'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  

export default function ConnectExtensionPage() {
  const [email, setEmail] = useState('');
  const [linkSent, setLinkSent] = useState(false);
  const [error, setError] = useState('');

  const sendMagicLink = async () => {
    setError('');
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: 'http://localhost:3000/extension-login-callback',
        shouldCreateUser: true,
      },
    });

    if (error) {
      setError(error.message);
    } else {
      setLinkSent(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary-navy to-blue-900 p-6">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md space-y-6">
        <h1 className="text-xl font-bold text-center">Connect Your Extension</h1>
        <p className="text-sm text-center text-gray-600">
          Enter your email to receive a magic link for logging in from the extension.
        </p>
        <input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border px-4 py-2 rounded-md border-gray-300"
        />
        <Button className="w-full" onClick={sendMagicLink}>
          Send Magic Link
        </Button>

        {linkSent && <p className="text-green-600 text-sm">Check your email for the magic link.</p>}
        {error && <p className="text-red-600 text-sm">{error}</p>}
      </div>
    </div>
  );
}
