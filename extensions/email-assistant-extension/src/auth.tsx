import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://tczdnhbosuoqmgkpqnaz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRjemRuaGJvc3VvcW1na3BxbmF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM2NzUwMDAsImV4cCI6MjA1OTI1MTAwMH0.RCg2REt0dl56FxPuTE6E2pEpt_uf5i9V8sngHwwt9Bc'
);

const AuthHandler: React.FC = () => {
  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.substring(1));
    const access_token = params.get('access_token');
    const refresh_token = params.get('refresh_token');
  
    if (access_token && refresh_token) {
      chrome.storage.local.set({
        supabaseSession: { access_token, refresh_token },
      }, () => {
        console.log('✅ Tokens saved to chrome.storage');
  
        supabase.auth.setSession({ access_token, refresh_token })
          .then(({ error }) => {
            if (error) {
              console.error('Failed to set session in Supabase client:', error.message);
            } else {
              console.log('✅ Supabase session set successfully');
            }
          })
          .catch(err => console.error('Supabase error:', err));
      });
    } else {
      console.error('❌ Tokens not found in URL hash');
    }
  }, []);
  
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h2>Logged in successfully!</h2>
      <p>You can now close this tab.</p>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<AuthHandler />);
