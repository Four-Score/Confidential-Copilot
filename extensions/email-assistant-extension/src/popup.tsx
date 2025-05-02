import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import './styles.css';

const PopupApp: React.FC = () => {
  const [status, setStatus] = useState<string>('Initializing...');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [savedEmails, setSavedEmails] = useState<number>(0);
  const [authStatus, setAuthStatus] = useState<string | null>(null);

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const currentTab = tabs[0];
      if (currentTab.url?.includes('mail.google.com')) {
        setStatus('Connected to Gmail');
        setIsConnected(true);

        chrome.storage.local.get(['email_assistant_emails'], (result) => {
          const emails = result.email_assistant_emails || [];
          setSavedEmails(emails.length);
        });
      } else {
        setStatus('Please open Gmail to use this extension');
        setIsConnected(false);
      }
    });
  }, []);

  const handleAnalyzeEmail = () => {
    if (!isConnected) return;
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id!, { action: 'analyzeCurrentEmail' });
    });
  };

  const handleOpenDashboard = () => {
    chrome.runtime.openOptionsPage();
  };

  const handleTestAuth = () => {
    chrome.runtime.sendMessage({ action: 'getAuthToken' }, (res) => {
      if (res?.success) {
        setAuthStatus(`✅ Token received`);
        console.log("Token:", res.token);
      } else {
        setAuthStatus(`❌ Auth failed: ${res?.error?.message || res?.error || 'Unknown error'}`);
        console.error("Token error:", res?.error);
      }
    });
  };

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
