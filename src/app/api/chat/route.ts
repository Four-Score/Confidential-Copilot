import { NextResponse } from 'next/server';
import { GroqProvider } from '@/services/llm/providers/GroqProvider';
import { LLMProviderInterface } from '@/services/llm/LLMProviderInterface';
import { ChatMessage, ChatSettings, LLMProvider } from '@/types/chat';
import { defaultModels, getDefaultSettings } from '@/config/modelConfig';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { validateDocumentAccess } from '@/lib/documentValidation';
import { sanitizeInput } from '@/lib/sanitization';
import { RateLimiter } from '@/lib/rateLimiter';
import { Database } from '@/types/supabase';

// Set up rate limiting - allow 60 requests per minute
const chatRateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute window
  max: 60, // 60 requests per window
  standardHeaders: true,
  message: 'Too many requests, please try again later.'
});

export const maxDuration = 120; // Allow 2 minutes for the API request

export async function POST(req: Request) {
  try {
    // Apply rate limiting
    const limiterResult = await chatRateLimiter.check(req);
    if (!limiterResult.success) {
      const responseHeaders = new Headers();
      Object.entries(limiterResult.headers).forEach(([key, value]) => {
        responseHeaders.set(key, value.toString());
      });
      
      return NextResponse.json(
        { error: limiterResult.message },
        { status: 429, headers: responseHeaders }
      );
    }

    // Create Supabase client with cookie auth
    const supabase = createRouteHandlerClient<Database>({ cookies });

    // Check if user is authenticated
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession();

    if (authError || !session) {
      console.error("Authentication error:", authError);
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    
    // Parse and sanitize request body
    const body = await req.json();
    const messages = sanitizeInput(body.messages);
    const modelId = sanitizeInput(body.modelId);
    const settings = sanitizeInput(body.settings);
    const context = sanitizeInput(body.context);
    
    // Validate required fields
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Messages are required and must be an array" }, { status: 400 });
    }

    if (!modelId) {
      return NextResponse.json({ error: "Model ID is required" }, { status: 400 });
    }

    // Validate document access if context is provided
    if (context && context.documents && context.documents.length > 0) {
      const documentIds = context.documents.map((doc: { id: string }) => doc.id);
      const hasAccess = await validateDocumentAccess(supabase, userId, documentIds);
      
      if (!hasAccess) {
        console.error(`User ${userId} attempted to access unauthorized documents`);
        return NextResponse.json(
          { error: "You don't have access to one or more of the specified documents" },
          { status: 403 }
        );
      }
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

    // Add rate limit headers to the response
    const headers = new Headers();
    Object.entries(limiterResult.headers).forEach(([key, value]) => {
      headers.append(key, value.toString());
    });

    // Generate completion
    const response = await provider.generateCompletion({
      messages: messages as ChatMessage[],
      settings: finalSettings,
      context
    });

    // Add rate limit headers to the response
    Object.entries(limiterResult.headers).forEach(([key, value]) => {
      response.headers.set(key, value.toString());
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