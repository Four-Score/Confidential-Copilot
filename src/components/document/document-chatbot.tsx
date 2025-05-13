"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button_d"
import { Input } from "@/components/ui/input_d"
import { Card, CardContent, CardFooter } from "@/components/ui/card_d"
import { Avatar } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Bot, User, Send, Plus, Loader2 } from "lucide-react"
import type { DocumentType, ChatMessage } from "@/lib/types"
import { getGroqApiKey } from "@/lib/env-config"
import { initGroqModel } from "@/lib/document-generator"
import { ChatPromptTemplate } from "@langchain/core/prompts"
import { StringOutputParser } from "@langchain/core/output_parsers"

interface DocumentChatbotProps {
  document: DocumentType
  onInsertText: (text: string) => void
}

export function DocumentChatbot({ document, onInsertText }: DocumentChatbotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [documentSummary, setDocumentSummary] = useState<string>("")
  const [isSummarizing, setIsSummarizing] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Generate a summary of the document when component mounts
  useEffect(() => {
    const summarizeDocument = async () => {
      try {
        setIsSummarizing(true)
        const apiKey = getGroqApiKey()
        
        if (!apiKey) {
          console.error("Groq API key not found")
          setIsSummarizing(false)
          setDocumentSummary("Unable to analyze document due to missing API key.")
          return
        }

        const model = initGroqModel(apiKey)
        const summaryPrompt = ChatPromptTemplate.fromMessages([
          [
            "system",
            `You are an AI document analyst. Create a concise summary of the following document content.
             Focus on key topics, main sections, and overall purpose.`
          ],
          [
            "user",
            `Document Title: ${document.title}
             Document Type: ${document.template}
             
             Document Content:
             ${document.content}
             
             Please provide a concise summary (max 300 words) that captures the main points and structure of this document.`
          ]
        ])
        
        const outputParser = new StringOutputParser()
        const summaryChain = summaryPrompt.pipe(model).pipe(outputParser)
        
        const summary = await summaryChain.invoke({})
        setDocumentSummary(summary)
        
        // Add initial greeting message after summary is ready
        setMessages([
          {
            role: "assistant",
            content: `Hello! I'm your document assistant. I've analyzed "${document.title}" and I'm ready to help you with it. What would you like to do?`,
          }
        ])
      } catch (error) {
        console.error("Error summarizing document:", error)
        setDocumentSummary("Unable to analyze document. Please try again later.")
      } finally {
        setIsSummarizing(false)
      }
    }

    summarizeDocument()
  }, [document])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: ChatMessage = {
      role: "user",
      content: input,
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const apiKey = getGroqApiKey()
      
      if (!apiKey) {
        throw new Error("Groq API key not found")
      }

      const model = initGroqModel(apiKey)
      
      const chatPrompt = ChatPromptTemplate.fromMessages([
        [
          "system",
          `You are an AI document assistant helping a user with their document.
           
           DOCUMENT INFORMATION:
           Title: ${document.title}
           Type: ${document.template}
           
           DOCUMENT SUMMARY:
           ${documentSummary}
           
           DOCUMENT CONTENT (Excerpt):
           ${document.content.substring(0, 3000)}...
           
           Your job is to help the user with their document by:
           1. Answering questions about the document content
           2. Suggesting improvements or additions
           3. Generating text snippets they can insert into the document
           
           When suggesting text to insert, make sure it's formatted in HTML and matches the style and tone of the existing document.
           Provide 1-3 suggestions when appropriate, formatted as separate options.
           Each suggestion should be complete and ready to insert into the document.
           Do not use markdown - use proper HTML tags like <h1>, <p>, <table>, etc.
           
           Format your suggestions in a way that can be easily parsed with this format:
           ===SUGGESTIONS_START===
           <suggestion>HTML content here</suggestion>
           <suggestion>Another HTML content option</suggestion>
           ===SUGGESTIONS_END===`
        ],
        [
          "user",
          `CONVERSATION HISTORY:
           ${messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n')}
           
           CURRENT USER MESSAGE:
           ${input}`
        ]
      ])
      
      const outputParser = new StringOutputParser()
      const chatChain = chatPrompt.pipe(model).pipe(outputParser)
      
      const response = await chatChain.invoke({})
      
      // Parse suggestions if they exist
      const suggestions: string[] = []
      const suggestionMatch = response.match(/===SUGGESTIONS_START===\s*([\s\S]*?)\s*===SUGGESTIONS_END===/i)
      
      if (suggestionMatch && suggestionMatch[1]) {
        const suggestionContent = suggestionMatch[1]
        const suggestionTags = suggestionContent.match(/<suggestion>([\s\S]*?)<\/suggestion>/g)
        
        if (suggestionTags) {
          suggestionTags.forEach(tag => {
            const content = tag.replace(/<suggestion>([\s\S]*?)<\/suggestion>/, '$1').trim()
            if (content) {
              suggestions.push(content)
            }
          })
        }
      }
      
      // Clean up the response to remove the suggestions block
      let cleanResponse = response.replace(/===SUGGESTIONS_START===\s*([\s\S]*?)\s*===SUGGESTIONS_END===/i, '').trim()
      
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: cleanResponse,
          suggestions: suggestions.length > 0 ? suggestions : undefined,
        },
      ])
    } catch (error) {
      console.error("Error getting AI response:", error)
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I'm sorry, I encountered an error while processing your request. Please make sure your Groq API key is set correctly.",
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    onInsertText(suggestion)

    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: `Insert: "${suggestion.substring(0, 30)}${suggestion.length > 30 ? "..." : ""}"`,
      },
      {
        role: "assistant",
        content: "I've inserted the text for you. Is there anything else you'd like to do with your document?",
      },
    ])
  }

  return (
    <Card className="border-[#4287f5]/20">
      <CardContent className="p-0">
        <ScrollArea className="h-[400px] p-4">
          <div className="space-y-4">
            {isSummarizing ? (
              <div className="flex flex-col items-center justify-center h-64 gap-3">
                <Loader2 className="h-8 w-8 text-[#4287f5] animate-spin" />
                <p className="text-sm text-muted-foreground">Analyzing document content...</p>
              </div>
            ) : (
              <>
                {messages.map((message, index) => (
                  <div key={index} className="flex gap-3">
                    <Avatar className={`h-8 w-8 ${message.role === "assistant" ? "bg-[#4287f5]" : "bg-secondary"}`}>
                      {message.role === "assistant" ? <Bot className="h-4 w-4 text-white" /> : <User className="h-4 w-4" />}
                    </Avatar>
                    <div className="space-y-2 flex-1">
                      <div className="text-sm">{message.content}</div>

                      {message.suggestions && message.suggestions.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {message.suggestions.map((suggestion, i) => (
                            <Button
                              key={i}
                              variant="outline"
                              size="sm"
                              className="text-xs h-7 border-[#4287f5]/30 hover:bg-[#4287f5]/10"
                              onClick={() => handleSuggestionClick(suggestion)}
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              {suggestion.substring(0, 20)}...
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </CardContent>

      <Separator />

      <CardFooter className="p-3">
        <div className="flex w-full items-center space-x-2">
          <Input
            placeholder={isSummarizing ? "Analyzing document..." : "Ask for help with your document..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading || isSummarizing}
          />
          <Button
            size="icon"
            disabled={isLoading || !input.trim() || isSummarizing}
            onClick={handleSendMessage}
            className="bg-[#4287f5] hover:bg-[#3a76d8]"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}