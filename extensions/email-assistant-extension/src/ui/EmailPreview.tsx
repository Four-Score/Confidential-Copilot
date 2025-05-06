import React, { useState } from 'react';
import { IEmailData, IEmailEntities } from '../interfaces/IEmailModels';
import ResponseEditor from './ResponseEditor';
import '../styles.css';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://tczdnhbosuoqmgkpqnaz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRjemRuaGJvc3VvcW1na3BxbmF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM2NzUwMDAsImV4cCI6MjA1OTI1MTAwMH0.RCg2REt0dl56FxPuTE6E2pEpt_uf5i9V8sngHwwt9Bc'
);

interface EmailPreviewProps {
  emailData: IEmailData;
  entities: IEmailEntities;
  emailSummary: string;
  onClose: () => void;
}

const EmailPreview: React.FC<EmailPreviewProps> = ({ emailData, entities, emailSummary, onClose }) => {
  const [showResponseEditor, setShowResponseEditor] = useState(false);

  const handleGenerateResponse = () => {
    setShowResponseEditor(true);
  };

  const handleSaveToDashboard = async () => {
    if (!emailSummary) {
      console.warn('No summary available to save.');
      return;
    }
  
    const projectName = prompt('Enter the project name to save this email under:');
    if (!projectName) {
      alert('No project name provided.');
      return;
    }
  
    // 1. Get Supabase session from Chrome storage (wrapped in a Promise)
    const supabaseSession = await new Promise<any>((resolve) => {
      chrome.storage.local.get(['supabaseSession'], (result) => {
        resolve(result.supabaseSession);
      });
    });
  
    if (!supabaseSession?.access_token || !supabaseSession?.refresh_token) {
      alert('❌ Not authenticated. Please log in again.');
      return;
    }
  
    // 2. Set the session
    await supabase.auth.setSession({
      access_token: supabaseSession.access_token,
      refresh_token: supabaseSession.refresh_token,
    });
  
    // 3. Fetch project ID
    const { data, error } = await supabase
      .from('projects')
      .select('id')
      .eq('name', projectName.trim())
      .single();
  
    if (error || !data?.id) {
      alert('❌ Could not find a project with that name.');
      return;
    }
  
    const projectId = data.id;
  
    // 4. Add to queue
    const emailPayload = {
      id: crypto.randomUUID(),
      subject: emailData.subject,
      sender: emailData.sender,
      body: emailData.body,
      timestamp: emailData.timestamp,
      summary: emailSummary,
      entities,
      projectName,
      projectId
    };
  
    chrome.storage.local.get(['email_queue'], (result) => {
      const queue = result.email_queue || [];
      queue.push(emailPayload);
  
      chrome.storage.local.set({ email_queue: queue }, () => {
        alert(`✅ Email queued under project "${projectName}". It will be processed when you open the app.`);
      });
    });
  };
  
  return (
    <div className="email-preview-wrapper">
      <div className="email-preview-header">
        <h2>Confidential Copilot</h2>
        <button onClick={onClose}>Close ✖️</button>
      </div>

      <div className="email-preview-body">
        <h3>{emailData.subject}</h3>
        <p><strong>From:</strong> {emailData.sender}</p>
        <p><strong>Date:</strong> {new Date(emailData.timestamp).toLocaleString()}</p>

        <h4>Email Summary:</h4>
        <p>{emailSummary}</p>

        <h4>Key Points:</h4>
        <ul>
          {entities.keyPoints.map((point, idx) => (
            <li key={idx}>{point}</li>
          ))}
        </ul>

        <div className="actions">
          <button onClick={handleGenerateResponse} className="main-button">
            Generate Response
          </button>

          <button onClick={handleSaveToDashboard} className="secondary-button" style={{ marginTop: '10px' }}>
            Save to Dashboard
          </button>
        </div>
      </div>

      {showResponseEditor && (
        <ResponseEditor
          emailSummary={emailSummary}
          onClose={() => setShowResponseEditor(false)}
        />
      )}
    </div>
  );
};

export default EmailPreview;
