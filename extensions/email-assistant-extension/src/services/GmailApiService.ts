// src/services/GmailApiService.ts

import { IEmailService } from '../interfaces/IEmailService';
import { IEmailData, IEmailAttachment } from '../interfaces/IEmailModels';
import { Summarizer } from '../utils/summarizer';
import { LLMService, GenerateOptions } from './LLMService';

export class GmailApiService implements IEmailService {
  private static instance: GmailApiService;
  private accessToken: string | null = null;

  private constructor() {}

  public static getInstance(): GmailApiService {
    if (!GmailApiService.instance) {
      GmailApiService.instance = new GmailApiService();
    }
    return GmailApiService.instance;
  }

  public async initialize(): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      chrome.runtime.sendMessage({ action: 'getAuthToken' }, (response) => {
        if (response?.success) {
          this.accessToken = response.token;
          resolve(true);
        } else {
          console.error('[GmailApiService] Auth token error:', response?.error);
          resolve(false);
        }
      });
    });
  }

  public async extractCurrentEmail(): Promise<IEmailData | null> {
    const emailId = this.getEmailIdFromDOM();
    if (!emailId) {
      console.error('[GmailApiService] Could not extract email ID from DOM.');
      return null;
    }

    const email = await this.fetchEmail(emailId);
    return email;
  }

  public async summarizeAndGenerateResponse(
    emailId: string,
    options: GenerateOptions
  ): Promise<string | null> {
    const email = await this.fetchEmail(emailId);
    if (!email || !email.body) {
      console.error('[GmailApiService] Email body missing for summarization.');
      return null;
    }

    // Always summarize the email
    const summary = await Summarizer.summarize(email.body);
    console.log('[GmailApiService] Generated Summary:', summary);

    const llmService = LLMService.getInstance();
    return await llmService.generateResponse(summary, options);
  }

  private getEmailIdFromDOM(): string | null {
    try {
      const threads = document.querySelectorAll('[data-legacy-message-id]');
      const ids = Array.from(threads)
        .map(node => node.getAttribute('data-legacy-message-id'))
        .filter(Boolean) as string[];

      return ids.length > 0 ? ids[ids.length - 1] : null;
    } catch (err) {
      console.error('[GmailApiService] Failed to extract email ID:', err);
      return null;
    }
  }

  private async fetchEmail(emailId: string): Promise<IEmailData | null> {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: 'fetchEmail', emailId }, (response) => {
        if (response?.success && response.data) {
          resolve(this.processGmailMessage(response.data));
        } else {
          console.error('[GmailApiService] Error fetching email:', response?.error);
          resolve(null);
        }
      });
    });
  }

  private processGmailMessage(message: any): IEmailData {
    const headers = message.payload.headers;
    const subject = headers.find((h: any) => h.name === 'Subject')?.value || 'No Subject';
    const from = headers.find((h: any) => h.name === 'From')?.value || 'Unknown';
    const date = headers.find((h: any) => h.name === 'Date')?.value || new Date().toISOString();

    let body = '';
    if (message.payload.body?.data) {
  body = this.decodeBase64(message.payload.body.data);
} else if (message.payload.parts) {
  const part = message.payload.parts.find(
    (p: any) => p.mimeType === 'text/plain' || p.mimeType === 'text/html'
  );
  if (part?.body?.data) {
    body = this.decodeBase64(part.body.data);
  }
}


    const attachments: IEmailAttachment[] = [];
    this.extractAttachments(message.payload, attachments, message.id);

    return {
      id: message.id,
      sender: from,
      subject,
      body,
      timestamp: date,
      attachments
    };
  }

  private decodeBase64(data: string): string {
    const base64 = data.replace(/-/g, '+').replace(/_/g, '/');
    try {
      return decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
    } catch (error) {
      console.error('[GmailApiService] Base64 decode error:', error);
      return '';
    }
  }

  private extractAttachments(part: any, attachments: IEmailAttachment[], emailId: string): void {
    if (part.filename && part.body) {
      const attachmentId = part.body.attachmentId;
      attachments.push({
        id: attachmentId || `att_${Date.now()}_${attachments.length}`,
        name: part.filename,
        size: parseInt(part.body.size) || 0,
        mimeType: part.mimeType || 'application/octet-stream',
        url: attachmentId
          ? `https://gmail.googleapis.com/gmail/v1/users/me/messages/${emailId}/attachments/${attachmentId}`
          : undefined
      });
    }

    if (Array.isArray(part.parts)) {
      part.parts.forEach((sub: any) => this.extractAttachments(sub, attachments, emailId));
}
  }

  public async getAttachments(emailId: string): Promise<IEmailAttachment[]> {
    const email = await this.fetchEmail(emailId);
    return email?.attachments || [];
  }

  public async downloadAttachment(emailId: string, attachmentId: string): Promise<Blob | null> {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        { action: 'fetchAttachment', emailId, attachmentId },
        (response) => {
          if (response?.success && response.data?.data) {
            const binary = atob(response.data.data.replace(/-/g, '+').replace(/_/g, '/'));
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
              bytes[i] = binary.charCodeAt(i);
            }
            resolve(new Blob([bytes]));
          } else {
            console.error('[GmailApiService] Attachment download failed:', response?.error);
            resolve(null);
          }
        }
      );
    });
  }

  public async insertResponse(response: string): Promise<boolean> {
    try {
      const composeArea = document.querySelector('[role="textbox"]');
      if (composeArea) {
        (composeArea as HTMLElement).innerHTML = response;
        return true;
      }
      await navigator.clipboard.writeText(response);
      alert('Response copied to clipboard. Paste it manually.');
      return true;
    } catch (error) {
      console.error('[GmailApiService] insertResponse failed:', error);
      return false;
    }
  }

  public async sendEmail(to: string, subject: string, body: string): Promise<boolean> {
    if (!this.accessToken) {
      const initialized = await this.initialize();
      if (!initialized) return false;
    }

    const email = [
      'Content-Type: text/plain; charset="UTF-8"',
      'MIME-Version: 1.0',
      `To: ${to}`,
      `Subject: ${subject}`,
      '',
      body
    ].join('\r\n');

    const encodedEmail = btoa(email)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: 'sendEmail', raw: encodedEmail }, (response) => {
        resolve(response?.success === true);
      });
    });
  }
}

export default GmailApiService;
