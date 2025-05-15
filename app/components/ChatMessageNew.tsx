// New Chat Message Component
// This component displays a single chat message

import React, { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { ChatMessage as ChatMessageType } from '../models/chatModels';
import Logo from './Logo';

// Define the props interface
interface ChatMessageProps {
  message: ChatMessageType;
  isConsecutive?: boolean;
  isAssistantAfterUser?: boolean;
  themeContext?: any; // Accept theme context as a prop
}

// Create a simple functional component
const ChatMessageNew = (props: ChatMessageProps) => {
  // Use theme context from props
  const theme = props.themeContext?.theme || { primary: '#204553', text: '#333333', secondaryText: '#666666' };
  const isDarkMode = props.themeContext?.isDarkMode || false;

  // Safely access props with fallbacks
  const message = useMemo(() => props.message ? {
    role: props.message.role || 'user',
    content: typeof props.message.content === 'string' ? props.message.content : '',
    id: props.message.id || '0',
    timestamp: props.message.timestamp || 0,
    isLoading: Boolean(props.message.isLoading),
    error: props.message.error || null
  } : { role: 'user', content: '', id: '0', timestamp: 0, isLoading: false, error: null }, [props.message]);

  // Use useMemo for all derived values to avoid text rendering issues
  const isConsecutive = useMemo(() => Boolean(props.isConsecutive), [props.isConsecutive]);
  const isAssistantAfterUser = useMemo(() => Boolean(props.isAssistantAfterUser), [props.isAssistantAfterUser]);

  // Determine if this is a user message
  const isUser = useMemo(() => message.role === 'user', [message.role]);

  return (
    <View style={[
      styles.container,
      isUser ? styles.userContainer : styles.assistantContainer,
      isConsecutive && (isUser ? styles.consecutiveUserContainer : styles.consecutiveAssistantContainer),
      {
        // Apply special reduced margin for assistant messages that follow user messages
        marginTop: isConsecutive ? 2 : (isAssistantAfterUser ? 1 : 6),
      },
      // No background color for user messages
      isUser && {
        backgroundColor: 'transparent', // Transparent background for user messages
      }
    ]}>
      {/* Avatar/Icon - only for assistant messages */}
      {!isUser && (
        <View style={styles.avatarContainer}>
          {!isConsecutive ? (
            <View style={styles.assistantAvatar}>
              <Logo size={48} /> {/* Further increased logo size in API responses */}
            </View>
          ) : (
            // Empty view for consecutive messages to maintain spacing
            <View style={styles.emptyAvatar} />
          )}
        </View>
      )}

      {/* Message Content */}
      <View style={[
        styles.contentContainer,
        isUser && {
          alignSelf: 'flex-end', // Align user message container to the right
          paddingVertical: 4, // Add minimal vertical padding for user messages
          paddingHorizontal: 0, // No horizontal padding for user messages
          flex: 0, // Don't expand to fill available space
        },
        isAssistantAfterUser && { paddingTop: 0 } // Remove top padding for assistant messages that follow user messages
      ]}>
        {message.isLoading ? (
          <ActivityIndicator size="small" color={theme.primary} />
        ) : message.error ? (
          <View style={isUser && { alignItems: 'flex-end' }}>
            <Text style={[
              styles.errorText,
              { color: 'red' }
            ]}>
              <Text>Error: </Text>
              <Text>{typeof message.error === 'string' ? message.error : 'Unknown error'}</Text>
            </Text>
            {message.content ? (
              <Text style={[
                styles.messageText,
                { color: isUser ? (isDarkMode ? '#F0F0F0' : '#333333') : theme.text, textAlign: isUser ? 'right' : 'left' }
              ]}>
                {message.content}
              </Text>
            ) : (
              <Text style={[
                styles.messageText,
                { color: isUser ? (isDarkMode ? '#BBBBBB' : '#666666') : theme.secondaryText, fontStyle: 'italic', textAlign: isUser ? 'right' : 'left' }
              ]}>
                Please try again or check your API configuration in Settings.
              </Text>
            )}
          </View>
        ) : (
          <Text style={[
            styles.messageText,
            {
              color: isUser ? (isDarkMode ? '#F0F0F0' : '#333333') : '#204553', // Dark teal color for assistant messages
              textAlign: isUser ? 'right' : 'left' // Right alignment for user messages, left for assistant
            }
          ]}>
            {message.content}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 2, // Minimal padding
    marginBottom: 4, // Slightly increased bottom margin for better spacing between messages
    width: '100%',
    justifyContent: 'flex-end', // Help with right alignment for user messages
  },
  userContainer: {
    marginLeft: 'auto', // Push to the right side
    marginRight: 8, // Small right margin
    maxWidth: '70%', // Maximum width constraint
    paddingBottom: 0, // Remove bottom padding for user messages
    // Width will be determined by content
    alignSelf: 'flex-end', // Align to the right
  },
  assistantContainer: {
    marginLeft: 0, // No left margin
    marginRight: 'auto', // Push to the left side
    width: '90%', // Width to use horizontal space
    paddingLeft: 0, // No left padding
    paddingHorizontal: 12, // Add horizontal padding inside the bubble
    paddingVertical: 8, // Add vertical padding inside the bubble
    backgroundColor: 'transparent', // Transparent background
  },
  // Styles for consecutive messages
  consecutiveUserContainer: {
    marginTop: 1, // Even closer to previous message
  },
  consecutiveAssistantContainer: {
    marginTop: 1, // Even closer to previous message
  },
  // Special style for assistant messages that follow user messages could be added here if needed
  avatarContainer: {
    width: 54, // Further increased width for larger avatar
    marginRight: 8, // Margin between avatar and text
    alignItems: 'flex-start', // Align to the left
    justifyContent: 'flex-start',
  },
  assistantAvatar: {
    width: 54, // Further increased size to match larger logo
    height: 54, // Further increased size to match larger logo
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 0, // Align with left edge
    marginTop: 4, // Add some top margin to align with text
  },
  emptyAvatar: {
    width: 48,
    height: 48,
  },
  contentContainer: {
    flex: 1, // This will be overridden for user messages
    paddingVertical: 0, // No vertical padding
    paddingBottom: 0, // No bottom padding
    paddingHorizontal: 0, // No horizontal padding
  },
  messageText: {
    fontSize: 17,
    fontWeight: '400',
    lineHeight: 22,
    letterSpacing: -0.41,
    flexShrink: 1,
    paddingHorizontal: 0, // No horizontal padding
    alignSelf: 'flex-start', // Helps with dynamic width
  },
  errorText: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
    letterSpacing: -0.08,
    marginBottom: 8,
    fontStyle: 'italic',
  },
});

// Export the component
export default ChatMessageNew;
