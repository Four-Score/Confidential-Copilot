// src/utils/Summarizer.ts

import { LLMService } from '../services/LLMService';

export class Summarizer {
  static async summarize(content: string, compression: 'brief' | 'detailed' = 'brief'): Promise<string> {
    if (!content) return '';

    const llmService = LLMService.getInstance();

    const options = {
      tone: 'Neutral',
      length: compression === 'brief' ? 'Brief' : 'Detailed',
      additionalContext: 'Summarize the email into clear points.',
    };

    const summarizedText = await llmService.generateResponse(content, options);
    return summarizedText;
  }
}
