import React, { useState } from 'react';
import { LLMService } from '../services/LLMService';
import '../styles.css';

interface ResponseEditorProps {
  emailSummary: string;
  onClose: () => void;
}

const ResponseEditor: React.FC<ResponseEditorProps> = ({ emailSummary, onClose }) => {
  const [tone, setTone] = useState('Formal');
  const [length, setLength] = useState('Standard');
  const [formality, setFormality] = useState('Formal');
  const [format, setFormat] = useState('Paragraph');
  const [includeAttachments, setIncludeAttachments] = useState(false);
  const [additionalContext, setAdditionalContext] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const llmService = LLMService.getInstance();
      const generated = await llmService.generateResponse(emailSummary, {
        tone,
        length,
        formality,
        format,
        includeAttachmentReferences: includeAttachments,
        additionalContext,
      });
      setResponse(generated);
    } catch (error) {
      console.error('Error generating response:', error);
      setResponse('Failed to generate response.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          Customize and Generate Response
        </div>

        <div className="modal-body-scroll">
          <div className="options-group">
            <label>Tone:</label>
            <select value={tone} onChange={(e) => setTone(e.target.value)}>
              <option>Formal</option>
              <option>Friendly</option>
              <option>Direct</option>
              <option>Neutral</option>
            </select>

            <label>Length:</label>
            <select value={length} onChange={(e) => setLength(e.target.value)}>
              <option>Brief</option>
              <option>Standard</option>
              <option>Detailed</option>
            </select>

            <label>Formality:</label>
            <select value={formality} onChange={(e) => setFormality(e.target.value)}>
              <option>Formal</option>
              <option>Semi-formal</option>
              <option>Informal</option>
            </select>

            <label>Format:</label>
            <select value={format} onChange={(e) => setFormat(e.target.value)}>
              <option>Paragraph</option>
              <option>Bullet-points</option>
              <option>Executive-summary</option>
            </select>

            <div className="checkbox-row">
              <input
                type="checkbox"
                checked={includeAttachments}
                onChange={(e) => setIncludeAttachments(e.target.checked)}
              />
              <label>Mention attachments in response</label>
            </div>

            <label>Additional Instructions:</label>
            <textarea
              value={additionalContext}
              onChange={(e) => setAdditionalContext(e.target.value)}
              placeholder="Optional extra details..."
            />
          </div>

          {response && (
            <div className="response-box">
              <h4>Generated Response:</h4>
              <div className="response-text">
                {response.split('\n').map((line, idx) => (
                  <p key={idx}>{line}</p>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="modal-actions">
          <button onClick={handleGenerate} className="main-button" disabled={loading}>
            {loading ? 'Generating...' : 'Generate'}
          </button>
          <button onClick={onClose} className="secondary-button">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResponseEditor;
