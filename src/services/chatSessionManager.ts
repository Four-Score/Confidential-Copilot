import { ChatMessage, ChatState } from '@/types/chat';

// Constants
export const LOCAL_STORAGE_CHATS_KEY = 'confidential_copilot_chats';
export const MAX_STORED_CHATS = 10; // Maximum number of chat sessions to store
export const DEFAULT_MAX_CONTEXT_MESSAGES = 20; // Default limit for context window

/**
 * Interface for a stored chat session
 */
export interface StoredChat {
  id: string;
  name?: string;
  createdAt: number;
  lastUpdatedAt: number;
  messages: ChatMessage[];
  selectedDocumentIds?: string[];
  selectedProjectIds?: string[];
  modelId: string;
}

/**
 * Manage chat session history, persistence, and context window
 */
export class ChatSessionManager {
  /**
   * Save the current chat to localStorage
   * @param chatState Current chat state
   * @param id Optional chat ID (generates new if not provided)
   * @returns The ID of the saved chat
   */
  static saveChat(chatState: ChatState, id?: string): string {
    const chatId = id || `chat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    
    // Create a stored chat object
    const storedChat: StoredChat = {
      id: chatId,
      name: `Chat ${new Date().toLocaleString()}`,
      createdAt: Date.now(),
      lastUpdatedAt: Date.now(),
      messages: chatState.messages,
      selectedDocumentIds: chatState.selectedDocumentIds,
      selectedProjectIds: chatState.selectedProjectIds,
      modelId: chatState.modelId,
    };
    
    // Get existing chats
    const existingChats = this.getStoredChats();
    
    // Replace if exists, otherwise add
    const chatIndex = existingChats.findIndex(chat => chat.id === chatId);
    if (chatIndex >= 0) {
      existingChats[chatIndex] = storedChat;
    } else {
      // Add new chat and ensure we don't exceed max stored chats
      existingChats.push(storedChat);
      if (existingChats.length > MAX_STORED_CHATS) {
        // Remove oldest chat
        existingChats.sort((a, b) => b.lastUpdatedAt - a.lastUpdatedAt);
        existingChats.pop();
      }
    }
    
    // Save back to localStorage
    try {
      localStorage.setItem(LOCAL_STORAGE_CHATS_KEY, JSON.stringify(existingChats));
    } catch (error) {
      console.error('Error saving chat to localStorage:', error);
    }
    
    return chatId;
  }
  
  /**
   * Get a specific chat by its ID
   * @param chatId The ID of the chat to retrieve
   * @returns The stored chat or null if not found
   */
  static getChat(chatId: string): StoredChat | null {
    const chats = this.getStoredChats();
    return chats.find(chat => chat.id === chatId) || null;
  }
  
  /**
   * Get all stored chats from localStorage
   * @returns Array of stored chats
   */
  static getStoredChats(): StoredChat[] {
    try {
      const chatsJson = localStorage.getItem(LOCAL_STORAGE_CHATS_KEY);
      if (!chatsJson) return [];
      
      const chats: StoredChat[] = JSON.parse(chatsJson);
      return Array.isArray(chats) ? chats : [];
    } catch (error) {
      console.error('Error retrieving chats from localStorage:', error);
      return [];
    }
  }
  
  /**
   * Delete a specific chat
   * @param chatId The ID of the chat to delete
   * @returns True if deleted, false if not found
   */
  static deleteChat(chatId: string): boolean {
    const chats = this.getStoredChats();
    const initialLength = chats.length;
    
    const updatedChats = chats.filter(chat => chat.id !== chatId);
    
    if (updatedChats.length !== initialLength) {
      try {
        localStorage.setItem(LOCAL_STORAGE_CHATS_KEY, JSON.stringify(updatedChats));
        return true;
      } catch (error) {
        console.error('Error deleting chat:', error);
      }
    }
    
    return false;
  }
  
  /**
   * Delete all stored chats
   */
  static clearAllChats(): void {
    try {
      localStorage.removeItem(LOCAL_STORAGE_CHATS_KEY);
    } catch (error) {
      console.error('Error clearing chats:', error);
    }
  }
  
  /**
   * Limit messages to the maximum context window size
   * @param messages Array of chat messages
   * @param maxMessages Maximum number of messages to keep
   * @returns Trimmed array of messages
   */
  static limitContextWindow(
    messages: ChatMessage[],
    maxMessages: number = DEFAULT_MAX_CONTEXT_MESSAGES
  ): ChatMessage[] {
    if (messages.length <= maxMessages) {
      return messages;
    }
    
    // Keep system messages and the most recent messages up to the max
    const systemMessages = messages.filter(msg => msg.role === 'system');
    const nonSystemMessages = messages.filter(msg => msg.role !== 'system');
    
    // Take the most recent non-system messages
    const recentMessages = nonSystemMessages.slice(-maxMessages);
    
    // Combine system messages with recent messages
    return [...systemMessages, ...recentMessages];
  }
  
  /**
   * Estimate the token count of messages for context window management
   * @param messages Array of chat messages
   * @returns Estimated token count
   */
  static estimateTokenCount(messages: ChatMessage[]): number {
    // Simple approximation: ~4 chars per token for English
    return messages.reduce((count, message) => {
      const contentLength = typeof message.content === 'string' 
        ? message.content.length 
        : JSON.stringify(message.content).length;
      
      return count + Math.ceil(contentLength / 4);
    }, 0);
  }
  
  /**
   * Limit messages to fit within a token budget
   * @param messages Array of chat messages
   * @param maxTokens Maximum tokens to allow
   * @returns Trimmed array of messages
   */
  static limitMessagesByTokens(
    messages: ChatMessage[],
    maxTokens: number = 4000
  ): ChatMessage[] {
    if (!messages.length) return [];
    
    // Always keep system messages
    const systemMessages = messages.filter(msg => msg.role === 'system');
    const nonSystemMessages = messages.filter(msg => msg.role !== 'system');
    
    // Always keep the most recent user message pair (if exists)
    const latestPair = nonSystemMessages.length >= 2 
      ? nonSystemMessages.slice(-2) 
      : nonSystemMessages.slice(0);
    
    // Start with system messages and latest pair
    const essentialMessages = [...systemMessages, ...latestPair];
    const essentialTokens = this.estimateTokenCount(essentialMessages);
    
    // If essential messages already exceed the limit, only keep system and last user message
    if (essentialTokens > maxTokens) {
      const lastUserMessage = nonSystemMessages.findLast(msg => msg.role === 'user');
      return lastUserMessage 
        ? [...systemMessages, lastUserMessage]
        : systemMessages;
    }
    
    // Add earlier messages until we hit the token limit
    const remainingMessages = nonSystemMessages.slice(0, -latestPair.length);
    const result = [...essentialMessages];
    let currentTokens = essentialTokens;
    
    // Add messages from newest to oldest until we hit the token limit
    for (let i = remainingMessages.length - 1; i >= 0; i--) {
      const message = remainingMessages[i];
      const messageTokens = this.estimateTokenCount([message]);
      
      if (currentTokens + messageTokens <= maxTokens) {
        result.unshift(message); // Add to beginning to maintain conversation order
        currentTokens += messageTokens;
      } else {
        break;
      }
    }
    
    return result;
  }
  
  /**
   * Create a name for a chat based on its content
   * @param messages Chat messages
   * @returns Generated name
   */
  static generateChatName(messages: ChatMessage[]): string {
    // Find the first user message or use default
    const firstUserMessage = messages.find(msg => msg.role === 'user');
    
    if (firstUserMessage && typeof firstUserMessage.content === 'string') {
      // Truncate to first 30 characters for the name
      const content = firstUserMessage.content.trim();
      const truncated = content.length > 30
        ? content.substring(0, 30) + '...'
        : content;
      
      return truncated;
    }
    
    // Default name with timestamp
    return `Chat ${new Date().toLocaleString()}`;
  }
}