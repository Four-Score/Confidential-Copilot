import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { transcript } = body;

    if (!transcript) {
      return NextResponse.json(
        { error: 'Transcript is required' },
        { status: 400 }
      );
    }

    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    
    if (!GROQ_API_KEY) {
      return NextResponse.json(
        { error: 'GROQ_API_KEY environment variable not set' },
        { status: 500 }
      );
    }

    // Prepare the prompt for the LLM
    const prompt = `Please provide a concise summary of the following YouTube video transcript. 
    Include key points, main ideas, and important conclusions.
    
    TRANSCRIPT:
    ${transcript}
    
    SUMMARY:`;
    
    // Call Groq API
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama3-70b-8192', // You can change the model as needed
        messages: [
          { role: 'system', content: 'You are a helpful assistant that summarizes YouTube video transcripts.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 1000
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to summarize transcript');
    }
    
    const data = await response.json();
    const summary = data.choices[0].message.content;
    
    return NextResponse.json({ summary });
  } catch (error: any) {
    console.error('Summarization error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to summarize transcript' },
      { status: 500 }
    );
  }
}