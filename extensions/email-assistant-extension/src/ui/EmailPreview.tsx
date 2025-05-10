
import React, { useState } from 'react';
import { IEmailData, IEmailEntities, IEmailAttachment } from '../interfaces/IEmailModels';
import ResponseEditor from './ResponseEditor';
import '../styles.css';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../../src/secret';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

interface EmailPreviewProps {
  emailData: IEmailData;
  entities: IEmailEntities;
  emailSummary: string;
  onClose: () => void;
}

const EmailPreview: React.FC<EmailPreviewProps> = ({ emailData, entities, emailSummary, onClose }) => {
  const [showResponseEditor, setShowResponseEditor] = useState(false);
  const [attachments, setAttachments] = useState<IEmailAttachment[]>([...emailData.attachments]);

  const handleGenerateResponse = () => {
    setShowResponseEditor(true);
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments(prev => prev.filter(att => att.id !== id));
  };

  const handleSaveToDashboard = async () => {
    const projectName = prompt('Enter project name:');
    if (!projectName) return alert('No project name provided.');

    const session = await new Promise<any>((resolve) =>
      chrome.storage.local.get(['supabaseSession'], result => resolve(result.supabaseSession))
    );

    if (!session?.access_token || !session?.refresh_token) {
      return alert('❌ Not authenticated. Please log in again.');
    }

    await supabase.auth.setSession({
      access_token: session.access_token,
      refresh_token: session.refresh_token
    });

    const { data, error } = await supabase
      .from('projects')
      .select('id')
      .eq('name', projectName.trim())
      .single();

    if (error || !data?.id) return alert('❌ Could not find project.');

    const payload = {
      id: crypto.randomUUID(),
      subject: emailData.subject,
      sender: emailData.sender,
      body: emailData.body,
      timestamp: emailData.timestamp,
      summary: emailSummary,
      entities,
      attachments,
      projectName,
      projectId: data.id
    };

    chrome.storage.local.get(['email_queue'], (result) => {
      const queue = result.email_queue || [];
      queue.push(payload);
      chrome.storage.local.set({ email_queue: queue }, () => {
        alert(`✅ Email saved under "${projectName}"`);
      });
    });
  };

  const formatSize = (bytes: number) => {
    if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${bytes} B`;
  };

  return (
    <div className="email-preview-wrapper">
      <div className="email-preview-header">
        <h2 className="header-title">Confidential Copilot</h2>
        <button onClick={onClose}>✖️</button>
      </div>

      <div className="email-metadata">
        <p className="email-subject">{emailData.subject}</p>
        <p className="metadata-row"><span className="metadata-label">From:</span> {emailData.sender}</p>
        <p className="metadata-row"><span className="metadata-label">Date:</span> {new Date(emailData.timestamp).toLocaleString()}</p>
      </div>

      <div className="tab-content">
        <h4>Email Summary:</h4>
        <ul className="summary-list">
          {emailSummary.split('\n').filter(Boolean).map((line, idx) => (
            <li key={idx} className="summary-item">• {line.trim()}</li>
          ))}
        </ul>

        <h4 style={{ marginTop: '1rem' }}>Key Points:</h4>
        <ul className="summary-list">
          {entities.keyPoints.length > 0 ? (
            entities.keyPoints.map((point, idx) => (
              <li key={idx} className="summary-item">✔ {point}</li>
            ))
          ) : (
            <li className="summary-item">No key points detected.</li>
          )}
        </ul>

        {attachments.length > 0 && (
          <div className="email-attachments">
            <h4>Attachments:</h4>
            {attachments.map(att => (
              <div key={att.id} className="attachment-card">
                <span>📎 {att.name} ({formatSize(att.size)})</span>
                <button className="remove-button" onClick={() => handleRemoveAttachment(att.id)}>Remove</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="modal-actions">
        <button className="respond-button" onClick={handleGenerateResponse}>Generate Response</button>
        <button className="save-button" onClick={handleSaveToDashboard}>Save to Dashboard</button>
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
