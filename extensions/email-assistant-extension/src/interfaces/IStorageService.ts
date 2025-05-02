import { IEmailData, IEmailEntities } from './IEmailModels';

export interface IStorageService {
  saveEmail(email: IEmailData, entities: IEmailEntities): Promise<boolean>;
  getEmails(): Promise<{email: IEmailData, entities: IEmailEntities}[]>;
  getEmailById(id: string): Promise<{email: IEmailData, entities: IEmailEntities} | null>;
}