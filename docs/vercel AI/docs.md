Documentation relevant to our specific use case: building a RAG-based chat interface with session memory using the Vercel AI SDK and Groq API in a Next.js application.

---

## 1. Frontend Chat Interface (`useChat`)

This hook is the primary tool for building your chat UI. It handles message state management (including session memory), input handling, and communication with your backend API route.

**(From: AI SDK UI - Overview)**

> AI SDK UI is designed to help you build interactive chat, completion, and assistant applications with ease. It is a **framework-agnostic toolkit**, streamlining the integration of advanced AI functionalities into your applications.
>
> AI SDK UI provides robust abstractions that simplify the complex tasks of managing chat streams and UI updates on the frontend... With four main hooks — **`useChat`**, `useCompletion`, `useObject`, and `useAssistant`...
>
> - **[`useChat`](/docs/ai-sdk-ui/chatbot)** offers real-time streaming of chat messages, abstracting state management for inputs, messages, loading, and errors, allowing for seamless integration into any UI design.

**(From: AI SDK UI - Chatbot)**

> The `useChat` hook makes it effortless to create a conversational user interface for your chatbot application. It enables the streaming of chat messages from your AI provider, manages the chat state, and updates the UI automatically as new messages arrive.
>
> To summarize, the `useChat` hook provides the following features:
>
> - **Message Streaming**: All the messages from the AI provider are streamed to the chat UI in real-time.
> - **Managed States**: The hook manages the states for input, messages, status, error and more for you. **(This covers your session memory requirement as `messages` holds the current session's history).**
> - **Seamless Integration**: Easily integrate your chat AI into any design or layout with minimal effort.

### Example Implementation (`useChat`)

```tsx filename='app/page.tsx'
'use client';

import { useChat } from '@ai-sdk/react'; // Assuming React/Next.js

export default function Page() {
  // messages: Array of message objects for the current session.
  // input: Current value of the input field.
  // handleInputChange: Function to update the input state.
  // handleSubmit: Function to send the current message and history to your API.
  const { messages, input, handleInputChange, handleSubmit } = useChat({
    // By default, useChat POSTs to /api/chat. Adjust if needed.
    // api: '/api/my-chat-endpoint',
  });

  // Function to handle form submission, potentially adding RAG context
  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // You might modify `handleSubmit` options here if needed,
    // but often the context is better added server-side.
    handleSubmit(e);
  };

  return (
    <>
      {/* Render the chat messages */}
      {messages.map(message => (
        <div key={message.id}>
          {message.role === 'user' ? 'User: ' : 'AI: '}
          {message.content}
        </div>
      ))}

      {/* Input form */}
      <form onSubmit={handleFormSubmit}>
        <input
          name="prompt"
          value={input}
          onChange={handleInputChange}
          placeholder="Ask anything..."
        />
        <button type="submit">Send</button>
      </form>
    </>
  );
}
```

---

## 2. Backend API Route (e.g., `app/api/chat/route.ts`)

This is where your Next.js server-side logic resides. It receives the chat history and the latest user query from `useChat`, performs the RAG retrieval (which you've already implemented), constructs the final prompt for the LLM (including retrieved documents), calls the Groq LLM using `streamText`, and streams the response back.

**(From: AI SDK Core - Generating Text)**

> AI SDK Core provides the [`streamText`](/docs/reference/ai-sdk-core/stream-text) function which simplifies streaming text from LLMs:
>
> ```ts
> import { streamText } from 'ai';
>
> const result = streamText({
>   model: yourModel, // Your configured Groq model instance
>   messages: yourMessages, // Array of messages including history and current query + context
> });
>
> // example: use textStream as an async iterable (less common for API routes)
> // for await (const textPart of result.textStream) {
> //  console.log(textPart);
> // }
> ```
>
> You can use `streamText` on its own or in combination with [AI SDK UI](/examples/next-pages/basics/streaming-text-generation)... The result object contains several helper functions to make the integration into [AI SDK UI](/docs/ai-sdk-ui) easier:
>
> - `result.toDataStreamResponse()`: Creates a data stream HTTP response (with tool calls etc.) that can be used in a Next.js App Router API route. **(This is what you'll likely use)**
> - `result.pipeDataStreamToResponse()`: Writes data stream delta output to a Node.js response-like object.
> - `result.toTextStreamResponse()`: Creates a simple text stream HTTP response.
> - `result.pipeTextStreamToResponse()`: Writes text delta output to a Node.js response-like object.
>
> <Note type="warning">
>   `streamText` immediately starts streaming and suppresses errors to prevent
>   server crashes. Use the `onError` callback to log errors.
> </Note>

### Structuring the Prompt/Messages for RAG

You'll need to format the `messages` array passed to `streamText` to include the retrieved context. A common pattern is to use a system prompt or prepend the context to the latest user message.

**Example Strategy:** Prepending context to the last user message.

```typescript
// Inside your API route handler

const { messages } = await req.json(); // Messages from useChat

// Assume 'performRetrieval' is your function that takes the last user query
// and returns the relevant document chunks as a string.
const lastUserMessage = messages[messages.length - 1];
const userQuery = lastUserMessage.content;
const retrievedDocsString = await performRetrieval(userQuery);

// Construct the message with context
const messageWithContext = {
  role: 'user',
  content: `CONTEXT:
---
${retrievedDocsString}
---
QUESTION: ${userQuery}`,
};

// Replace the last user message with the context-enhanced one
const messagesForLLM = [...messages.slice(0, -1), messageWithContext];

// Now pass `messagesForLLM` to streamText
const result = streamText({
  model: yourGroqModel,
  messages: messagesForLLM,
  // Optional: Add a system prompt guiding the LLM to use the context
  system: "You are a helpful assistant. Answer the user's QUESTION based *only* on the provided CONTEXT. If the context doesn't contain the answer, say you don't know.",
});

// ... return result.toDataStreamResponse();
```

### Example API Route (`streamText`)

```ts filename='app/api/chat/route.ts'
import { streamText } from 'ai';
import { groq } from '@ai-sdk/groq'; // Import your configured Groq provider
import { CoreMessage } from 'ai'; // Import CoreMessage type

// Assume performRetrieval exists and returns a string
async function performRetrieval(query: string): Promise<string> {
  // Your RAG retrieval logic here...
  console.log(`Retrieving documents for query: ${query}`);
  // Simulate retrieval
  await new Promise(resolve => setTimeout(resolve, 50));
  return "Document Chunk 1: The sky is blue. Document Chunk 2: Apples are fruits.";
}

// Allow streaming responses up to 30 seconds (adjust as needed)
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages }: { messages: CoreMessage[] } = await req.json();

    // --- RAG Integration Start ---
    const lastUserMessage = messages[messages.length - 1];
    if (!lastUserMessage || lastUserMessage.role !== 'user') {
      // Handle cases where the last message isn't from the user if necessary
      return new Response('Last message must be from user', { status: 400 });
    }
    const userQuery = lastUserMessage.content as string; // Assuming simple text content
    const retrievedDocsString = await performRetrieval(userQuery);

    // Construct the final prompt message including context
    const messageWithContext: CoreMessage = {
      role: 'user',
      content: `Based on the following context:\n\n${retrievedDocsString}\n\nPlease answer the question: ${userQuery}`,
    };

    // Replace the last message with the one containing context
    const messagesForLLM = [...messages.slice(0, -1), messageWithContext];
    // --- RAG Integration End ---

    const result = await streamText({
      model: groq('llama3-8b-8192'), // Use your desired Groq model
      messages: messagesForLLM,
      // Optional System Prompt (alternative way to guide the LLM)
      system: "Answer the user's final question based *only* on the provided context. If the context doesn't contain the answer, state that clearly.",
      // Optional: Add callbacks for logging or error handling
      // onError: (error) => console.error("Streaming Error:", error),
      // onFinish: ({ text, toolCalls, toolResults, finishReason, usage }) => {
      //   console.log("Stream finished. Usage:", usage);
      // }
    });

    // Respond with the stream
    return result.toDataStreamResponse();

  } catch (error) {
    console.error("API Route Error:", error);
    // Ensure a proper error response is sent
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

```

---

## 3. Groq Provider Integration

You need to set up the Groq provider to interact with their API.

**(From: Groq Provider)**

> The [Groq](https://groq.com/) provider contains language model support for the Groq API.
>
> ## Setup
>
> The Groq provider is available via the `@ai-sdk/groq` module.
> You can install it with
>
> <Tabs items={['pnpm', 'npm', 'yarn']}>
>  <Tab>
>    <Snippet text="pnpm add @ai-sdk/groq" dark />
>  </Tab>
>  <Tab>
>    <Snippet text="npm install @ai-sdk/groq" dark />
>  </Tab>
>  <Tab>
>    <Snippet text="yarn add @ai-sdk/groq" dark />
>  </Tab>
> </Tabs>
>
> ## Provider Instance
>
> You can import the default provider instance `groq` from `@ai-sdk/groq`:
>
> ```ts
> import { groq } from '@ai-sdk/groq';
> ```
>
> If you need a customized setup, you can import `createGroq` from `@ai-sdk/groq`
> and create a provider instance with your settings:
>
> ```ts
> import { createGroq } from '@ai-sdk/groq';
>
> const groq = createGroq({
>   // custom settings
>   // apiKey: process.env.GROQ_API_KEY // Example: set API key explicitly if needed
> });
> ```
>
> You can use the following optional settings to customize the Groq provider instance:
>
> - **baseURL** _string_
>
>   Use a different URL prefix for API calls, e.g. to use proxy servers.
>   The default prefix is `https://api.groq.com/openai/v1`.
>
> - **apiKey** _string_
>
>   API key that is being sent using the `Authorization` header.
>   It defaults to the `GROQ_API_KEY` environment variable. **(Ensure this environment variable is set in your Vercel deployment)**
>
> - **headers** _Record&lt;string,string&gt;_
>
>   Custom headers to include in the requests.
>
> - **fetch** _(input: RequestInfo, init?: RequestInit) => Promise&lt;Response&gt;_
>
>   Custom [fetch](https://developer.mozilla.org/en-US/docs/Web/API/fetch) implementation.
>   Defaults to the global `fetch` function.
>   You can use it as a middleware to intercept requests,
>   or to provide a custom fetch implementation for e.g. testing.
>
> ## Language Models
>
> You can create [Groq models](https://console.groq.com/docs/models) using a provider instance.
> The first argument is the model id, e.g. `gemma2-9b-it`.
>
> ```ts
> const model = groq('gemma2-9b-it');
> // Or for Llama 3:
> // const model = groq('llama3-8b-8192');
> // const model = groq('llama3-70b-8192');
> ```
>
> ### Example
>
> You can use Groq language models to generate text with the `generateText` function:
>
> ```ts
> import { groq } from '@ai-sdk/groq';
> import { generateText } from 'ai';
>
> const { text } = await generateText({
>   model: groq('gemma2-9b-it'),
>   prompt: 'Write a vegetarian lasagna recipe for 4 people.',
> });
> ```

---

This extracted documentation covers the core components we'll need:

1.  **`useChat`** for the frontend UI and managing session state (messages).
2.  **`streamText`** for the backend API route to call the LLM and stream the response.
3.  How to structure the **`messages`** array to include your RAG context.
4.  How to set up and use the **Groq provider**.