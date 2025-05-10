import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { createClient } from '@supabase/supabase-js';

import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../src/secret';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
