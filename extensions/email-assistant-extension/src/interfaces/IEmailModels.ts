export interface IEmailData {
  id: string;
  sender: string;
  subject: string;
  body: string;
  timestamp: string;
  attachments: IEmailAttachment[];
}

export interface IEmailAttachment {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  url?: string;
}

export interface IEmailEntities {
  people: string[];
  organizations: string[];
  dates: string[];
  keyPoints: string[];
  urgency: 'High' | 'Medium' | 'Low';
}

export interface IResponseOptions {
  tone: 'formal' | 'friendly' | 'direct' | 'neutral';
  length: 'brief' | 'standard' | 'detailed';
  includeAttachmentReferences?: boolean;
  extraInstructions?: string; // For user custom points
  formality?: 'formal' | 'semi-formal' | 'informal'; // ADD THIS
  format?: 'bullet-points' | 'paragraph' | 'executive-summary'; // ADD THIS
}


export interface IGeneratedResponse {
  fullResponse: string;
  salutation: string;
  bodyText: string;
  closing: string;
  suggestions: string[];
}