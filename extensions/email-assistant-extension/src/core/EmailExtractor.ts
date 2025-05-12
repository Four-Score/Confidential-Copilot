// src/core/EmailExtractor.ts
import { IEmailData, IEmailAttachment } from '../interfaces/IEmailModels';
import GmailApiService from '../services/GmailApiService';

export class EmailExtractor {
  private static instance: EmailExtractor;
  private gmailApiService: GmailApiService;
  
  private constructor() {
    this.gmailApiService = GmailApiService.getInstance();
  }
  
  public static getInstance(): EmailExtractor {
    if (!EmailExtractor.instance) {
      EmailExtractor.instance = new EmailExtractor();
    }
    return EmailExtractor.instance;
  }
  
  /**
   * Extracts the current email using Gmail API instead of DOM scraping
   */
  public async extractCurrentEmail(): Promise<IEmailData | null> {
    try {
      // Use the Gmail API service to fetch the email
      return await this.gmailApiService.extractCurrentEmail();
    } catch (error) {
      console.error('Error extracting email data:', error);
      return null;
    }
  }
  
  /**
   * Retrieves attachment data using Gmail API
   * @param emailId The ID of the email
   * @param attachmentId The ID of the attachment
   */
  public async downloadAttachment(emailId: string, attachmentId: string): Promise<Blob | null> {
    return this.gmailApiService.downloadAttachment(emailId, attachmentId);
  }
  
  /**
   * Legacy method for DOM-based extraction (kept as fallback)
   * @deprecated Use async extractCurrentEmail() instead
   */
  public extractCurrentEmailFromDom(): IEmailData | null {
    try {
      // This is the original DOM-based implementation
      // Kept for fallback purposes
      const emailContainer = document.querySelector('.adn.ads');
      if (!emailContainer) return null;
      
      // Extract sender information
      const senderEl = emailContainer.querySelector('.gD');
      const sender = senderEl ? senderEl.textContent?.trim() || 'Unknown' : 'Unknown';
      
      // Extract subject
      const subjectEl = emailContainer.querySelector('.hP');
      const subject = subjectEl ? subjectEl.textContent?.trim() || 'No Subject' : 'No Subject';
      
      // Extract body
      const bodyEl = emailContainer.querySelector('.a3s.aiL');
      const body = bodyEl ? bodyEl.textContent?.trim() || '' : '';
      
      // Extract attachments
      const attachmentEls = emailContainer.querySelectorAll('.aZo');
      const attachments: IEmailAttachment[] = Array.from(attachmentEls).map((el, index) => {
        const nameEl = el.querySelector('.aV3');
        const sizeEl = el.querySelector('.SaH2Ve');
        return {
          id: `att_${Date.now()}_${index}`,
          name: nameEl?.textContent?.trim() || 'Unnamed',
          size: this.parseSize(sizeEl?.textContent?.trim() || '0'),
          mimeType: this.guessMimeType(nameEl?.textContent?.trim() || '')
        };
      });
      
      return {
        id: `email_${Date.now()}`,
        sender,
        subject,
        body,
        attachments,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error extracting email data from DOM:', error);
      return null;
    }
  }
  
  private parseSize(sizeStr: string): number {
    try {
      const match = sizeStr.match(/(\d+\.?\d*)\s*(KB|MB|GB|B)/i);
      if (!match) return 0;
      
      const [, size, unit] = match;
      const sizeNum = parseFloat(size);
      
      switch (unit.toUpperCase()) {
        case 'KB': return sizeNum * 1024;
        case 'MB': return sizeNum * 1024 * 1024;
        case 'GB': return sizeNum * 1024 * 1024 * 1024;
        default: return sizeNum;
      }
    } catch {
      return 0;
    }
  }
  
  private guessMimeType(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    
    switch (ext) {
      case 'pdf': return 'application/pdf';
      case 'doc':
      case 'docx': return 'application/msword';
      case 'xls':
      case 'xlsx': return 'application/vnd.ms-excel';
      case 'ppt':
      case 'pptx': return 'application/vnd.ms-powerpoint';
      case 'jpg':
      case 'jpeg': return 'image/jpeg';
      case 'png': return 'image/png';
      case 'gif': return 'image/gif';
      case 'txt': return 'text/plain';
      default: return 'application/octet-stream';
    }
  }
}

export default EmailExtractor;