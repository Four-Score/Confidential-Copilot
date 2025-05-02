// src/services/LLMService.ts
import { config } from '../config';

export interface GenerateOptions {
    tone: string;
    length: string;
    additionalContext?: string;
  }
  
  export class LLMService {
    private static instance: LLMService;
    private constructor() {}
  
    static getInstance(): LLMService {
      if (!LLMService.instance) {
        LLMService.instance = new LLMService();
      }
      return LLMService.instance;
    }
  
    async generateResponse(summary: string, options: GenerateOptions): Promise<string> {
      const prompt = `
  Summarized Email:
  ${summary}
  
  Tone: ${options.tone}
  Length: ${options.length}
  Additional Instructions: ${options.additionalContext || "None"}
  
  Please write a polite and professional email response.
  `.trim();
  
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          uthorization: `Bearer ${config.env.GROQ_API_KEY}`, // Replace with your actual key
        },
        body: JSON.stringify({
          model: "llama3-70b-8192",
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
          max_tokens: 500,
          temperature: 0.7,
        }),
      });
  
      const result = await response.json();
      return result?.choices?.[0]?.message?.content?.trim() || 'No response generated.';
    }
  }
  