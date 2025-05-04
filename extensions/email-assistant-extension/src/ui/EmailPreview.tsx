import React, { useState } from 'react';
import { IEmailData, IEmailEntities } from '../interfaces/IEmailModels';
import ResponseEditor from './ResponseEditor'; // Modal for customization
import '../styles.css';
import { uploadEmailSummariesToCopilotApp } from '../services/EmailModeUploader'

interface EmailPreviewProps {
  emailData: IEmailData;
  entities: IEmailEntities;
  emailSummary: string; // <-- Already here
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
  
    try {
      await uploadEmailSummariesToCopilotApp([emailSummary], projectName);
      alert(`Saved to project "${projectName}"`);
    } catch (error) {
      console.error('Failed to upload:', error);
      alert('Upload failed.');
    }
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
          </button> {/* <-- NEW Save Button */}
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
