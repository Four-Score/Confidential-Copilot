import { ChatMessage, ChatSettings, RetrievedContext } from '@/types/chat';

export interface LLMRequestOptions {
  messages: ChatMessage[];
  context?: RetrievedContext;
  settings: ChatSettings;
}

export interface StreamingResponse {
  content: ReadableStream<Uint8Array>;
  headers: Headers;
}

/**
 * Abstract interface for LLM providers
 * Defines common methods that all LLM providers must implement
 */
export abstract class LLMProviderInterface {
  /**
   * Generate a completion from the LLM
   * @param options Request options including messages, context, and settings
   */
  abstract generateCompletion(options: LLMRequestOptions): Promise<Response>;

  /**
   * Generate a streaming completion from the LLM
   * @param options Request options including messages, context, and settings
   */
  abstract generateStreamingCompletion(options: LLMRequestOptions): Promise<StreamingResponse>;

  /**
   * Format messages and context for the provider-specific format
   * @param messages Array of chat messages
   * @param context Optional retrieved context
   */
  abstract formatMessagesWithContext(
    messages: ChatMessage[],
    context?: RetrievedContext
  ): any;

  /**
   * Validate that the provider is properly configured
   */
  abstract validateConfiguration(): boolean;

  /**
   * Helper to convert an error to a response
   * @param error The error that occurred
   */
  protected errorToResponse(error: any): Response {
    console.error("LLM provider error:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "An error occurred with the language model provider",
        details: error.toString()
      }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}