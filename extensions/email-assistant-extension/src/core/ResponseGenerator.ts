// src/core/ResponseGenerator.ts

import { IEmailData, IResponseOptions, IGeneratedResponse } from '../interfaces/IEmailModels';
import { Summarizer } from '../utils/summarizer';
import { LLMService } from '../services/LLMService';
export class ResponseGenerator {
  private static instance: ResponseGenerator;
  
  private constructor() {}

  public static getInstance(): ResponseGenerator {
    if (!ResponseGenerator.instance) {
      ResponseGenerator.instance = new ResponseGenerator();
    }
    return ResponseGenerator.instance;
  }

  public async generateResponse(
    emailData: IEmailData,
    options: IResponseOptions,
    additionalContext: string = ''
  ): Promise<IGeneratedResponse> {
    try {
      const summarizer = new Summarizer();
      const llm = LLMService.getInstance();

      // Step 1: Summarize the email body first
      const summary = await Summarizer.summarize(emailData.body, options.length === 'brief' ? 'brief' : 'detailed');

      // Step 2: Build prompt dynamically
      let prompt = `
Summarized Email:
${summary}

Constraints:
- Tone: ${options.tone}
- Length: ${options.length}
- Additional Instructions: ${additionalContext || 'None'}

Please draft a high-quality reply for this email based on the above constraints.
      `.trim();

      // Step 3: Call LLM to generate response
      const generatedText = await llm.generateResponse(prompt, {
        tone: options.tone,
        length: options.length,
        additionalContext,
      });

      // Step 4: Parse and format the response cleanly
      const salutation = this.extractSalutation(generatedText);
      const closing = this.extractClosing(generatedText);
      const body = generatedText.replace(salutation, '').replace(closing, '').trim();

      // Step 5: Provide quick suggestions
      const suggestions = [
        'Thank you for the update!',
        'I will review and get back to you shortly.',
        'Could you please clarify a few points?',
      ];

      return {
        fullResponse: generatedText,
        salutation,
        bodyText: body,
        closing,
        suggestions: suggestions.slice(0, 3),
      };
    } catch (error) {
      console.error('[ResponseGenerator] Error generating response:', error);
      throw new Error('Failed to generate a response.');
    }
  }

  private extractSalutation(text: string): string {
    const lines = text.split('\n').filter(Boolean);
    return lines.length > 0 ? lines[0] : '';
  }

  private extractClosing(text: string): string {
    const lines = text.split('\n').filter(Boolean);
    return lines.length > 2 ? lines.slice(-2).join('\n') : '';
  }
}

export default ResponseGenerator;
