// Chat Message Wrapper Component
// This component wraps the ChatMessageNew component and provides the theme context

import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { ChatMessage as ChatMessageType } from '../models/chatModels';
import ChatMessageNew from './ChatMessageNew';

// Define the props interface
interface ChatMessageWrapperProps {
  message: ChatMessageType;
  isConsecutive?: boolean;
  isAssistantAfterUser?: boolean;
}

// Create a wrapper component that handles the theme context
const ChatMessageWrapper: React.FC<ChatMessageWrapperProps> = (props) => {
  // Get theme context
  const themeContext = useTheme();
  
  // Pass the theme context as props to the ChatMessageNew component
  return (
    <ChatMessageNew 
      message={props.message}
      isConsecutive={props.isConsecutive}
      isAssistantAfterUser={props.isAssistantAfterUser}
      themeContext={themeContext}
    />
  );
};

export default ChatMessageWrapper;
