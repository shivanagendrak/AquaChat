// Chat Thread Component
// This component displays a thread of chat messages

import React, { useEffect, useRef } from 'react';
import { FlatList, Keyboard, StyleSheet, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { ChatMessage as ChatMessageType } from '../models/chatModels';
import ChatMessageWrapper from './ChatMessageWrapper';
import ChatWelcome from './ChatWelcome';

interface ChatThreadProps {
  messages: ChatMessageType[];
  onSuggestionPress: (suggestion: string) => void;
}

const ChatThread: React.FC<ChatThreadProps> = ({ messages, onSuggestionPress }) => {
  const { theme } = useTheme();
  const flatListRef = useRef<FlatList>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  // If there are no messages, show the welcome screen
  if (messages.length === 0) {
    return <ChatWelcome onSuggestionPress={onSuggestionPress} />;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => {
          // Defensive: skip if item is not an object
          if (typeof item !== 'object' || item === null) {
            console.warn('Invalid message item:', item);
            return null;
          }
          // Check if this message is consecutive (same sender as previous message)
          const isConsecutive = index > 0 && messages[index - 1].role === item.role;

          // Check if this is an assistant message immediately following a user message
          const isAssistantAfterUser =
            index > 0 &&
            item.role === 'assistant' &&
            messages[index - 1].role === 'user';

          // Create a safe message object with all required properties explicitly defined
          // This ensures we don't pass any undefined values that could cause rendering issues
          const safeMessage = {
            role: item.role || 'user',
            content: typeof item.content === 'string' ? item.content : '',
            id: item.id || '0',
            timestamp: item.timestamp || 0,
            isLoading: Boolean(item.isLoading),
            error: item.error || null
          };

          return (
            <ChatMessageWrapper
              message={safeMessage}
              isConsecutive={isConsecutive}
              isAssistantAfterUser={isAssistantAfterUser}
            />
          );
        }}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={true}
        initialNumToRender={15}
        maxToRenderPerBatch={10}
        windowSize={10}
        removeClippedSubviews={false} // Changed to false to prevent issues with content disappearing
        scrollEnabled={true} // Explicitly enable scrolling
        bounces={true} // Enable bouncing effect for better scroll feedback
        inverted={false} // Changed to false to display messages in normal order
        onScrollBeginDrag={Keyboard.dismiss} // Dismiss keyboard when scrolling starts
        onContentSizeChange={() => {
          if (flatListRef.current && messages.length > 0) {
            flatListRef.current.scrollToEnd({ animated: true });
          }
        }}
        onLayout={() => {
          if (flatListRef.current && messages.length > 0) {
            flatListRef.current.scrollToEnd({ animated: false });
          }
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    overflow: 'visible', // Ensure content isn't clipped
  },
  listContent: {
    flexDirection: 'column', // Changed to normal column direction
    paddingTop: 6, // Further reduced top padding
    paddingBottom: 16, // Reduced bottom padding
    paddingHorizontal: 8, // Reduced horizontal padding for more space-efficient layout
    flexGrow: 1, // Allow content to grow and enable proper scrolling
  },
});

export default ChatThread;
