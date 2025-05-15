// Chat Context
// This file contains the context for managing chat state

import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { initializeApiKey } from '../config/apiConfig';
import {
  addMessageToConversation,
  ChatMessage,
  ChatState,
  Conversation,
  createNewConversation,
  generateConversationTitle,
  getCurrentConversation,
  updateMessageInConversation
} from '../models/chatModels';
import {
  DEFAULT_SYSTEM_MESSAGE,
  Message,
  sendChatCompletion
} from '../services/llamaApiService';
import { getItem, removeItem, setItem } from '../utils/storage';

// Initial chat state
const initialChatState: ChatState = {
  conversations: [],
  currentConversationId: null,
  isLoading: false,
  error: null,
};

// Chat context type
interface ChatContextType extends ChatState {
  sendMessage: (content: string) => Promise<void>;
  startNewConversation: () => void;
  selectConversation: (conversationId: string) => void;
  deleteConversation: (conversationId: string) => void;
  clearConversations: () => void;
  currentConversation: Conversation | null;
}

// Create context with default values
export const ChatContext = createContext<ChatContextType>({
  ...initialChatState,
  sendMessage: async () => {},
  startNewConversation: () => {},
  selectConversation: () => {},
  deleteConversation: () => {},
  clearConversations: () => {},
  currentConversation: null,
});

// Custom hook to use the chat context
export const useChat = () => useContext(ChatContext);

// Chat provider props
interface ChatProviderProps {
  children: ReactNode;
}

// Storage keys
const STORAGE_KEYS = {
  CONVERSATIONS: 'aquachat_conversations',
  CURRENT_CONVERSATION_ID: 'aquachat_current_conversation_id',
};

// Chat provider component
export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  // State
  const [state, setState] = useState<ChatState>(initialChatState);

  // Initialize API key and load saved conversations
  useEffect(() => {
    const initialize = async () => {
      // Initialize API key
      await initializeApiKey();

      // Load saved conversations
      await loadConversations();
    };

    initialize();
  }, []);

  // Load conversations from storage
  const loadConversations = async () => {
    try {
      // Load conversations
      const conversationsJson = await getItem(STORAGE_KEYS.CONVERSATIONS);
      const conversations: Conversation[] = conversationsJson ? JSON.parse(conversationsJson) : [];

      // Load current conversation ID
      const currentConversationId = await getItem(STORAGE_KEYS.CURRENT_CONVERSATION_ID);

      setState(prevState => ({
        ...prevState,
        conversations,
        currentConversationId: currentConversationId || null,
      }));
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  // Save conversations to storage
  const saveConversations = async (conversations: Conversation[], currentConversationId: string | null) => {
    try {
      await setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(conversations));

      if (currentConversationId) {
        await setItem(STORAGE_KEYS.CURRENT_CONVERSATION_ID, currentConversationId);
      } else {
        await removeItem(STORAGE_KEYS.CURRENT_CONVERSATION_ID);
      }
    } catch (error) {
      console.error('Error saving conversations:', error);
    }
  };

  // Get current conversation
  const currentConversation = getCurrentConversation(
    state.conversations,
    state.currentConversationId
  );

  // Start a new conversation
  const startNewConversation = () => {
    const newConversation = createNewConversation();

    setState(prevState => {
      const updatedConversations = [...prevState.conversations, newConversation];

      // Save to storage
      saveConversations(updatedConversations, newConversation.id);

      return {
        ...prevState,
        conversations: updatedConversations,
        currentConversationId: newConversation.id,
      };
    });
  };

  // Select a conversation
  const selectConversation = (conversationId: string) => {
    setState(prevState => {
      // Save to storage
      saveConversations(prevState.conversations, conversationId);

      return {
        ...prevState,
        currentConversationId: conversationId,
      };
    });
  };

  // Delete a conversation
  const deleteConversation = (conversationId: string) => {
    setState(prevState => {
      const updatedConversations = prevState.conversations.filter(
        conv => conv.id !== conversationId
      );

      // Determine new current conversation ID
      let newCurrentId = prevState.currentConversationId;
      if (newCurrentId === conversationId) {
        newCurrentId = updatedConversations.length > 0 ? updatedConversations[0].id : null;
      }

      // Save to storage
      saveConversations(updatedConversations, newCurrentId);

      return {
        ...prevState,
        conversations: updatedConversations,
        currentConversationId: newCurrentId,
      };
    });
  };

  // Clear all conversations
  const clearConversations = () => {
    setState(prevState => {
      // Save to storage
      saveConversations([], null);

      return {
        ...prevState,
        conversations: [],
        currentConversationId: null,
      };
    });
  };

  // Send a message
  const sendMessage = async (content: string) => {
    // Don't send empty messages
    if (!content.trim()) {
      return;
    }

    // Create or get conversation
    let conversation = currentConversation;
    if (!conversation) {
      conversation = createNewConversation();
      setState(prevState => ({
        ...prevState,
        conversations: [...prevState.conversations, conversation!],
        currentConversationId: conversation!.id,
      }));
    }

    // Create user message
    const userMessage: Omit<ChatMessage, 'id' | 'timestamp'> = {
      role: 'user',
      content,
    };

    // Add user message to conversation
    const updatedConversation = addMessageToConversation(conversation, userMessage);

    // Create loading message for assistant
    const loadingMessage: Omit<ChatMessage, 'id' | 'timestamp'> = {
      role: 'assistant',
      content: '',
      isLoading: true,
    };

    // Add loading message to conversation
    const conversationWithLoading = addMessageToConversation(updatedConversation, loadingMessage);

    // Update state with user message and loading message
    setState(prevState => {
      const updatedConversations = prevState.conversations.map(conv =>
        conv.id === conversationWithLoading.id ? conversationWithLoading : conv
      );

      // Save to storage
      saveConversations(updatedConversations, conversationWithLoading.id);

      return {
        ...prevState,
        conversations: updatedConversations,
        isLoading: true,
        error: null,
      };
    });

    try {
      // Update conversation title if this is the first message
      if (updatedConversation.messages.length === 1) {
        const title = generateConversationTitle(content);
        updatedConversation.title = title;
      }

      // Prepare messages for API
      const apiMessages: Message[] = [
        DEFAULT_SYSTEM_MESSAGE,
        ...updatedConversation.messages.map(msg => ({
          role: msg.role,
          content: msg.content,
        })),
      ];

      // Send to API
      const response = await sendChatCompletion(apiMessages);

      if (!response || !response.completion_message || !response.completion_message.content?.text) {
        throw new Error('Invalid response from API');
      }

      // Get assistant message from the new response format
      const assistantMessage = {
        role: 'assistant' as const,
        content: response.completion_message.content.text,
      };

      // Find the loading message and update it
      const loadingMessageIndex = conversationWithLoading.messages.findIndex(
        msg => msg.isLoading
      );

      if (loadingMessageIndex !== -1) {
        const loadingMessageId = conversationWithLoading.messages[loadingMessageIndex].id;

        // Update the loading message with the response
        setState(prevState => {
          const currentConv = prevState.conversations.find(
            conv => conv.id === conversationWithLoading.id
          );

          if (!currentConv) return prevState;

          const updatedConv = updateMessageInConversation(
            currentConv,
            loadingMessageId,
            {
              content: assistantMessage.content,
              isLoading: false,
            }
          );

          const updatedConversations = prevState.conversations.map(conv =>
            conv.id === updatedConv.id ? updatedConv : conv
          );

          // Save to storage
          saveConversations(updatedConversations, updatedConv.id);

          return {
            ...prevState,
            conversations: updatedConversations,
            isLoading: false,
            error: null, // Clear any previous errors
          };
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);

      // Format the error message for display
      let errorMessage = 'An unknown error occurred';
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      // Find the loading message and update it with error
      const loadingMessageIndex = conversationWithLoading.messages.findIndex(
        msg => msg.isLoading
      );

      if (loadingMessageIndex !== -1) {
        const loadingMessageId = conversationWithLoading.messages[loadingMessageIndex].id;

        // Update the loading message with error
        setState(prevState => {
          const currentConv = prevState.conversations.find(
            conv => conv.id === conversationWithLoading.id
          );

          if (!currentConv) return prevState;

          const updatedConv = updateMessageInConversation(
            currentConv,
            loadingMessageId,
            {
              content: 'Sorry, I encountered an error. Please try again.',
              isLoading: false,
              error: error instanceof Error ? error.message : 'Unknown error',
            }
          );

          const updatedConversations = prevState.conversations.map(conv =>
            conv.id === updatedConv.id ? updatedConv : conv
          );

          // Save to storage
          saveConversations(updatedConversations, updatedConv.id);

          return {
            ...prevState,
            conversations: updatedConversations,
            isLoading: false,
            error: errorMessage,
          };
        });
      }
    }
  };

  // Context value
  const contextValue: ChatContextType = {
    ...state,
    sendMessage,
    startNewConversation,
    selectConversation,
    deleteConversation,
    clearConversations,
    currentConversation,
  };

  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  );
};

// Default export to satisfy the router
export default {
  ChatProvider,
  useChat,
  ChatContext
};
