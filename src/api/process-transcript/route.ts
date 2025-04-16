import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { ChatGroq } from 'langchain/chat_models/groq';
import { SystemMessage, HumanMessage } from 'langchain/schema';

// Initialize the LLM using Groq
const llm = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  model: "llama3-70b-8192" // Using Llama 3 as specified
});

async function summarizeTranscript(transcript: string): Promise<string> {
  const systemPrompt = `
    You are an expert meeting assistant. Your task is to create a comprehensive 
    summary of the provided meeting transcript. Focus on key discussion points, 
    decisions made, and the overall narrative of the meeting. Be concise yet thorough.
  `;
  
  const messages = [
    new SystemMessage(systemPrompt),
    new HumanMessage(`Here is the meeting transcript to summarize:\n\n${transcript}`)
  ];
  
  const response = await llm.call(messages);
  return response.content as string;
}

async function extractActionItems(transcript: string): Promise<Array<{
  task: string;
  assignee: string | null;
  deadline: string | null;
}>> {
  const systemPrompt = `
    You are an expert meeting assistant. Your task is to extract all action items from 
    the provided meeting transcript. For each action item, identify:
    1. The task to be completed
    2. The person responsible (if mentioned)
    3. The deadline (if mentioned)
    
    Format each action item as a dictionary with keys: "task", "assignee", "deadline".
    If some information is not available, use null for that field.
    Return a valid JSON array with all action items.
  `;
  
  const messages = [
    new SystemMessage(systemPrompt),
    new HumanMessage(`Here is the meeting transcript to extract action items from:\n\n${transcript}`)
  ];
  
  const response = await llm.call(messages);
  const responseContent = response.content as string;
  
  try {
    // Try to parse the response as JSON
    return JSON.parse(responseContent);
  } catch (e) {
    // If JSON parsing fails, try to extract structured data using a follow-up prompt
    const clarifyMessages = [
      new SystemMessage("Please extract the action items as a valid JSON array of objects, each with 'task', 'assignee', and 'deadline' fields. Use null for missing values."),
      new HumanMessage(`Based on this meeting transcript:\n\n${transcript}\n\nProvide the action items in the specified JSON format.`)
    ];
    const clarifyResponse = await llm.call(clarifyMessages);
    
    try {
      return JSON.parse(clarifyResponse.content as string);
    } catch (e) {
      // If all attempts fail, return a default error action item
      return [{ 
        task: "Error extracting action items. Please review the transcript manually.", 
        assignee: null, 
        deadline: null 
      }];
    }
  }
}

// Main function to process a transcript
async function processTranscript(transcriptText: string) {
  // Process in parallel for better performance
  const [summary, actionItems] = await Promise.all([
    summarizeTranscript(transcriptText),
    extractActionItems(transcriptText)
  ]);
  
  return {
    summary,
    action_items: actionItems
  };
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
    
    // Get the transcript from the request body
    const { transcript } = await request.json();
    
    if (!transcript || typeof transcript !== 'string' || transcript.trim() === '') {
      return NextResponse.json(
        { error: 'Transcript is required' },
        { status: 400 }
      );
    }
    
    // Process the transcript
    const results = await processTranscript(transcript);
    
    // Return the results
    return NextResponse.json(results);
  } catch (error: any) {
    console.error('Error processing transcript:', error);
    
    return NextResponse.json(
      { error: 'Failed to process transcript: ' + (error.message || 'Unknown error') },
      { status: 500 }
    );
  }
}