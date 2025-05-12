// src/content.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles.css';
import EmailPreview from './ui/EmailPreview';
import { IEmailData, IEmailEntities } from './interfaces/IEmailModels';
import GmailApiService from './services/GmailApiService';
import EntityAnalyzer from './core/EntityAnalyzer';
import { Summarizer } from './utils/summarizer'; // <-- Import summarizer

const createContainer = (): HTMLElement => {
  const existing = document.getElementById('email-assistant-container');
  if (existing) return existing;

  const container = document.createElement('div');
  container.id = 'email-assistant-container';
  document.body.appendChild(container);
  return container;
};

const analyzeCurrentEmail = async (): Promise<void> => {
  try {
    const gmailApiService = GmailApiService.getInstance();
    await gmailApiService.initialize();

    const emailData = await gmailApiService.extractCurrentEmail();
    if (!emailData) {
      console.error('No email data found');
      return;
    }

    // Summarize the email body immediately
    const summary = await Summarizer.summarize(emailData.body || '');

    const entityAnalyzer = EntityAnalyzer.getInstance();
    const entities = entityAnalyzer.analyzeEmail(emailData);

    renderEmailPreview(emailData, entities, summary);
  } catch (error) {
    console.error('Error analyzing email:', error);
  }
};

const renderEmailPreview = (emailData: IEmailData, entities: IEmailEntities, summary: string): void => {
  const container = createContainer();
  const root = ReactDOM.createRoot(container);

  root.render(
    <React.StrictMode>
      <EmailPreview 
        emailData={emailData}
        entities={entities}
        emailSummary={summary} // Pass summary!
        onClose={() => {
          root.unmount();
          container.remove();
        }}
      />
    </React.StrictMode>
  );
};

const addFloatingActionButton = (): void => {
  if (document.getElementById('email-assistant-fab')) return;

  const button = document.createElement('div');
  button.id = 'email-assistant-fab';
  button.className = 'email-assistant-fab';

  const img = document.createElement('img');
  img.src = chrome.runtime.getURL('assets/cc-logo.png'); // Ensure this image exists in your /assets folder
  img.alt = 'CC Logo';
  img.style.width = '100%';
  img.style.height = '100%';
  img.style.objectFit = 'cover';
  img.style.borderRadius = '10%';

  button.appendChild(img);
  button.title = 'Analyze Email with Confidential Copilot';

  button.addEventListener('click', () => {
    if (!document.getElementById('email-assistant-container')) {
      analyzeCurrentEmail();
    }
  });

  document.body.appendChild(button);
};



const setupUrlChangeDetection = (): void => {
  let lastUrl = location.href;
  const observer = new MutationObserver(() => {
    if (lastUrl !== location.href) {
      lastUrl = location.href;
      const isViewingEmail = document.querySelector('[data-legacy-message-id]');
      if (isViewingEmail) {
        addFloatingActionButton();
      } else {
        const fab = document.getElementById('email-assistant-fab');
        if (fab) fab.remove();
      }
    }
  });

  observer.observe(document, { subtree: true, childList: true });
};

const initialize = (): void => {
  console.log('Confidential Copilot: Initializing content script...');
  setupUrlChangeDetection();

  const styleElement = document.createElement('style');
  styleElement.textContent = `
    .email-assistant-fab {
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background-color: #00387b;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
      cursor: pointer;
      z-index: 9999;
      user-select: none;
      transition: all 0.2s ease;
    }
    .email-assistant-fab:hover {
      background-color: #185abc;
      transform: scale(1.05);
    }
  `;
  document.head.appendChild(styleElement);

  console.log('Confidential Copilot: Content script initialized');
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'analyzeCurrentEmail') {
    analyzeCurrentEmail();
    sendResponse({ status: 'OK' });
  }
});

export {};
