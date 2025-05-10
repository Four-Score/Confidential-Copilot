import { groq } from '@ai-sdk/groq';
import { streamText } from 'ai';
import { ChatMessage, ChatSettings, RetrievedContext } from '@/types/chat';
import { LLMProviderInterface, LLMRequestOptions, StreamingResponse } from '../LLMProviderInterface';

export class GroqProvider extends LLMProviderInterface {
  private apiKey: string;
  private modelId: string;

  constructor(modelId: string) {
    super();
    this.modelId = modelId;
    this.apiKey = process.env.GROQ_API_KEY || '';
  }

  /**
   * Validates that the provider has the necessary configuration
   */
  validateConfiguration(): boolean {
    if (!this.apiKey) {
      console.error("Groq API key is not configured");
      return false;
    }
    return true;
  }

  /**
   * Formats chat messages and context into the format expected by Groq
   */
  formatMessagesWithContext(
    messages: ChatMessage[],
    context?: RetrievedContext
  ): any {
    // Create a system message with context if available
    const formattedMessages = [...messages];

    // If we have context, insert it as system message before the last user message
    if (context && context.documents && context.documents.length > 0) {
      // Find the last user message
      const lastUserMessageIndex = [...messages].reverse().findIndex(m => m.role === 'user');
      if (lastUserMessageIndex >= 0) {
        const insertPosition = messages.length - 1 - lastUserMessageIndex;

        // Format the context into readable text
        const contextText = this.formatContextToString(context);
        
        // Insert context as a system message
        formattedMessages.splice(insertPosition, 0, {
          id: 'context-' + Date.now(),
          role: 'system',
          content: `Use the following information to help answer the user's query. ONLY USE THIS INFORMATION IF RELEVANT:\n\n${contextText}`,
          timestamp: Date.now()
        });
      }
    }

    // Convert to format expected by Groq
    return formattedMessages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
  }

  /**
   * Format retrieved context into a readable string
   */
  private formatContextToString(context: RetrievedContext): string {
    if (!context.documents || context.documents.length === 0) return '';

    return context.documents.map((document, index: number) => {
      const documentInfo = `Document: ${document.name || 'Untitled document'}`;
      const chunksText = document.chunks.map(chunk => chunk.content || '').join('\n');
      return `[Source ${index + 1}]: ${documentInfo}\n${chunksText}\n`;
    }).join('\n---\n\n');
  }

  /**
   * Generate a completion from Groq
   */
  async generateCompletion(options: LLMRequestOptions): Promise<Response> {
    if (!this.validateConfiguration()) {
      return this.errorToResponse(new Error("Groq API key is not configured"));
    }

    try {
      const groqMessages = this.formatMessagesWithContext(options.messages, options.context);

      const provider = groq(this.modelId);
      
      // Map our settings to Groq's expected parameters
      const result = await streamText({
        model: provider,
        messages: groqMessages,
        temperature: options.settings.temperature,
        maxTokens: options.settings.maxTokens,
        topP: options.settings.topP,
        presencePenalty: options.settings.presencePenalty,
        frequencyPenalty: options.settings.frequencyPenalty,
      });

      return result.toDataStreamResponse();
    } catch (error) {
      return this.errorToResponse(error);
    }
  }

  /**
   * Generate a streaming completion from Groq
   */
  async generateStreamingCompletion(options: LLMRequestOptions): Promise<StreamingResponse> {
    if (!this.validateConfiguration()) {
      throw new Error("Groq API key is not configured");
    }

    const groqMessages = this.formatMessagesWithContext(options.messages, options.context);

    const provider = groq(this.modelId);
    
    // Map our settings to Groq's expected parameters
    const result = await streamText({
      model: provider,
      messages: groqMessages,
      temperature: options.settings.temperature,
      maxTokens: options.settings.maxTokens,
      topP: options.settings.topP,
      presencePenalty: options.settings.presencePenalty,
      frequencyPenalty: options.settings.frequencyPenalty,
    });

    // Get the response headers and stream
    const response = result.toDataStreamResponse();
    
    return {
      content: response.body as ReadableStream<Uint8Array>,
      headers: new Headers(response.headers)
    };
  }
}