import { IEmailData, IEmailEntities } from './IEmailModels';

export interface IEmailService {
  extractCurrentEmail(): Promise<IEmailData | null>;
  getAttachments(emailId: string): Promise<IEmailData['attachments']>;
  insertResponse(response: string): Promise<boolean>;
}