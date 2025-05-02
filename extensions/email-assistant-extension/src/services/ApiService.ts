// src/services/ApiService.ts
import { IEmailData, IEmailEntities, IResponseOptions, IGeneratedResponse } from '../interfaces/IEmailModels';
import { config } from '../config';

export class ApiService {
  private static instance: ApiService;
  private baseUrl: string;
  
  private constructor() {
    this.baseUrl = config.apiUrl;
  }
  
  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }
  
  /**
   * Sends an email to the RAG backend for processing and storage
   * Uses DCPE encryption for privacy preservation
   */
  public async saveEmailWithDCPE(
    emailData: IEmailData, 
    entities: IEmailEntities
  ): Promise<{ success: boolean; id?: string }> {
    try {
      // Check if encryption is enabled in config
      if (!config.features.encryptionEnabled) {
        console.log('DCPE encryption disabled in config, skipping backend save');
        return { success: true, id: `local_${Date.now()}` };
      }
      
      const response = await fetch(`${this.baseUrl}/email/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: emailData,
          entities,
          encryptionEnabled: true
        }),
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error saving email with DCPE:', error);
      return { success: false };
    }
  }
  
  /**
   * Generates an email response using the Agentic RAG system
   */
  public async generateResponse(
    emailData: IEmailData,
    entities: IEmailEntities,
    options: IResponseOptions
  ): Promise<IGeneratedResponse | null> {
    try {
      // For testing/development, use local generation if API is not available
      if (config.features.useLocalStorageOnly) {
        return this.mockGenerateResponse(emailData, entities, options);
      }
      
      const response = await fetch(`${this.baseUrl}/email/generate-response`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: emailData,
          entities,
          options,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const result = await response.json();
      return result.response;
    } catch (error) {
      console.error('Error generating response:', error);
      return null;
    }
  }
  
  /**
   * Mock response generator for local testing
   * To be replaced with actual API calls in production
   */
  private mockGenerateResponse(
    emailData: IEmailData,
    entities: IEmailEntities,
    options: IResponseOptions
  ): IGeneratedResponse {
    console.log('Using mock response generation');
    
    // Extract recipient name for salutation
    const senderName = emailData.sender.split('<')[0].trim().split(' ')[0] || 'there';
    
    // Generate salutation based on tone
    let salutation = '';
    switch (options.tone) {
      case 'formal':
        salutation = `Dear ${senderName},`;
        break;
      case 'friendly':
        salutation = `Hi ${senderName}!`;
        break;
      case 'direct':
        salutation = `${senderName},`;
        break;
      default:
        salutation = `Hello ${senderName},`;
    }
    
    // Generate body text
    let bodyText = '';
    
    // Add acknowledgment
    if (options.tone === 'formal') {
      bodyText += 'Thank you for your email regarding ';
    } else if (options.tone === 'friendly') {
      bodyText += 'Thanks for reaching out about ';
    } else {
      bodyText += 'I received your message about ';
    }
    
    // Add subject reference
    bodyText += `"${emailData.subject}". `;
    
    // Add content based on length
    if (entities.keyPoints.length > 0) {
      if (options.length === 'brief') {
        bodyText += `I'll address the key point regarding ${entities.keyPoints[0]}. `;
      } else if (options.length === 'detailed') {
        bodyText += 'Ive carefully reviewed your email and would like to address each point:\n\n';
        entities.keyPoints.forEach(point => {
          bodyText += `- Regarding ${point}: I understand this is important and will give it my full attention.\n`;
        });
        bodyText += '\n';
      } else {
        bodyText += `I understand your main concerns are about ${entities.keyPoints.slice(0, 2).join(' and ')}. `;
      }
    }
    
    // Add attachment references if needed
    if (options.includeAttachmentReferences && emailData.attachments.length > 0) {
      if (emailData.attachments.length === 1) {
        bodyText += `I've reviewed the attached file (${emailData.attachments[0].name}) and will incorporate this information. `;
      } else {
        bodyText += `I've reviewed the ${emailData.attachments.length} attachments you provided and will incorporate this information. `;
      }
    }
    
    // Add next steps based on urgency
    if (entities.urgency === 'High') {
      bodyText += 'I understand this is a high-priority matter and will respond with a comprehensive follow-up by end of day. ';
    } else if (entities.urgency === 'Medium') {
      bodyText += 'I will look into this and get back to you with more details by tomorrow. ';
    } else {
      bodyText += 'I will review this further and follow up with you next week. ';
    }
    
    // Generate closing based on tone
    let closing = '';
    switch (options.tone) {
      case 'formal':
        closing = 'Sincerely,\n[Your Name]';
        break;
      case 'friendly':
        closing = 'Best wishes,\n[Your Name]';
        break;
      case 'direct':
        closing = 'Regards,\n[Your Name]';
        break;
      default:
        closing = 'Thanks,\n[Your Name]';
    }
    
    // Generate suggestions
    const suggestions = [
      'I appreciate you bringing this to my attention.',
      'Let me know if you need any additional information.',
      'Im looking forward to our continued collaboration.',
    ];
    
    if (entities.dates.length > 0) {
      suggestions.push(`I'll make sure to prioritize this before ${entities.dates[0]}.`);
    }
    
    // Combine all parts
    const fullResponse = `${salutation}\n\n${bodyText}\n\n${closing}`;
    
    return {
      fullResponse,
      salutation,
      bodyText,
      closing,
      suggestions
    };
  }
  
  /**
   * Retrieves saved emails from the backend
   */
  public async getSavedEmails(): Promise<Array<{ email: IEmailData; entities: IEmailEntities }>> {
    try {
      // For testing/development, use local storage if API is not available
      if (config.features.useLocalStorageOnly) {
        return this.getLocalSavedEmails();
      }
      
      const response = await fetch(`${this.baseUrl}/email/saved`);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const result = await response.json();
      return result.emails;
    } catch (error) {
      console.error('Error retrieving saved emails:', error);
      return [];
    }
  }
  
  /**
   * Gets saved emails from local storage for testing
   */
  private async getLocalSavedEmails(): Promise<Array<{ email: IEmailData; entities: IEmailEntities }>> {
    return new Promise((resolve) => {
      chrome.storage.local.get(['email_assistant_emails'], (result) => {
        resolve(result.email_assistant_emails || []);
      });
    });
  }
}

export default ApiService;