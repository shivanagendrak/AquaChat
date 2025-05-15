// Chat Models and Types
// This file contains types and models for chat functionality

import { Message } from '../services/llamaApiService';

// Chat message with additional UI properties
export interface ChatMessage extends Message {
  id: string;
  timestamp: number;
  isLoading?: boolean;
  error?: string;
}

// Chat conversation
export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

// Chat state
export interface ChatState {
  conversations: Conversation[];
  currentConversationId: string | null;
  isLoading: boolean;
  error: string | null;
}

// Function to create a new conversation
export const createNewConversation = (title: string = 'New Chat'): Conversation => {
  const id = generateId();
  const timestamp = Date.now();

  return {
    id,
    title,
    messages: [],
    createdAt: timestamp,
    updatedAt: timestamp,
  };
};

// Function to add a message to a conversation
export const addMessageToConversation = (
  conversation: Conversation,
  message: Omit<ChatMessage, 'id' | 'timestamp'>
): Conversation => {
  const newMessage: ChatMessage = {
    ...message,
    id: generateId(),
    timestamp: Date.now(),
  };

  return {
    ...conversation,
    messages: [...conversation.messages, newMessage],
    updatedAt: newMessage.timestamp,
  };
};

// Function to update a message in a conversation
export const updateMessageInConversation = (
  conversation: Conversation,
  messageId: string,
  updates: Partial<ChatMessage>
): Conversation => {
  const updatedMessages = conversation.messages.map(message =>
    message.id === messageId ? { ...message, ...updates } : message
  );

  return {
    ...conversation,
    messages: updatedMessages,
    updatedAt: Date.now(),
  };
};

// Function to generate a unique ID
export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15) +
         Math.random().toString(36).substring(2, 15);
};

// Function to get the current conversation
export const getCurrentConversation = (
  conversations: Conversation[],
  currentConversationId: string | null
): Conversation | null => {
  if (!currentConversationId || conversations.length === 0) {
    return null;
  }

  return conversations.find(conv => conv.id === currentConversationId) || null;
};

// Function to update conversation title
export const updateConversationTitle = (
  conversation: Conversation,
  title: string
): Conversation => {
  return {
    ...conversation,
    title,
    updatedAt: Date.now(),
  };
};

// Function to delete a conversation
export const deleteConversation = (
  conversations: Conversation[],
  conversationId: string
): Conversation[] => {
  return conversations.filter(conv => conv.id !== conversationId);
};

// Function to generate a title for a conversation based on the first user message
export const generateConversationTitle = (userMessage: string): string => {
  // Truncate the message if it's too long
  const maxLength = 30;
  if (userMessage.length <= maxLength) {
    return userMessage;
  }

  // Try to find a natural break point
  const breakPoint = userMessage.substring(0, maxLength).lastIndexOf(' ');
  if (breakPoint > 0) {
    return userMessage.substring(0, breakPoint) + '...';
  }

  // If no natural break point, just truncate
  return userMessage.substring(0, maxLength) + '...';
};

// Default export to satisfy the router
export default {
  createNewConversation,
  addMessageToConversation,
  updateMessageInConversation,
  generateId,
  getCurrentConversation,
  updateConversationTitle,
  deleteConversation,
  generateConversationTitle
};
