// src/app/api/process-transcript/route.ts
import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Simple function to call the Groq API directly without LangChain
async function callGroqAPI(messages: any[]) {
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama3-70b-8192',
        messages: messages,
        temperature: 0.7,
        max_tokens: 1024
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Groq API error (${response.status}):`, errorText);
      throw new Error(`Groq API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("Error calling Groq API:", error);
    throw error;
  }
}

async function summarizeTranscript(transcript: string): Promise<string> {
  const messages = [
    {
      role: "system",
      content: `
        You are an expert meeting assistant. Your task is to create a comprehensive 
        summary of the provided meeting transcript. Focus on key discussion points, 
        decisions made, and the overall narrative of the meeting. Be concise yet thorough.
      `
    },
    {
      role: "user",
      content: `Here is the meeting transcript to summarize:\n\n${transcript}`
    }
  ];
  
  try {
    return await callGroqAPI(messages);
  } catch (error) {
    console.error("Error summarizing transcript:", error);
    return "Error generating summary. Please try again.";
  }
}

async function extractActionItems(transcript: string): Promise<Array<{
  task: string;
  assignee: string | null;
  deadline: string | null;
}>> {
  const messages = [
    {
      role: "system",
      content: `
        You are an expert meeting assistant. Your task is to extract all action items from 
        the provided meeting transcript. For each action item, identify:
        1. The task to be completed
        2. The person responsible (if mentioned)
        3. The deadline (if mentioned)
        
        Format each action item as a dictionary with keys: "task", "assignee", "deadline".
        If some information is not available, use null for that field.
        You must return a valid JSON array with all action items. The entire response must be valid JSON.
      `
    },
    {
      role: "user",
      content: `Here is the meeting transcript to extract action items from:\n\n${transcript}`
    }
  ];
  
  try {
    const responseContent = await callGroqAPI(messages);
    
    try {
      // Try to parse the response as JSON
      return JSON.parse(responseContent);
    } catch (e) {
      console.error("Failed to parse action items JSON, trying with follow-up prompt:", e);
      
      // If JSON parsing fails, try to extract structured data using a follow-up prompt
      const clarifyMessages = [
        {
          role: "system",
          content: "Please extract the action items as a valid JSON array of objects, each with 'task', 'assignee', and 'deadline' fields. Use null for missing values. Your entire response must be valid JSON and nothing else."
        },
        {
          role: "user",
          content: `Based on this meeting transcript:\n\n${transcript}\n\nProvide the action items in the specified JSON format.`
        }
      ];
      
      const clarifyResponse = await callGroqAPI(clarifyMessages);
      
      try {
        return JSON.parse(clarifyResponse);
      } catch (e) {
        console.error("Failed to parse action items JSON even with follow-up:", e);
        // If all attempts fail, return a default error action item
        return [{ 
          task: "Error extracting action items. Please review the transcript manually.", 
          assignee: null, 
          deadline: null 
        }];
      }
    }
  } catch (error) {
    console.error("Error extracting action items:", error);
    return [{ 
      task: "Error processing action items. Please try again.", 
      assignee: null, 
      deadline: null 
    }];
  }
}

// Main function to process a transcript
async function processTranscript(transcriptText: string) {
  try {
    // Process in parallel for better performance
    const [summary, actionItems] = await Promise.all([
      summarizeTranscript(transcriptText),
      extractActionItems(transcriptText)
    ]);
    
    return {
      summary,
      action_items: actionItems
    };
  } catch (error) {
    console.error("Error in processTranscript:", error);
    throw new Error("Failed to process transcript: " + (error instanceof Error ? error.message : "Unknown error"));
  }
}

export async function POST(request: Request) {
  try {
    // Create a Supabase client for authentication check
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check if the user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Parse request body
    let requestBody;
    try {
      requestBody = await request.json();
    } catch (error) {
      console.error("Error parsing request body:", error);
      return NextResponse.json(
        { error: 'Invalid request format' },
        { status: 400 }
      );
    }
    
    const { transcript } = requestBody;
    
    if (!transcript || typeof transcript !== 'string' || transcript.trim() === '') {
      return NextResponse.json(
        { error: 'Transcript is required and must be a non-empty string' },
        { status: 400 }
      );
    }
    
    // Check API key
    if (!process.env.GROQ_API_KEY) {
      console.error("GROQ_API_KEY is not set in environment variables");
      return NextResponse.json(
        { error: 'Server configuration error: Missing API key' },
        { status: 500 }
      );
    }
    
    // Process the transcript
    try {
      const results = await processTranscript(transcript);
      
      // Return the results
      return NextResponse.json(results);
    } catch (error) {
      console.error('Error processing transcript:', error);
      
      return NextResponse.json(
        { error: 'Failed to process transcript: ' + (error instanceof Error ? error.message : 'Unknown error') },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Unexpected error in API route:', error);
    
    return NextResponse.json(
      { error: 'Server error: ' + (error.message || 'Unknown error') },
      { status: 500 }
    );
  }
}