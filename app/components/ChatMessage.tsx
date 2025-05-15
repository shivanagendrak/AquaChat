// Chat Message Component
// This component displays a single chat message

import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { ChatMessage as ChatMessageType } from '../models/chatModels';
import Logo from './Logo';

// Define the props interface
interface ChatMessageProps {
  message: ChatMessageType;
  isConsecutive?: boolean;
  isAssistantAfterUser?: boolean;
}

// Create a simple functional component
function ChatMessage(props: ChatMessageProps) {
  // Get theme context
  const { theme, isDarkMode } = useTheme();

  // Safely access props with fallbacks
  const message = props.message || { role: 'user', content: '', id: '0', timestamp: 0 };
  const isConsecutive = Boolean(props.isConsecutive);
  const isAssistantAfterUser = Boolean(props.isAssistantAfterUser);

  // Determine if this is a user message
  const isUser = message.role === 'user';

  // Format the message content with proper line breaks and ensure it's a string
  const formattedContent = typeof message.content === 'string' ? message.content : '';

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
            {formattedContent ? (
              <Text style={[
                styles.messageText,
                { color: isUser ? (isDarkMode ? '#F0F0F0' : '#333333') : theme.text, textAlign: isUser ? 'right' : 'left' }
              ]}>
                {formattedContent}
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
            {formattedContent}
          </Text>
        )}
      </View>
    </View>
  );
}

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
  userAvatar: {
    width: 28, // Increased size
    height: 28, // Increased size
    borderRadius: 14, // Half of width/height
    backgroundColor: '#204553',
    alignItems: 'center',
    justifyContent: 'center',
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
export default ChatMessage;
