// src/features/meeting-summarizer/transcript-processor.ts
import { ChatGroq } from '@langchain/groq';
import { StateGraph, END } from '@langchain/langgraph';
import { TypedDict } from '@langchain/core/schemas';
import { HumanMessage, SystemMessage, AIMessage } from '@langchain/core/messages';

// Make sure to add these environment variables to your .env file
// GROQ_API_KEY=your_groq_api_key

// Define the state structure for the graph
interface AgentState {
  transcript: string;
  summary: string;
  action_items: Array<{
    task: string;
    assignee: string | null;
    deadline: string | null;
  }>;
  current_step: string;
}

// Initialize the LLM using Groq
const llm = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  model: "llama3-70b-8192" // Using Llama 3 as specified
});

// Define the nodes for the graph (processing steps)
function summarizeTranscript(state: AgentState): AgentState {
  const systemPrompt = `
    You are an expert meeting assistant. Your task is to create a comprehensive 
    summary of the provided meeting transcript. Focus on key discussion points, 
    decisions made, and the overall narrative of the meeting. Be concise yet thorough.
  `;
  
  const messages = [
    new SystemMessage(systemPrompt),
    new HumanMessage(`Here is the meeting transcript to summarize:\n\n${state.transcript}`)
  ];
  
  const response = llm.invoke(messages);
  state.summary = response.content;
  state.current_step = "summarize_transcript_completed";
  
  return state;
}

function extractActionItems(state: AgentState): AgentState {
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
    new HumanMessage(`Here is the meeting transcript to extract action items from:\n\n${state.transcript}`)
  ];
  
  const response = llm.invoke(messages);
  
  try {
    // Try to parse the response as JSON
    const actionItems = JSON.parse(response.content);
    state.action_items = actionItems;
  } catch (e) {
    // If JSON parsing fails, try to extract structured data using a follow-up prompt
    const clarifyMessages = [
      new SystemMessage("Please extract the action items as a valid JSON array of objects, each with 'task', 'assignee', and 'deadline' fields. Use null for missing values."),
      new HumanMessage(`Based on this meeting transcript:\n\n${state.transcript}\n\nProvide the action items in the specified JSON format.`)
    ];
    const clarifyResponse = llm.invoke(clarifyMessages);
    
    try {
      state.action_items = JSON.parse(clarifyResponse.content);
    } catch (e) {
      // If all attempts fail, return a default error action item
      state.action_items = [{ 
        task: "Error extracting action items. Please review the transcript manually.", 
        assignee: null, 
        deadline: null 
      }];
      console.error("Error extracting action items:", e);
    }
  }
  
  state.current_step = "extract_action_items_completed";
  return state;
}

// Create the agent workflow as a graph
function createAgentGraph() {
  // Initialize the graph
  const workflow = new StateGraph<AgentState>({
    channels: {
      transcript: { value: "" },
      summary: { value: "" },
      action_items: { value: [] },
      current_step: { value: "start" }
    }
  });
  
  // Add nodes to the graph
  workflow.addNode("summarize_transcript", summarizeTranscript);
  workflow.addNode("extract_action_items", extractActionItems);
  
  // Define the edges (the flow between nodes)
  workflow.addEdge("summarize_transcript", "extract_action_items");
  workflow.addEdge("extract_action_items", END);
  
  // Set the entry point
  workflow.setEntryPoint("summarize_transcript");
  
  // Compile the graph
  return workflow.compile();
}

// Main function to process a transcript
export async function processTranscript(transcriptText: string) {
  // Create the agent graph
  const agent = createAgentGraph();
  
  // Initialize the state
  const initialState: AgentState = {
    transcript: transcriptText,
    summary: "",
    action_items: [],
    current_step: "start"
  };
  
  // Run the agent
  const result = await agent.invoke(initialState);
  
  // Return the processed results
  return {
    summary: result.summary,
    action_items: result.action_items
  };
}