import { IEmailData, IEmailEntities } from '../interfaces/IEmailModels';

export class EntityAnalyzer {
  private static instance: EntityAnalyzer;
  
  private constructor() {}
  
  public static getInstance(): EntityAnalyzer {
    if (!EntityAnalyzer.instance) {
      EntityAnalyzer.instance = new EntityAnalyzer();
    }
    return EntityAnalyzer.instance;
  }
  
  public analyzeEmail(emailData: IEmailData): IEmailEntities {
    // This is a simple rule-based implementation for demonstration
    // A more sophisticated implementation would use a lightweight ML model
    
    const entities: IEmailEntities = {
      people: [],
      organizations: [],
      dates: [],
      keyPoints: [],
      urgency: 'Medium',
    };
    
    // Extract names (very simplified)
    const nameRegex = /([A-Z][a-z]+ [A-Z][a-z]+)/g;
    const potentialNames = emailData.body.match(nameRegex) || [];
    entities.people = [...new Set(potentialNames)];
    
    // Extract organizations (simplified)
    const orgRegex = /([A-Z][a-z]*\s)?(Inc\.|LLC|Ltd\.|Corp\.|Corporation|Company)/g;
    const potentialOrgs = emailData.body.match(orgRegex) || [];
    entities.organizations = [...new Set(potentialOrgs)];
    
    // Extract dates (simplified)
    const dateRegex = /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b|\b\d{1,2}-\d{1,2}-\d{2,4}\b/g;
    const datesFound = emailData.body.match(dateRegex) || [];
    entities.dates = [...new Set(datesFound)];
    
    // Extract key points (simplified)
    const sentences = emailData.body.split(/[.!?]+/).filter(s => s.trim().length > 0);
    entities.keyPoints = sentences
      .filter(s => 
        s.includes('please') || 
        s.includes('urgent') || 
        s.includes('important') || 
        s.includes('deadline') ||
        s.includes('require') ||
        s.includes('need')
      )
      .slice(0, 3)
      .map(s => s.trim());
    
    // Determine urgency based on keywords
    if (
      emailData.subject.toLowerCase().includes('urgent') || 
      emailData.subject.toLowerCase().includes('asap') ||
      emailData.body.toLowerCase().includes('urgent') ||
      emailData.body.toLowerCase().includes('asap') ||
      emailData.body.toLowerCase().includes('immediately') ||
      emailData.body.toLowerCase().includes('emergency')
    ) {
      entities.urgency = 'High';
    } else if (
      emailData.subject.toLowerCase().includes('reminder') ||
      emailData.body.toLowerCase().includes('reminder') ||
      emailData.body.toLowerCase().includes('soon') ||
      emailData.body.toLowerCase().includes('deadline')
    ) {
      entities.urgency = 'Medium';
    } else {
      entities.urgency = 'Low';
    }
    
    return entities;
  }
}

export default EntityAnalyzer;