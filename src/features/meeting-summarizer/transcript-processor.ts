// src/features/meeting-summarizer/transcript-processor.ts

// Simple function to call the Groq API directly
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
  
export async function summarizeTranscript(transcript: string): Promise<string> {
    const messages = [
      {
        role: "system",
        content: `
          You are an expert meeting assistant. Your task is to create a comprehensive summary of the provided meeting transcript.
          Please format your response as follows, using only plain text (no Markdown, no asterisks, no special symbols):

          MEETING SUMMARY:
          [One or two sentences summarizing the meeting.]

          KEY DISCUSSION POINTS:
          - Point 1
          - Point 2
          - ...

          DECISIONS MADE:
          - Decision 1
          - Decision 2
          - ...

          NEXT STEPS:
          - Step 1
          - Step 2
          - ...

          Do not use any Markdown formatting, asterisks, or special symbols except dashes for bullet points and colons for section headers.
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
  
export async function extractActionItems(transcript: string): Promise<Array<{
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
    
    function extractJSONArray(text: string): string | null {
      const match = text.match(/\[([\s\S]*?)\]/);
      return match ? match[0] : null;
    }

    try {
      const responseContent = await callGroqAPI(messages);

      // Try to parse as JSON directly
      try {
        return JSON.parse(responseContent);
      } catch (e) {
        // Try to extract JSON array from the response
        const jsonArray = extractJSONArray(responseContent);
        if (jsonArray) {
          try {
            return JSON.parse(jsonArray);
          } catch (e2) {
            console.error("Failed to parse extracted JSON array:", e2);
          }
        }
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
  export async function processTranscript(transcriptText: string) {
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