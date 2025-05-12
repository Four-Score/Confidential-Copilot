import { NextResponse } from 'next/server';
import { createLlmPromptWithContext } from '@/lib/chatUtils';

// Set up Groq API URL
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export async function POST(req: Request) {
  try {
    // Extract request body
    const body = await req.json();
    const { query, context, model = 'llama-3.3-70b-versatile' } = body;

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    // Create the prompt that combines context and query
    const prompt = createLlmPromptWithContext(query, context || '');
    
    // Get API key from environment variable
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.error('GROQ_API_KEY is not set in environment variables');
      return NextResponse.json(
        { error: 'API configuration error' },
        { status: 500 }
      );
    }

    // Prepare the request to Groq API
    const groqRequest = {
      model: model,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.5,
      max_tokens: 1024,
    };

    // Call Groq API
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(groqRequest)
    });

    // Handle API errors
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Groq API error:', errorData);
      return NextResponse.json(
        { error: 'Error from LLM provider', details: errorData },
        { status: response.status }
      );
    }

    // Parse and return the response
    const responseData = await response.json();
    const assistantResponse = responseData.choices?.[0]?.message?.content || 'No response generated';

    return NextResponse.json({ response: assistantResponse });
    
  } catch (error) {
    console.error('Error in chat API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}