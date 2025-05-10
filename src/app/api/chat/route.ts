import { NextResponse } from 'next/server';
import { GroqProvider } from '@/services/llm/providers/GroqProvider';
import { LLMProviderInterface } from '@/services/llm/LLMProviderInterface';
import { ChatMessage, ChatSettings, LLMProvider } from '@/types/chat';
import { defaultModels, getDefaultSettings } from '@/config/modelConfig';

export const maxDuration = 120; // Allow 2 minutes for the API request

export async function POST(req: Request) {
  try {
    // Parse request body
    const { messages, modelId, settings, context } = await req.json();

    // Validate required fields
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Messages are required and must be an array" }, { status: 400 });
    }

    if (!modelId) {
      return NextResponse.json({ error: "Model ID is required" }, { status: 400 });
    }

    // Find the model configuration
    const modelConfig = defaultModels.find(model => model.id === modelId);
    if (!modelConfig) {
      return NextResponse.json({ error: `Model with ID ${modelId} not found` }, { status: 404 });
    }

    // Get provider-specific settings
    const finalSettings: ChatSettings = {
      ...getDefaultSettings(modelId),
      ...settings
    };

    // Initialize the appropriate provider based on the model's provider
    let provider: LLMProviderInterface;
    switch (modelConfig.provider) {
      case LLMProvider.GROQ:
        provider = new GroqProvider(modelId);
        break;
      // Add other providers here as they are implemented
      default:
        return NextResponse.json({ error: `Provider ${modelConfig.provider} not implemented yet` }, { status: 501 });
    }

    // Generate completion
    const response = await provider.generateCompletion({
      messages: messages as ChatMessage[],
      settings: finalSettings,
      context
    });

    return response;
  } catch (error: any) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred while processing your request" },
      { status: 500 }
    );
  }
}