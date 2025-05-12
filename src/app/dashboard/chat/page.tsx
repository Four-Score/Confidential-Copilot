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
import { ChatMessage } from '@/components/chat/ChatMessage';
import { ChatInput } from '@/components/chat/ChatInput';
import { NewChatButton } from '@/components/chat/NewChatButton';
import { ModelSelector } from '@/components/chat/ModelSelector';
import { ChatResponseContainer } from '@/components/chat/ChatResponseContainer';

export default function ChatPage() {
    const hasStartedRetrievalFlow = useRef(false);
    const hasInitializedChat = useRef(false);
    const router = useRouter();
    const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string; contextResults?: any }[]>([]);
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

    const handleModelChange = (modelId: string) => {
        setSelectedModel(modelId);
    };

    const handleSubmit = async (content: string) => {
        if (!content.trim() || isLoading) return;
        
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
            const userMessage = { role: 'user' as const, content: content };
            setMessages(prev => [...prev, userMessage]);
            
            // Get document IDs for search
            const documentIds = selectedDocuments.map(doc => doc.id);
            
            // Step 1: Perform vector search
            const searchResponse = await search(content, selectedProjectId, documentIds);
            
            // Step 2: Format search results for LLM context - this will be implemented in chatUtils.ts
            const formattedContext = formatSearchResultsToContext(searchResponse);
            
            try {
                // Call the LLM API with the formatted context and query
                const llmResponse = await fetch('/api/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        query: content,
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
        <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-gray-100">
            {/* Header */}
            <header className="bg-white shadow-md px-6 py-4 flex justify-between items-center border-b border-gray-200 sticky top-0 z-10">
                <div className="flex items-center space-x-4">
                    <NewChatButton 
                        hasMessages={messages.length > 0}
                        onNewChat={handleNewChat}
                    />
                    <h1 className="font-semibold text-lg text-gray-800">Chat Mode</h1>
                </div>
                <ModelSelector 
                    models={models}
                    selectedModel={selectedModel}
                    onModelChange={handleModelChange}
                />
            </header>
            
            {/* Chat Container */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 max-w-4xl w-full mx-auto">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full">
                        <div className="p-8 bg-white rounded-xl shadow-sm border border-gray-200 text-center max-w-md">
                            <div className="text-4xl mb-4">💬</div>
                            <h3 className="text-xl font-medium text-gray-800 mb-2">Start a Conversation</h3>
                            <p className="text-gray-600">Ask questions about your documents and I'll help you find answers.</p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {messages.map((message, index) => 
                            message.role === 'user' ? (
                                <ChatMessage key={index} message={message} />
                            ) : (
                                <div key={index} className="space-y-2">
                                    {message.contextResults ? (
                                        <ChatResponseContainer 
                                            content={message.content}
                                            contextResults={message.contextResults}
                                            query={index > 0 && messages[index-1].role === 'user' ? messages[index-1].content : ""}
                                            isLoading={false}
                                            error={null}
                                        />
                                    ) : (
                                        <ChatMessage message={message} />
                                    )}
                                </div>
                            )
                        )}
                    </div>
                )}
                
                {isLoading && (
                    <div className="flex justify-center my-8">
                        <LoadingIndicator text="Processing your request..." size="lg" />
                    </div>
                )}

                {error && (
                    <div className="my-4 max-w-xl mx-auto">
                        <ErrorMessage 
                            message={error}
                            onRetry={() => setError(null)}
                        />
                    </div>
                )}
            </div>
            
            {/* Input Area - Fixed at the bottom */}
            <div className="border-t border-gray-200 bg-white p-4 md:p-6 sticky bottom-0 z-10 shadow-md">
                <div className="max-w-4xl mx-auto">
                    <ChatInput 
                        isLoading={isLoading} 
                        onSubmit={handleSubmit}
                    />
                </div>
            </div>
        </div>
    );
}