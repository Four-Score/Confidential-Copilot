import React, { useEffect, useState, useRef } from 'react';
import { IEmailData, IEmailEntities, IEmailAttachment } from '../interfaces/IEmailModels';
import '../styles.css';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../../src/secret';
import LoginPopup from '../components/common/LoginPopup';
import ProjectNamePopup from '../components/common/ProjectNamePopup';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

interface EmailPreviewProps {
  emailData: IEmailData;
  entities: IEmailEntities;
  emailSummary: string;
  onClose: () => void;
  onGenerateResponse: () => void; // NEW PROP
}

const EmailPreview: React.FC<EmailPreviewProps> = ({
  emailData,
  entities,
  emailSummary,
  onClose,
  onGenerateResponse
}) => {
  const [attachments, setAttachments] = useState<IEmailAttachment[]>(emailData.attachments || []);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [showProjectPopup, setShowProjectPopup] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    wrapperRef.current?.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    chrome.storage.local.get(['supabaseSession'], result => {
      const session = result.supabaseSession;
      setIsAuthenticated(!!session?.access_token && !!session?.refresh_token);
    });
  }, []);

  const handleGenerateResponse = () => {
    if (!isAuthenticated) {
      setShowLoginPopup(true);
    } else {
      onGenerateResponse(); // TRIGGER PARENT MODAL
    }
  };

  const handleSaveToDashboard = () => {
    if (!isAuthenticated) {
      setShowLoginPopup(true);
    } else {
      setShowProjectPopup(true);
    }
  };

  const handleProjectSubmit = async (projectName: string): Promise<boolean> => {
    try {
      const session = await new Promise<any>((resolve) =>
        chrome.storage.local.get(['supabaseSession'], result => resolve(result.supabaseSession))
      );

      await supabase.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      });

      const { data, error } = await supabase
        .from('projects')
        .select('id')
        .eq('name', projectName.trim())
        .single();

      if (error || !data?.id) {
        console.error('❌ Project not found:', error);
        return false;
      }

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
        projectId: data.id,
      };

      return new Promise((resolve) => {
        chrome.storage.local.get(['email_queue'], (result) => {
          const queue = result.email_queue || [];
          queue.push(payload);
          chrome.storage.local.set({ email_queue: queue }, () => {
            resolve(true);
          });
        });
      });
    } catch (err) {
      console.error('❌ Error saving project:', err);
      return false;
    }
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments(prev => prev.filter(att => att.id !== id));
  };

  const formatSize = (bytes: number) => {
    if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${bytes} B`;
  };

  return (
    <div className="email-preview-wrapper" ref={wrapperRef}>
      <div className="email-preview-header">
        <h2 className="header-title">Confidential Copilot</h2>
        <button onClick={onClose}>✖️</button>
      </div>

      <div className="email-scroll-area">
        <div className="email-metadata">
          <p className="email-subject">{emailData.subject}</p>
          <p className="metadata-row"><span className="metadata-label">From:</span> {emailData.sender}</p>
          <p className="metadata-row"><span className="metadata-label">Date:</span> {new Date(emailData.timestamp).toLocaleString()}</p>
        </div>

        <div className="tab-content">
          <h4>Email Summary:</h4>
          <ul className="summary-list">
            {emailSummary
              .split('\n')
              .map((line, idx) => {
                const cleanLine = line.trim();
                if (!cleanLine) return null;

                const maxLength = 80;
                const formattedLine = cleanLine.replace(/https?:\/\/[^\s]+/g, (url) => {
                  const shortened = url.length > maxLength ? url.slice(0, maxLength) + '…' : url;
                  return `<a href="${url}" target="_blank" rel="noopener noreferrer">${shortened}</a>`;
                });

                return (
                  <li
                    key={idx}
                    className="summary-item"
                    dangerouslySetInnerHTML={{ __html: formattedLine }}
                  />
                );
              })}
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
      </div>

      <div className="modal-actions">
        <button className="respond-button" onClick={handleGenerateResponse}>Generate Response</button>
        <button className="save-button" onClick={handleSaveToDashboard}>Save to Dashboard</button>
      </div>

      {showLoginPopup && (
        <LoginPopup onClose={() => setShowLoginPopup(false)} />
      )}

      {showProjectPopup && (
        <ProjectNamePopup
          onClose={() => setShowProjectPopup(false)}
          onSubmit={handleProjectSubmit}
        />
      )}
    </div>
  );
};

export default EmailPreview;
