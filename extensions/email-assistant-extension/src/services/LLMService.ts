export interface GenerateOptions {
  tone: string;
  length: string;
  formality?: string;
  format?: string;
  includeAttachmentReferences?: boolean;
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

Constraints:
- Tone: ${options.tone}
- Length: ${options.length}
- Formality: ${options.formality || 'Not specified'}
- Format: ${options.format || 'Paragraph'}
- Mention Attachments: ${options.includeAttachmentReferences ? 'Yes' : 'No'}
- Additional Instructions: ${options.additionalContext || 'None'}

Please generate a professional and thoughtful email response that fits the constraints.
    `.trim();

    return new Promise((resolve, reject) => {
      chrome.storage.local.get(['supabaseSession'], async (result) => {
        const session = result.supabaseSession;

        if (!session?.access_token) {
          console.error('[LLMService] Supabase session missing.');
          reject('Not authenticated. Please log in again.');
          return;
        }

        try {
          const response = await fetch('https://tczdnhbosuoqmgkpqnaz.supabase.co/functions/v1/groq-generate', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'llama3-70b-8192',
              messages: [{ role: 'user', content: prompt }],
              max_tokens: 500,
              temperature: 0.7
              // ❌ Do NOT forward options like tone, formality, etc.
            }),
          });

          const data = await response.json();

          const message =
            data?.choices?.[0]?.message?.content?.trim() ||
            data?.response?.trim() || '';

          if (message.length > 5) {
            resolve(message);
          } else {
            console.warn('[LLMService] Unexpected Groq response:', data);
            reject('Failed to generate response.');
          }
        } catch (error) {
          console.error('[LLMService] Network or server error:', error);
          reject('Network error occurred while generating response.');
        }
      });
    });
  }
}
