import { IStorageService } from '../interfaces/IStorageService';
import { IEmailData, IEmailEntities } from '../interfaces/IEmailModels';

interface StoredEmail {
  email: IEmailData;
  entities: IEmailEntities;
}

export class LocalStorageService implements IStorageService {
  private static instance: LocalStorageService;
  private readonly STORAGE_KEY = 'email_assistant_emails';
  
  private constructor() {}
  
  public static getInstance(): LocalStorageService {
    if (!LocalStorageService.instance) {
      LocalStorageService.instance = new LocalStorageService();
    }
    return LocalStorageService.instance;
  }
  
  public async saveEmail(email: IEmailData, entities: IEmailEntities): Promise<boolean> {
    try {
      // Get existing emails
      const emails = await this.getEmails();
      
      // Add the new email
      emails.push({ email, entities });
      
      // Save back to storage
      await this.saveToStorage(emails);
      
      return true;
    } catch (error) {
      console.error('Error saving email:', error);
      return false;
    }
  }
  
  public async getEmails(): Promise<{ email: IEmailData; entities: IEmailEntities; }[]> {
    return new Promise((resolve) => {
      chrome.storage.local.get([this.STORAGE_KEY], (result) => {
        const emails = result[this.STORAGE_KEY] || [];
        resolve(emails);
      });
    });
  }
  
  public async getEmailById(id: string): Promise<{ email: IEmailData; entities: IEmailEntities; } | null> {
    const emails = await this.getEmails();
    const found = emails.find(item => item.email.id === id);
    return found || null;
  }
  
  private async saveToStorage(emails: StoredEmail[]): Promise<void> {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set({ [this.STORAGE_KEY]: emails }, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  }
}

export default LocalStorageService;