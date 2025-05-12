'use client';

import { useState, useEffect } from 'react';
import { useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useRetrievalFlow } from '@/hooks/useRetrievalFlow';
import { useDataSelection } from '@/contexts/DataSelectionContext';
import { useVectorSearch } from '@/hooks/useVectorSearch';
import { formatSearchResultsToContext } from '@/lib/chatUtils';
import { SearchResults } from '@/components/search/SearchResults'; 
import { LoadingIndicator } from '@/components/chat/LoadingIndicator';
import { ErrorMessage } from '@/components/chat/ErrorMessage';


export default function ChatPage() {
    const hasStartedRetrievalFlow = useRef(false);
    const hasInitializedChat = useRef(false);
    const router = useRouter();
    const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [selectedModel, setSelectedModel] = useState('llama-3.3-70b-versatile');
    const [isLoading, setIsLoading] = useState(false);
    
    const { startRetrievalFlow } = useRetrievalFlow();
    const { selectedProjectId, selectedDocuments, selectedProjectName } = useDataSelection();

    const { search, isLoading: isSearching, results: searchResults } = useVectorSearch();
    const [error, setError] = useState<string | null>(null);

    const models = [
        { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B' },
        { id: 'deepseek-r1-distill-llama-70b', name: 'Deepseek R1' },
        { id: 'meta-llama/llama-4-maverick-17b-128e-instruct', name: 'Llama 4 Maverick' }
    ];

    // Start retrieval flow if no projects are selected
    useEffect(() => {
        // Only proceed if we haven't started the flow yet to prevent infinite loops
        if (hasStartedRetrievalFlow.current) {
            return;
        }
        
        // If no project selected, start the retrieval flow
        if (!selectedProjectId) {
            hasStartedRetrievalFlow.current = true;
            startRetrievalFlow();
            return;
        }
        
        // If project selected but no documents selected, also start retrieval flow
        if (selectedProjectId && (!selectedDocuments || selectedDocuments.length === 0)) {
            hasStartedRetrievalFlow.current = true;
            startRetrievalFlow();
            return;
        }
        
        // If we have both project and documents selected, initialize chat ONCE
        if (selectedProjectId && selectedDocuments && selectedDocuments.length > 0 && !hasInitializedChat.current) {
            hasInitializedChat.current = true; // Mark as initialized to prevent future calls
            initializeChat();
        }
    }, [selectedProjectId, selectedDocuments, startRetrievalFlow]);

    const handleNewChat = () => {
        if (messages.length > 0) {
            if (confirm('Start a new chat? This will clear the current conversation.')) {
                setMessages([]);
                // Reset the initialization flag to allow new welcome message
                hasInitializedChat.current = false;
                initializeChat();
            }
        }
    };

    const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedModel(e.target.value);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInputValue(e.target.value);
    };

    // Function to initialize chat after project and document selection
    const initializeChat = () => {
        // Clear any previous messages
        setMessages([]);
        
        // Set loading to false to ensure the chat is interactive
        setIsLoading(false);
        
        // Add an initial welcome/guide message
        const projectName = selectedProjectName || 'selected project';
        const docCount = selectedDocuments?.length || 0;
        
        const welcomeMessage = {
            role: 'assistant' as const,
            content: `Welcome to Chat Mode! I'm ready to answer questions about your ${projectName} (${docCount} document${docCount !== 1 ? 's' : ''} loaded). What would you like to know?`
        };
        
        // Only add welcome message if there are no messages yet
        if (messages.length === 0) {
            setMessages([welcomeMessage]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;
    
    // Make sure we have project and document selections
    if (!selectedProjectId || !selectedDocuments || selectedDocuments.length === 0) {
        // Show error and start retrieval flow
        alert('Please select project and documents first');
        startRetrievalFlow();
        return;
    }
    
    try {
        // Set loading state
        setIsLoading(true);
        
        // Add user message to chat
        const userMessage = { role: 'user' as const, content: inputValue };
        setMessages(prev => [...prev, userMessage]);
        
        // Clear input field
        setInputValue('');
        
        // Get document IDs for search
        const documentIds = selectedDocuments.map(doc => doc.id);
        
        // Step 1: Perform vector search
        const searchResponse = await search(inputValue, selectedProjectId, documentIds);
        
        // Step 2: Format search results for LLM context - this will be implemented in chatUtils.ts
        const formattedContext = formatSearchResultsToContext(searchResponse);
        
        // Step 3: API call will be implemented in step 6
        // For now, just show a placeholder response with the context
        try {
            // Call the LLM API with the formatted context and query
            const llmResponse = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    query: inputValue,
                    context: formattedContext,
                    model: selectedModel
                })
            });
            
            if (!llmResponse.ok) {
                const errorData = await llmResponse.json();
                throw new Error(errorData.error || 'Failed to get response from LLM');
            }
            
            const data = await llmResponse.json();
            
            // Add the actual LLM response to the chat
            const assistantMessage = { 
                role: 'assistant' as const, 
                content: data.response,
                contextResults: searchResponse // Store the search results for display
            };
            
            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            console.error('Error calling LLM API:', error);
            setError(error instanceof Error ? error.message : 'Failed to get a response from the AI service');
            
            // Add error message to chat
            setMessages(prev => [...prev, { 
                role: 'assistant' as const, 
                content: 'Sorry, I encountered an error while generating a response. Please try again.'
            }]);
        }
    } catch (error) {
        console.error('Chat error:', error);
        
        // Set specific error message
        const errorMessage = error instanceof Error 
            ? error.message 
            : 'An unknown error occurred while processing your request.';
        
        setError(errorMessage);
        
        setMessages(prev => [...prev, { 
            role: 'assistant' as const, 
            content: 'Sorry, I encountered an error while processing your request. Please try again or select different documents.'
        }]);
    } finally {
        setIsLoading(false);
    }
};

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm p-4 flex justify-between items-center border-b border-gray-200">
                <div className="flex items-center">
                    <button 
                        onClick={handleNewChat} 
                        className="mr-4 px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-100"
                    >
                        New Chat
                    </button>
                    <h1 className="font-semibold">Chat Mode</h1>
                </div>
                <div className="flex items-center">
                    <label htmlFor="model-selector" className="mr-2 text-sm">Model:</label>
                    <select
                        id="model-selector"
                        value={selectedModel}
                        onChange={handleModelChange}
                        className="border rounded p-1 text-sm"
                    >
                        {models.map(model => (
                            <option key={model.id} value={model.id}>
                                {model.name}
                            </option>
                        ))}
                    </select>
                </div>
            </header>
            
            {/* Chat Container */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                    <div className="text-center mt-10 text-gray-500">
                        Start a conversation by typing a message below.
                    </div>
                ) : (
                    messages.map((message: { role: 'user' | 'assistant'; content: string; contextResults?: any }, index: number) => (
                        <div key={index} className="w-full">
                            {/* Message Bubble */}
                            <div 
                                className={`p-3 rounded-lg ${
                                    message.role === 'user' 
                                        ? 'bg-blue-600 text-white ml-auto max-w-3xl' 
                                        : 'bg-white border border-gray-200 max-w-4xl'
                                }`}
                            >
                                {message.content}
                            </div>
                            
                            {/* Context Cards (only show for assistant messages with context) */}
                            {message.role === 'assistant' && message.contextResults && (
                                <div className="mt-2 mb-4">
                                    <details className="bg-gray-50 rounded-md">
                                        <summary className="p-2 text-sm text-gray-600 cursor-pointer hover:bg-gray-100 rounded-md">
                                            View sources from your documents
                                        </summary>
                                        <div className="p-2">
                                            <SearchResults
                                                results={message.contextResults}
                                                isLoading={false}
                                                error={null}
                                                query={messages[index-1]?.content || ""}
                                            />
                                        </div>
                                    </details>
                                </div>
                            )}
                        </div>
                    ))
                )}
                {isLoading && (
                    <div className="flex justify-center my-4">
                        <LoadingIndicator text="Processing your request..." size="md" />
                    </div>
                )}

                {/* Add error display right after loading indicator */}
                {error && (
                    <div className="my-4">
                        <ErrorMessage 
                            message={error}
                            onRetry={() => {
                                setError(null);
                            }}
                        />
                    </div>
                )}
            </div>
            
            {/* Input Area */}
            <div className="border-t border-gray-200 p-4 bg-white">
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <textarea
                        value={inputValue}
                        onChange={handleInputChange}
                        placeholder="Type your message..."
                        className="flex-1 p-2 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={2}
                        disabled={isLoading}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSubmit(e);
                            }
                        }}
                    />
                    <button 
                        type="submit" 
                        disabled={!inputValue.trim() || isLoading}
                        className="self-end px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                        Send
                    </button>
                </form>
            </div>
        </div>
    );
}