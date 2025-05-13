import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import './styles.css';

const PopupApp: React.FC = () => {
  const [status, setStatus] = useState('Initializing...');
  const [isConnected, setIsConnected] = useState(false);
  const [savedEmails, setSavedEmails] = useState(0);
  const [authStatus, setAuthStatus] = useState<string | null>(null);


  const handleAnalyzeEmail = () => {
    if (!isConnected) return;
  
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (tab && tab.id !== undefined) {
        chrome.tabs.sendMessage(tab.id, { action: 'analyzeCurrentEmail' });
      } else {
        console.warn('No active tab or tab ID found');
      }
    });
  };
  
  const handleOpenDashboard = () => {
    chrome.runtime.openOptionsPage();
  };

  const handleTestAuth = async () => {
    chrome.storage.local.get('supabaseSession', async ({ supabaseSession }) => {
      if (!supabaseSession) {
        setAuthStatus('❌ No session found in storage');
        return;
      }
  
      console.log('🔑 Using token from storage:', supabaseSession.access_token); // <--- Confirm this
  
      try {
        const res = await fetch('https://confidential-copilot.onrender.com/api/email-mode/receive', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseSession.access_token}`, // ✅ Use correct token
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            projectName: 'My Project',
            emailData: {
              subject: 'From extension',
              body: 'Test email payload',
            },
          }),
        });
  
        const data = await res.json();
        if (!res.ok) {
          setAuthStatus(`❌ Server rejected: ${res.status} ${data?.error}`);
        } else {
          setAuthStatus(`✅ Success: ${JSON.stringify(data)}`);
        }
      } catch (err) {
        console.error(err);
        setAuthStatus('❌ Network or server error');
      }
    });
  };
  chrome.storage.local.get('supabaseSession', ({ supabaseSession }) => {
    if (!supabaseSession) {
      console.warn('No session found');
      return;
    }
  
    console.log('📦 Supabase session:', supabaseSession);
  });
  
  return (
    <div className="p-4 bg-white">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-800">Email Assistant</h1>
        <div className={`h-3 w-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
      </div>

      <div className="mb-4 text-sm text-gray-600">
        {status}
      </div>

      {savedEmails > 0 && (
        <div className="mb-4 text-sm bg-blue-50 p-2 rounded">
          {savedEmails} email{savedEmails !== 1 ? 's' : ''} saved locally
        </div>
      )}

      <div className="space-y-3">
        <button 
          onClick={handleAnalyzeEmail}
          disabled={!isConnected}
          className={`w-full py-2 px-4 rounded-md ${
            isConnected 
              ? 'bg-blue-600 hover:bg-blue-700 text-white' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Analyze Current Email
        </button>

        <button 
          onClick={handleOpenDashboard}
          className="w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md"
        >
          View Saved Emails
        </button>

        <button 
          onClick={handleTestAuth}
          className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-md"
        >
          🔐 Test Auth
        </button>
      </div>

      {authStatus && (
        <div className="mt-3 text-sm text-center text-gray-700">
          {authStatus}
        </div>
      )}

      <div className="mt-4 text-xs text-gray-500 text-center">
        v0.1.0 - All data is processed securely
      </div>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <PopupApp />
  </React.StrictMode>
);
