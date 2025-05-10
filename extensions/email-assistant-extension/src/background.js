// Background script for the Email Assistant extension
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../src/secret';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
chrome.runtime.onInstalled.addListener(() => {
  console.log('Email Assistant extension installed');
  chrome.storage.local.get(['email_assistant_emails'], (result) => {
    if (!result.email_assistant_emails) {
      chrome.storage.local.set({ email_assistant_emails: [] });
    }
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background script received message:', message);

  if (message.action === 'getAuthToken') {
    chrome.identity.getAuthToken({ interactive: true }, (token) => {
      if (chrome.runtime.lastError) {
        console.error('Error getting auth token:', chrome.runtime.lastError);
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      } else {
        console.log('Got auth token successfully');
        sendResponse({ success: true, token });
      }
    });
    return true;
  }

  if (message.action === 'generateResponse') {
    setTimeout(() => {
      sendResponse({
        success: true,
        response: {
          text: 'Thank you for your email. I have received your request and will respond accordingly.',
          suggestions: [
            'Thank you for sharing this information.',
            'I will review the attached documents and get back to you.',
            'Can you provide more details about the deadline?'
          ]
        }
      });
    }, 1000);
    return true;
  }

  if (message.action === 'fetchEmail') {
    chrome.identity.getAuthToken({ interactive: true }, (token) => {
      if (chrome.runtime.lastError) {
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
        return;
      }

      fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${message.emailId}?format=full`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Accept': 'application/json',
        },
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Gmail API error: ${response.status}`);
          }
          return response.json();
        })
        .then((data) => {
          sendResponse({ success: true, data });
        })
        .catch((error) => {
          console.error('Error fetching email:', error);
          sendResponse({ success: false, error: error.message });
        });
    });
    return true;
  }

  if (message.action === 'fetchAttachment') {
    chrome.identity.getAuthToken({ interactive: true }, (token) => {
      if (chrome.runtime.lastError) {
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
        return;
      }

      fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${message.emailId}/attachments/${message.attachmentId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Gmail API error: ${response.status}`);
          }
          return response.json();
        })
        .then((data) => {
          sendResponse({ success: true, data });
        })
        .catch((error) => {
          console.error('Error fetching attachment:', error);
          sendResponse({ success: false, error: error.message });
        });
    });
    return true;
  }

  if (message.action === 'saveEmail') {
    chrome.storage.local.get(['email_assistant_emails'], (result) => {
      const emails = result.email_assistant_emails || [];
      emails.push({
        email: message.emailData,
        entities: message.entities
      });

      chrome.storage.local.set({ email_assistant_emails: emails }, () => {
        sendResponse({
          success: true,
          count: emails.length
        });
      });
    });
    return true;
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url?.includes('mail.google.com')) {
    chrome.scripting.executeScript({
      target: { tabId },
      files: ['content.js']
    }).catch(err => console.error('Error injecting content script:', err));
  }
});
chrome.storage.local.get(['supabaseSession'], async ({ supabaseSession }) => {
  if (supabaseSession?.access_token && supabaseSession?.refresh_token) {
    await supabase.auth.setSession(supabaseSession);
    const user = await supabase.auth.getUser();
    console.log('Logged in user:', user.data.user);
  }
});

export {};
