import { LLMService } from '../services/LLMService';

export class Summarizer {
  static async summarize(content: string, compression: 'brief' | 'detailed' = 'brief'): Promise<string> {
    if (!content || typeof content !== 'string') return 'No content to summarize.';

    try {
      const llmService = LLMService.getInstance();

      const prompt = `
You are an email summarization assistant.
Summarize the following email into clear ${compression === 'brief' ? 'brief' : 'detailed'} bullet points.
Avoid including any greetings, closings, or reply content.

Email Content:
${content}
`.trim();

      const summarizedText = await llmService.generateResponse(prompt, {
        tone: 'neutral',
        length: compression,
        additionalContext: '',
      });

      const decoded = this.decodeHtmlEntities(summarizedText);

      const lines = decoded
        .split('\n')
        .map(line => line.trim().replace(/^([•*➤→\-–\s]+)+/, '')) // remove leading bullets
        .filter((line, i, arr) => line && (i === 0 || line !== arr[i - 1])); // dedupe

      const cleaned = lines.join('\n');

      if (/^(dear|hi|hello|regards|sincerely|thanks|best)/i.test(cleaned)) {
        throw new Error('LLM returned a full reply instead of a summary.');
      }

      return cleaned;
    } catch (error) {
      console.warn('[Summarizer] Falling back to local summarization:', error);
      return this.localFallbackSummary(content);
    }
  }

  private static decodeHtmlEntities(text: string): string {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
  }

  private static localFallbackSummary(content: string): string {
    const plainText = content.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    const sentences = plainText.match(/[^.!?]+[.!?]/g) || [plainText];

    const clean = sentences
      .map(s => s.trim())
      .filter(s => s.length > 30 && !/<|style=|rgb\(/i.test(s))
      .slice(0, 5);

    return clean.map(s => `${s}`).join('\n') || 'Summary unavailable.';
  }
}
