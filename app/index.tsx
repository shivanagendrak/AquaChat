import { Ionicons, SimpleLineIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Speech from 'expo-speech';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Dimensions, Easing, FlatList, Keyboard, KeyboardAvoidingView, Platform, Pressable, SafeAreaView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from "react-native";
import Markdown from 'react-native-markdown-display';
import { ThemeProvider, useTheme } from "../components/theme";

interface Message {
  id: string;
  text: string;
  isUser: boolean;
}

interface ContentPart {
  text?: string;
  [key: string]: any;
}

async function generateResponse(prompt: string): Promise<string> {
  try {
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyDX9yToRl70aBizk0c9OpcSW_bk6vu-rK0",
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ]
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('API Error Response:', errorData);
      throw new Error(`API Error: ${response.status} ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    console.log('API Response:', data); // Debug log

    // Check if we have a valid response with content
    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      // Try to access the content directly if it's not in the expected format
      const content = data.candidates?.[0]?.content;
      if (typeof content === 'object' && content !== null) {
        // If content is an object, try to stringify it to see what we have
        console.log('Content object:', JSON.stringify(content, null, 2));
        // If it has a text property, use that
        if (content.text) {
          return content.text;
        }
        // If it has parts array, try to get text from there
        if (Array.isArray(content.parts)) {
          const textPart = content.parts.find((part: ContentPart) => part.text);
          if (textPart?.text) {
            return textPart.text;
          }
        }
      }
      console.error('Unexpected API Response Structure:', data);
      throw new Error('Invalid response format from API');
    }

    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    if (error instanceof Error) {
      return `Error: ${error.message}`;
    }
    return "Sorry, I encountered an error while processing your request.";
  }
}

// Custom solid bullet rule for Markdown
const solidBulletRule = {
  bullet_list_item: (node: any, children: any, parent: any, styles: any) => {
    console.log('Custom bullet rule hit!', node);
    return (
      <View key={node.key} style={{ flexDirection: 'row', alignItems: 'flex-start', marginVertical: 8 }}>
        <View
          style={{
            width: 30,
            height: 30,
            borderRadius: 15,
            backgroundColor: 'red',
            marginRight: 14,
          }}
        />
        <View style={{ flex: 1 }}>
          {children}
        </View>
      </View>
    );
  },
};

// Add the ThinkingText component
const ThinkingText = () => {
  const dot1Opacity = useRef(new Animated.Value(0)).current;
  const dot2Opacity = useRef(new Animated.Value(0)).current;
  const dot3Opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animateDot = (dot: Animated.Value, delay: number) => {
      return Animated.sequence([
        Animated.delay(delay),
        Animated.timing(dot, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(dot, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]);
    };

    const startAnimation = () => {
      Animated.loop(
        Animated.parallel([
          animateDot(dot1Opacity, 0),
          animateDot(dot2Opacity, 200),
          animateDot(dot3Opacity, 400),
        ])
      ).start();
    };

    startAnimation();

    return () => {
      dot1Opacity.stopAnimation();
      dot2Opacity.stopAnimation();
      dot3Opacity.stopAnimation();
    };
  }, []);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Text style={{ fontSize: 16, color: '#666' }}>Thinking</Text>
      <Animated.Text style={{ opacity: dot1Opacity, fontSize: 16, color: '#666' }}>.</Animated.Text>
      <Animated.Text style={{ opacity: dot2Opacity, fontSize: 16, color: '#666' }}>.</Animated.Text>
      <Animated.Text style={{ opacity: dot3Opacity, fontSize: 16, color: '#666' }}>.</Animated.Text>
    </View>
  );
};

// Add CustomMenuIcon component before AppContent
const CustomMenuIcon = ({ color }: { color: string }) => {
  return (
    <View style={styles.menuIconContainer}>
      <View style={[styles.menuLine, styles.menuLineBig, { backgroundColor: color }]} />
      <View style={[styles.menuLine, styles.menuLineSmall, { backgroundColor: color }]} />
    </View>
  );
};

// Add MenuPanel component before AppContent
const MenuPanel = ({ isOpen, onClose, slideAnim }: { 
  isOpen: boolean; 
  onClose: () => void; 
  slideAnim: Animated.Value;
}) => {
  const { colors } = useTheme();
  const screenWidth = Dimensions.get('window').width;
  const menuWidth = screenWidth * 0.75;

  const translateX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-menuWidth, 0],
  });

  const backdropOpacity = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.5],
  });

  return (
    <>
      <Animated.View
        pointerEvents={isOpen ? 'auto' : 'none'}
        style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          zIndex: 1000,
          backgroundColor: '#000',
          opacity: backdropOpacity,
        }}
        onTouchEnd={onClose}
      />
      <Animated.View
        style={{
          position: 'absolute',
          top: 0, left: 0, bottom: 0,
          width: menuWidth,
          zIndex: 1001,
          backgroundColor: colors.background,
          transform: [{ translateX }],
          shadowColor: '#000',
          shadowOffset: { width: 2, height: 0 },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
          elevation: 5,
        }}
      >
        <SafeAreaView style={styles.menuContent}>
          <View style={styles.menuHeader}>
            <Text style={[styles.menuTitle, { color: colors.text }]}>Menu</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <View style={styles.menuItems}>
            <TouchableOpacity style={styles.menuItem}>
              <Ionicons name="chatbubble-outline" size={20} color={colors.text} />
              <Text style={[styles.menuItemText, { color: colors.text }]}>Chat</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem}>
              <Ionicons name="settings-outline" size={20} color={colors.text} />
              <Text style={[styles.menuItemText, { color: colors.text }]}>Settings</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem}>
              <Ionicons name="help-circle-outline" size={20} color={colors.text} />
              <Text style={[styles.menuItemText, { color: colors.text }]}>Help</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Animated.View>
    </>
  );
};

function AppContent() {
  const [text, setText] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamingMessage, setStreamingMessage] = useState<string>("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const { colors, toggleTheme } = useTheme();
  const flatListRef = useRef<FlatList>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;

  const headerStyles = StyleSheet.create({
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: Platform.OS === 'ios' ? 44 : 0,
      paddingBottom: 8,
      zIndex: 1000,
    },
    menuButton: {
      padding: 8,
      height: 36,
      justifyContent: 'center',
    },
    noteButton: {
      padding: 8,
      height: 36,
      justifyContent: 'center',
    },
  });

  const screenWidth = Dimensions.get('window').width;
  const menuWidth = screenWidth * 0.75;

  const mainContentTranslateX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, menuWidth],
  });

  const streamText = (text: string) => {
    const words = text.split(/(\s+)/);
    let currentIndex = 0;
    let currentText = '';
    setIsStreaming(true);
    
    // Add an empty bot message immediately
    const tempMessage: Message = {
      id: 'streaming-' + Date.now().toString(),
      text: '',
      isUser: false
    };
    setMessages(prev => [...prev, tempMessage]);

    const streamInterval = setInterval(() => {
      if (currentIndex < words.length) {
        currentText += words[currentIndex];
        // Update the last message in the array with the current text
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = {
            ...newMessages[newMessages.length - 1],
            text: currentText
          };
          return newMessages;
        });
        currentIndex++;
      } else {
        clearInterval(streamInterval);
        setIsStreaming(false);
        // Update the final message with the complete text
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = {
            ...newMessages[newMessages.length - 1],
            id: Date.now().toString(),
            text: text
          };
          return newMessages;
        });
      }
    }, 30);
  };

  const handleSubmit = async () => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: text.trim(),
      isUser: true
    };

    // Add a temporary loading message with ThinkingText
    const loadingMessage: Message = {
      id: 'loading-' + Date.now().toString(),
      text: "thinking", // Special text to indicate we should show ThinkingText
      isUser: false
    };

    setMessages(prev => [...prev, userMessage, loadingMessage]);
    setText("");
    setIsLoading(true);
    setError(null);

    try {
      const response = await generateResponse(text.trim());
      
      if (response.startsWith('Error:')) {
        setError(response);
        // Replace loading message with error
        setMessages(prev => prev.map(msg => 
          msg.id === loadingMessage.id 
            ? { ...msg, text: response }
            : msg
        ));
      } else {
        // Replace loading message with actual response
        setMessages(prev => prev.map(msg => 
          msg.id === loadingMessage.id 
            ? { ...msg, text: '' }
            : msg
        ));
        // Stream the response
        const words = response.split(/(\s+)/);
        let currentIndex = 0;
        let currentText = '';
        setIsStreaming(true);
        
        const streamInterval = setInterval(() => {
          if (currentIndex < words.length) {
            currentText += words[currentIndex];
            // Update the loading message with the current text
            setMessages(prev => prev.map(msg => 
              msg.id === loadingMessage.id 
                ? { ...msg, text: currentText }
                : msg
            ));
            currentIndex++;
          } else {
            clearInterval(streamInterval);
            setIsStreaming(false);
            // Update the final message with the complete text
            setMessages(prev => prev.map(msg => 
              msg.id === loadingMessage.id 
                ? { ...msg, text: response, id: Date.now().toString() }
                : msg
            ));
          }
        }, 30);
      }
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
      setError(errorMessage);
      // Replace loading message with error
      setMessages(prev => prev.map(msg => 
        msg.id === loadingMessage.id 
          ? { ...msg, text: errorMessage }
          : msg
      ));
    } finally {
      setIsLoading(false);
    }
  };

  // Add handlers for copy, retry, and speak
  const handleCopy = (text: string) => {
    Clipboard.setStringAsync(text);
  };

  const handleRetry = async (item: Message) => {
    if (!item.isUser && !item.text.startsWith('Error:')) {
      const idx = messages.findIndex(m => m.id === item.id);
      if (idx > 0) {
        let userMessageText = '';
        for (let i = idx - 1; i >= 0; i--) {
          if (messages[i].isUser) {
            userMessageText = messages[i].text;
            break;
          }
        }

        if (userMessageText) {
          setIsLoading(true);
          setError(null);

          // First show loading message with ThinkingText
          setMessages(prev => prev.map(msg => 
            msg.id === item.id 
              ? { ...msg, text: "thinking" } // Special text to indicate we should show ThinkingText
              : msg
          ));

          try {
            const response = await generateResponse(userMessageText);
            
            if (response.startsWith('Error:')) {
              setError(response);
              setMessages(prev => prev.map(msg => 
                msg.id === item.id 
                  ? { ...msg, text: response }
                  : msg
              ));
            } else {
              // Start streaming the response
              const words = response.split(/(\s+)/);
              let currentIndex = 0;
              let currentText = '';
              setIsStreaming(true);
              
              const streamInterval = setInterval(() => {
                if (currentIndex < words.length) {
                  currentText += words[currentIndex];
                  setMessages(prev => prev.map(msg => 
                    msg.id === item.id 
                      ? { ...msg, text: currentText }
                      : msg
                  ));
                  currentIndex++;
                } else {
                  clearInterval(streamInterval);
                  setIsStreaming(false);
                  setMessages(prev => prev.map(msg => 
                    msg.id === item.id 
                      ? { ...msg, text: response }
                      : msg
                  ));
                }
              }, 30);
            }
          } catch (error) {
            console.error('Error in handleRetry:', error);
            const errorText = error instanceof Error ? error.message : "An unexpected error occurred";
            setError(errorText);
            setMessages(prev => prev.map(msg => 
              msg.id === item.id 
                ? { ...msg, text: errorText }
                : msg
            ));
          } finally {
            setIsLoading(false);
          }
        }
      }
    }
  };

  const handleSpeak = (text: string) => {
    if (isSpeaking) {
      // If currently speaking, stop it
      Speech.stop();
      setIsSpeaking(false);
    } else {
      // If not speaking, start it
      Speech.speak(text, {
        onStart: () => setIsSpeaking(true),
        onDone: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false)
      });
    }
  };

  const toggleMenu = () => {
    const toValue = isMenuOpen ? 0 : 1;
    Animated.timing(slideAnim, {
      toValue,
      useNativeDriver: true,
      duration: 250,
      easing: Easing.bezier(0.4, 0.0, 0.2, 1),
    }).start();
    setIsMenuOpen(!isMenuOpen);
  };

  const renderMessage = ({ item, index }: { item: Message, index: number }) => {
    // Determine if this is the last message and is currently streaming
    const isLastBotMessage =
      !item.isUser &&
      index === messages.length - 1 &&
      isStreaming &&
      item.id.startsWith('streaming-');

    return (
      <View style={[
        styles.messageContainer,
        item.isUser ? styles.userMessage : styles.botMessage,
        {
          backgroundColor: item.isUser
            ? colors.inputBackground
            : item.text.startsWith('Error:')
              ? '#ffebee'
              : 'transparent'
        }
      ]}>
        {item.isUser ? (
          <Markdown
            style={{
              body: {
                color: item.text.startsWith('Error:') ? '#d32f2f' : colors.text,
                fontSize: 16,
                lineHeight: 24,
                fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Roboto',
                paddingRight: 0,
                paddingLeft: 0,
              },
              heading1: {
                fontSize: 28,
                fontWeight: '700',
                marginVertical: 20,
                fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'Roboto',
                color: colors.text,
                letterSpacing: -0.5,
              },
              heading2: {
                fontSize: 24,
                fontWeight: '700',
                marginVertical: 18,
                fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'Roboto',
                color: colors.text,
                letterSpacing: -0.3,
              },
              heading3: {
                fontSize: 20,
                fontWeight: '600',
                marginVertical: 16,
                fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'Roboto',
                color: colors.text,
                letterSpacing: -0.2,
              },
              heading4: {
                fontSize: 18,
                fontWeight: '600',
                marginVertical: 14,
                fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'Roboto',
                color: colors.text,
              },
              heading5: {
                fontSize: 16,
                fontWeight: '600',
                marginVertical: 12,
                fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'Roboto',
                color: colors.text,
              },
              heading6: {
                fontSize: 15,
                fontWeight: '600',
                marginVertical: 10,
                fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'Roboto',
                color: colors.text,
              },
              strong: {
                fontWeight: '700',
                color: colors.text,
              },
              em: {
                fontStyle: 'italic',
                color: colors.text,
              },
              s: {
                textDecorationLine: 'line-through',
                color: colors.text + '80',
              },
              u: {
                textDecorationLine: 'underline',
                color: colors.text,
              },
              blockquote: {
                borderLeftWidth: 4,
                borderLeftColor: colors.background === '#fff' ? '#0066CC' : '#66B3FF',
                paddingLeft: 16,
                marginVertical: 12,
                fontStyle: 'italic',
                color: colors.text + 'CC',
                backgroundColor: colors.background === '#fff' ? 'rgba(0, 102, 204, 0.05)' : 'rgba(102, 179, 255, 0.05)',
                paddingVertical: 8,
                paddingRight: 12,
                borderRadius: 4,
              },
              code_inline: { 
                backgroundColor: colors.background === '#fff' ? '#f5f5f5' : '#2a2a2a',
                color: colors.background === '#fff' ? '#0066CC' : '#66B3FF',
                padding: 4,
                paddingHorizontal: 6,
                borderRadius: 4,
                fontFamily: Platform.OS === 'ios' ? 'SF Mono' : 'Roboto Mono',
                fontSize: 14,
                lineHeight: 20,
              },
              code_block: {
                backgroundColor: colors.background === '#fff' ? '#f8f9fa' : '#1a1a1a',
                color: colors.background === '#fff' ? '#0066CC' : '#66B3FF',
                padding: 16,
                borderRadius: 8,
                fontFamily: Platform.OS === 'ios' ? 'SF Mono' : 'Roboto Mono',
                fontSize: 14,
                lineHeight: 20,
                marginVertical: 12,
                borderWidth: 1,
                borderColor: colors.background === '#fff' ? '#e0e0e0' : '#404040',
              },
              fence: {
                backgroundColor: colors.background === '#fff' ? '#f8f9fa' : '#1a1a1a',
                color: colors.background === '#fff' ? '#0066CC' : '#66B3FF',
                padding: 16,
                borderRadius: 8,
                fontFamily: Platform.OS === 'ios' ? 'SF Mono' : 'Roboto Mono',
                fontSize: 14,
                lineHeight: 20,
                marginVertical: 12,
                borderWidth: 1,
                borderColor: colors.background === '#fff' ? '#e0e0e0' : '#404040',
              },
              bullet_list: {
                marginVertical: 12,
                paddingLeft: 0,
                width: '100%',
              },
              ordered_list: {
                marginVertical: 12,
                paddingLeft: 0,
                width: '100%',
              },
              list_item: {
                marginVertical: 8,
                fontSize: 16,
                lineHeight: 24,
                fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Roboto',
                width: '100%',
              },
              bullet_list_item: {
                flexDirection: 'row',
                alignItems: 'flex-start',
                marginVertical: 8,
                paddingRight: 8,
                width: '100%',
              },
              bullet_list_item_content: {
                flex: 1,
                fontSize: 16,
                lineHeight: 24,
                fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Roboto',
                paddingLeft: 12,
              },
              bullet_list_item_bullet: {
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: colors.background === '#fff' ? '#0066CC' : '#66B3FF',
                marginTop: 9,
                marginRight: 12,
              },
              ordered_list_item: {
                flexDirection: 'row',
                alignItems: 'flex-start',
                marginVertical: 8,
                paddingRight: 8,
                width: '100%',
              },
              ordered_list_item_content: {
                flex: 1,
                fontSize: 16,
                lineHeight: 24,
                fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Roboto',
                paddingLeft: 12,
              },
              ordered_list_item_number: {
                fontSize: 16,
                lineHeight: 24,
                marginRight: 8,
                color: colors.background === '#fff' ? '#0066CC' : '#66B3FF',
                fontWeight: '600',
                minWidth: 24,
                textAlign: 'right',
              },
              task_list_item: {
                flexDirection: 'row',
                alignItems: 'center',
                marginVertical: 8,
                paddingRight: 8,
                width: '100%',
              },
              task_list_item_checkbox: {
                width: 20,
                height: 20,
                borderRadius: 4,
                borderWidth: 2,
                borderColor: colors.background === '#fff' ? '#0066CC' : '#66B3FF',
                marginRight: 12,
                marginTop: 2,
              },
              task_list_item_checked: {
                backgroundColor: colors.background === '#fff' ? '#0066CC' : '#66B3FF',
              },
              link: {
                color: colors.background === '#fff' ? '#0066CC' : '#66B3FF',
                textDecorationLine: 'underline',
                fontWeight: '500',
              },
              hr: {
                backgroundColor: colors.background === '#fff' ? '#e0e0e0' : '#404040',
                height: 1,
                marginVertical: 20,
                borderRadius: 1,
              },
              paragraph: {
                marginVertical: 12,
                fontSize: 16,
                lineHeight: 24,
                fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Roboto',
                color: colors.text,
              },
              details: {
                marginVertical: 12,
                padding: 12,
                backgroundColor: colors.background === '#fff' ? '#f8f9fa' : '#1a1a1a',
                borderRadius: 8,
                borderWidth: 1,
                borderColor: colors.background === '#fff' ? '#e0e0e0' : '#404040',
              },
              details_summary: {
                fontWeight: '600',
                color: colors.background === '#fff' ? '#0066CC' : '#66B3FF',
                marginBottom: 8,
              },
              image: {
                borderRadius: 8,
                marginVertical: 12,
              },
              table: { 
                marginVertical: 40,
                borderWidth: 1,
                borderColor: colors.background === '#fff' ? '#e8e8e8' : 'rgba(255, 255, 255, 0.08)',
                borderRadius: 20,
                overflow: 'hidden',
                backgroundColor: colors.background === '#fff' ? '#ffffff' : '#1a1a1a',
                ...Platform.select({
                  ios: {
                    shadowColor: colors.background === '#fff' ? '#000' : '#fff',
                    shadowOffset: { width: 0, height: 16 },
                    shadowOpacity: 0.08,
                    shadowRadius: 32,
                  },
                  android: {
                    elevation: 8,
                  },
                }),
              },
              thead: {
                backgroundColor: colors.background === '#fff' 
                  ? '#fafafa'
                  : '#1f1f1f',
                borderBottomWidth: 1,
                borderBottomColor: colors.background === '#fff' ? '#e8e8e8' : 'rgba(255, 255, 255, 0.08)',
              },
              th: { 
                color: colors.background === '#fff' ? '#1a1a1a' : '#ffffff',
                fontWeight: '600',
                fontSize: 14,
                padding: 28,
                paddingVertical: 24,
                borderRightWidth: 0,
                backgroundColor: 'transparent',
                fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'Roboto',
                textAlign: 'left',
                letterSpacing: 0.2,
                textTransform: 'uppercase',
              },
              th_first: {
                paddingLeft: 32,
              },
              th_last: {
                paddingRight: 32,
              },
              tr: { 
                borderBottomWidth: 1,
                borderBottomColor: colors.background === '#fff' ? '#e8e8e8' : 'rgba(255, 255, 255, 0.08)',
                backgroundColor: 'transparent',
              },
              tr_last: {
                borderBottomWidth: 0,
              },
              tr_even: {
                backgroundColor: colors.background === '#fff' 
                  ? '#fafafa'
                  : '#1f1f1f',
              },
              tr_odd: {
                backgroundColor: colors.background === '#fff'
                  ? '#ffffff'
                  : '#1a1a1a',
              },
              tr_hover: {
                backgroundColor: colors.background === '#fff'
                  ? '#f5f5f5'
                  : '#252525',
              },
              td: { 
                color: colors.text,
                padding: 28,
                paddingVertical: 24,
                fontSize: 15,
                backgroundColor: 'transparent',
                borderRightWidth: 0,
                fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Roboto',
                lineHeight: 24,
                letterSpacing: 0.1,
              },
              td_first: {
                fontWeight: '500',
                paddingLeft: 32,
                color: colors.background === '#fff' ? '#1a1a1a' : '#ffffff',
              },
              td_last: {
                paddingRight: 32,
              },
              table_wrapper: {
                marginHorizontal: -16,
                paddingHorizontal: 16,
              },
              table_container: {
                backgroundColor: colors.background === '#fff' ? '#ffffff' : '#1a1a1a',
                padding: 24,
                borderRadius: 24,
                marginVertical: 16,
              },
            }}
            rules={solidBulletRule}
          >
            {item.text}
          </Markdown>
        ) : (
          <>
            {item.text === "thinking" ? (
              <ThinkingText />
            ) : (
              <View style={styles.botMessageContent}>
                <Markdown
                  style={{
                    body: {
                      color: item.text.startsWith('Error:') ? '#d32f2f' : colors.text,
                      fontSize: 16,
                      lineHeight: 24,
                      fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Roboto',
                      paddingRight: 0,
                      paddingLeft: 0,
                    },
                    heading1: {
                      fontSize: 28,
                      fontWeight: '700',
                      marginVertical: 20,
                      fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'Roboto',
                      color: colors.text,
                      letterSpacing: -0.5,
                    },
                    heading2: {
                      fontSize: 24,
                      fontWeight: '700',
                      marginVertical: 18,
                      fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'Roboto',
                      color: colors.text,
                      letterSpacing: -0.3,
                    },
                    heading3: {
                      fontSize: 20,
                      fontWeight: '600',
                      marginVertical: 16,
                      fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'Roboto',
                      color: colors.text,
                      letterSpacing: -0.2,
                    },
                    heading4: {
                      fontSize: 18,
                      fontWeight: '600',
                      marginVertical: 14,
                      fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'Roboto',
                      color: colors.text,
                    },
                    heading5: {
                      fontSize: 16,
                      fontWeight: '600',
                      marginVertical: 12,
                      fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'Roboto',
                      color: colors.text,
                    },
                    heading6: {
                      fontSize: 15,
                      fontWeight: '600',
                      marginVertical: 10,
                      fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'Roboto',
                      color: colors.text,
                    },
                    strong: {
                      fontWeight: '700',
                      color: colors.text,
                    },
                    em: {
                      fontStyle: 'italic',
                      color: colors.text,
                    },
                    s: {
                      textDecorationLine: 'line-through',
                      color: colors.text + '80',
                    },
                    u: {
                      textDecorationLine: 'underline',
                      color: colors.text,
                    },
                    blockquote: {
                      borderLeftWidth: 4,
                      borderLeftColor: colors.background === '#fff' ? '#0066CC' : '#66B3FF',
                      paddingLeft: 16,
                      marginVertical: 12,
                      fontStyle: 'italic',
                      color: colors.text + 'CC',
                      backgroundColor: colors.background === '#fff' ? 'rgba(0, 102, 204, 0.05)' : 'rgba(102, 179, 255, 0.05)',
                      paddingVertical: 8,
                      paddingRight: 12,
                      borderRadius: 4,
                    },
                    code_inline: { 
                      backgroundColor: colors.background === '#fff' ? '#f5f5f5' : '#2a2a2a',
                      color: colors.background === '#fff' ? '#0066CC' : '#66B3FF',
                      padding: 4,
                      paddingHorizontal: 6,
                      borderRadius: 4,
                      fontFamily: Platform.OS === 'ios' ? 'SF Mono' : 'Roboto Mono',
                      fontSize: 14,
                      lineHeight: 20,
                    },
                    code_block: {
                      backgroundColor: colors.background === '#fff' ? '#f8f9fa' : '#1a1a1a',
                      color: colors.background === '#fff' ? '#0066CC' : '#66B3FF',
                      padding: 16,
                      borderRadius: 8,
                      fontFamily: Platform.OS === 'ios' ? 'SF Mono' : 'Roboto Mono',
                      fontSize: 14,
                      lineHeight: 20,
                      marginVertical: 12,
                      borderWidth: 1,
                      borderColor: colors.background === '#fff' ? '#e0e0e0' : '#404040',
                    },
                    fence: {
                      backgroundColor: colors.background === '#fff' ? '#f8f9fa' : '#1a1a1a',
                      color: colors.background === '#fff' ? '#0066CC' : '#66B3FF',
                      padding: 16,
                      borderRadius: 8,
                      fontFamily: Platform.OS === 'ios' ? 'SF Mono' : 'Roboto Mono',
                      fontSize: 14,
                      lineHeight: 20,
                      marginVertical: 12,
                      borderWidth: 1,
                      borderColor: colors.background === '#fff' ? '#e0e0e0' : '#404040',
                    },
                    bullet_list: {
                      marginVertical: 12,
                      paddingLeft: 0,
                      width: '100%',
                    },
                    ordered_list: {
                      marginVertical: 12,
                      paddingLeft: 0,
                      width: '100%',
                    },
                    list_item: {
                      marginVertical: 8,
                      fontSize: 16,
                      lineHeight: 24,
                      fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Roboto',
                      width: '100%',
                    },
                    bullet_list_item: {
                      flexDirection: 'row',
                      alignItems: 'flex-start',
                      marginVertical: 8,
                      paddingRight: 8,
                      width: '100%',
                    },
                    bullet_list_item_content: {
                      flex: 1,
                      fontSize: 16,
                      lineHeight: 24,
                      fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Roboto',
                      paddingLeft: 12,
                    },
                    bullet_list_item_bullet: {
                      width: 6,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: colors.background === '#fff' ? '#0066CC' : '#66B3FF',
                      marginTop: 9,
                      marginRight: 12,
                    },
                    ordered_list_item: {
                      flexDirection: 'row',
                      alignItems: 'flex-start',
                      marginVertical: 8,
                      paddingRight: 8,
                      width: '100%',
                    },
                    ordered_list_item_content: {
                      flex: 1,
                      fontSize: 16,
                      lineHeight: 24,
                      fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Roboto',
                      paddingLeft: 12,
                    },
                    ordered_list_item_number: {
                      fontSize: 16,
                      lineHeight: 24,
                      marginRight: 8,
                      color: colors.background === '#fff' ? '#0066CC' : '#66B3FF',
                      fontWeight: '600',
                      minWidth: 24,
                      textAlign: 'right',
                    },
                    task_list_item: {
                      flexDirection: 'row',
                      alignItems: 'center',
                      marginVertical: 8,
                      paddingRight: 8,
                      width: '100%',
                    },
                    task_list_item_checkbox: {
                      width: 20,
                      height: 20,
                      borderRadius: 4,
                      borderWidth: 2,
                      borderColor: colors.background === '#fff' ? '#0066CC' : '#66B3FF',
                      marginRight: 12,
                      marginTop: 2,
                    },
                    task_list_item_checked: {
                      backgroundColor: colors.background === '#fff' ? '#0066CC' : '#66B3FF',
                    },
                    link: {
                      color: colors.background === '#fff' ? '#0066CC' : '#66B3FF',
                      textDecorationLine: 'underline',
                      fontWeight: '500',
                    },
                    hr: {
                      backgroundColor: colors.background === '#fff' ? '#e0e0e0' : '#404040',
                      height: 1,
                      marginVertical: 20,
                      borderRadius: 1,
                    },
                    paragraph: {
                      marginVertical: 12,
                      fontSize: 16,
                      lineHeight: 24,
                      fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Roboto',
                      color: colors.text,
                    },
                    details: {
                      marginVertical: 12,
                      padding: 12,
                      backgroundColor: colors.background === '#fff' ? '#f8f9fa' : '#1a1a1a',
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: colors.background === '#fff' ? '#e0e0e0' : '#404040',
                    },
                    details_summary: {
                      fontWeight: '600',
                      color: colors.background === '#fff' ? '#0066CC' : '#66B3FF',
                      marginBottom: 8,
                    },
                    image: {
                      borderRadius: 8,
                      marginVertical: 12,
                    },
                    table: { 
                      marginVertical: 40,
                      borderWidth: 1,
                      borderColor: colors.background === '#fff' ? '#e8e8e8' : 'rgba(255, 255, 255, 0.08)',
                      borderRadius: 20,
                      overflow: 'hidden',
                      backgroundColor: colors.background === '#fff' ? '#ffffff' : '#1a1a1a',
                      ...Platform.select({
                        ios: {
                          shadowColor: colors.background === '#fff' ? '#000' : '#fff',
                          shadowOffset: { width: 0, height: 16 },
                          shadowOpacity: 0.08,
                          shadowRadius: 32,
                        },
                        android: {
                          elevation: 8,
                        },
                      }),
                    },
                    thead: {
                      backgroundColor: colors.background === '#fff' 
                        ? '#fafafa'
                        : '#1f1f1f',
                      borderBottomWidth: 1,
                      borderBottomColor: colors.background === '#fff' ? '#e8e8e8' : 'rgba(255, 255, 255, 0.08)',
                    },
                    th: { 
                      color: colors.background === '#fff' ? '#1a1a1a' : '#ffffff',
                      fontWeight: '600',
                      fontSize: 14,
                      padding: 28,
                      paddingVertical: 24,
                      borderRightWidth: 0,
                      backgroundColor: 'transparent',
                      fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'Roboto',
                      textAlign: 'left',
                      letterSpacing: 0.2,
                      textTransform: 'uppercase',
                    },
                    th_first: {
                      paddingLeft: 32,
                    },
                    th_last: {
                      paddingRight: 32,
                    },
                    tr: { 
                      borderBottomWidth: 1,
                      borderBottomColor: colors.background === '#fff' ? '#e8e8e8' : 'rgba(255, 255, 255, 0.08)',
                      backgroundColor: 'transparent',
                    },
                    tr_last: {
                      borderBottomWidth: 0,
                    },
                    tr_even: {
                      backgroundColor: colors.background === '#fff' 
                        ? '#fafafa'
                        : '#1f1f1f',
                    },
                    tr_odd: {
                      backgroundColor: colors.background === '#fff'
                        ? '#ffffff'
                        : '#1a1a1a',
                    },
                    tr_hover: {
                      backgroundColor: colors.background === '#fff'
                        ? '#f5f5f5'
                        : '#252525',
                    },
                    td: { 
                      color: colors.text,
                      padding: 28,
                      paddingVertical: 24,
                      fontSize: 15,
                      backgroundColor: 'transparent',
                      borderRightWidth: 0,
                      fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Roboto',
                      lineHeight: 24,
                      letterSpacing: 0.1,
                    },
                    td_first: {
                      fontWeight: '500',
                      paddingLeft: 32,
                      color: colors.background === '#fff' ? '#1a1a1a' : '#ffffff',
                    },
                    td_last: {
                      paddingRight: 32,
                    },
                    table_wrapper: {
                      marginHorizontal: -16,
                      paddingHorizontal: 16,
                    },
                    table_container: {
                      backgroundColor: colors.background === '#fff' ? '#ffffff' : '#1a1a1a',
                      padding: 24,
                      borderRadius: 24,
                      marginVertical: 16,
                    },
                  }}
                  rules={solidBulletRule}
                >
                  {item.text}
                </Markdown>
                {/* Icon row below message (only for bot messages and not while streaming) */}
                {!isLastBotMessage && item.text !== "thinking" && (
                  <View style={styles.actionIconsContainer}>
                    {/* Copy Icon */}
                    <Pressable
                      onPress={() => handleCopy(item.text)}
                      style={({ pressed, hovered }) => ([
                        styles.actionIcon,
                        pressed ? { opacity: 0.7, transform: [{ scale: 0.85 }] } : {},
                        Platform.OS === 'web' && hovered ? { opacity: 0.8, transform: [{ scale: 1.15 }] } : { opacity: 1, transform: [{ scale: 1 }] }
                      ])}
                    >
                      <Ionicons name="copy-outline" size={18} color={colors.text} />
                    </Pressable>
                    {/* Retry Icon (only for bot messages) */}
                    {!item.text.startsWith('Error:') && (
                      <Pressable
                        onPress={() => handleRetry(item)}
                        style={({ pressed, hovered }) => ([
                          styles.actionIcon,
                          pressed ? { opacity: 0.7, transform: [{ scale: 0.85 }] } : {},
                          Platform.OS === 'web' && hovered ? { opacity: 0.8, transform: [{ scale: 1.15 }] } : { opacity: 1, transform: [{ scale: 1 }] }
                        ])}
                      >
                        <Ionicons name="refresh-outline" size={18} color={colors.text} />
                      </Pressable>
                    )}
                    {/* Text-to-Speech Icon */}
                    <Pressable
                      onPress={() => handleSpeak(item.text)}
                      style={({ pressed, hovered }) => ([
                        styles.actionIcon,
                        pressed ? { opacity: 0.7, transform: [{ scale: 0.85 }] } : {},
                        Platform.OS === 'web' && hovered ? { opacity: 0.8, transform: [{ scale: 1.15 }] } : { opacity: 1, transform: [{ scale: 1 }] }
                      ])}
                    >
                      <Ionicons 
                        name={isSpeaking ? "stop-circle-outline" : "volume-high-outline"} 
                        size={18} 
                        color={colors.text} 
                      />
                    </Pressable>
                  </View>
                )}
              </View>
            )}
          </>
        )}
      </View>
    );
  };

  const scrollToBottom = () => {
    if (flatListRef.current && messages.length > 0) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  };

  // Add useEffect to scroll when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <>
      <View style={[headerStyles.header, { backgroundColor: colors.background }]}>
        <TouchableOpacity style={headerStyles.menuButton} onPress={toggleMenu}>
          <CustomMenuIcon color={colors.text} />
        </TouchableOpacity>
        <View style={headerStyles.noteButton}>
          <SimpleLineIcons 
            name="note" 
            size={18} 
            color={colors.text} 
          />
        </View>
      </View>
      <MenuPanel 
        isOpen={isMenuOpen} 
        onClose={toggleMenu} 
        slideAnim={slideAnim}
      />
      <Animated.View 
        style={[
          styles.mainContent,
          {
            transform: [{ translateX: mainContentTranslateX }],
            backgroundColor: colors.background,
          }
        ]}
      >
        <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
          <StatusBar
            barStyle={colors.background === '#fff' ? "dark-content" : "light-content"}
            backgroundColor={colors.background}
          />
          <View style={[styles.mainContainer, { backgroundColor: colors.background }]}>
            <View style={{ flex: 1, minHeight: 0 }}>
              <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={({ item, index }) => renderMessage({ item, index })}
                keyExtractor={item => item.id}
                contentContainerStyle={{
                  flexGrow: 1,
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  paddingBottom: 48,
                }}
                onContentSizeChange={scrollToBottom}
                onLayout={scrollToBottom}
                maintainVisibleContentPosition={{
                  minIndexForVisible: 0,
                  autoscrollToTopThreshold: 10
                }}
              />
            </View>

            <KeyboardAvoidingView 
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
            >
              <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={[styles.inputContainer, { backgroundColor: colors.background }]}>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: colors.inputBackground,
                          color: colors.inputText,
                          paddingRight: 48,
                        }
                      ]}
                      placeholder="Ask anything on Aquaculture"
                      placeholderTextColor={colors.placeholderText}
                      multiline
                      value={text}
                      onChangeText={setText}
                      textAlignVertical="top"
                      blurOnSubmit={false}
                    />
                    {text.trim().length > 0 && !isLoading && (
                      <TouchableOpacity 
                        style={styles.submitButton}
                        onPress={handleSubmit}
                      >
                        <Ionicons 
                          name="arrow-up-circle-sharp" 
                          size={32} 
                          color={colors.text} 
                        />
                      </TouchableOpacity>
                    )}
                    {isLoading && (
                      <View style={styles.submitButton}>
                        <ActivityIndicator color={colors.text} />
                      </View>
                    )}
                    {text.trim().length === 0 && !isLoading && (
                      <TouchableOpacity 
                        style={styles.submitButton}
                        disabled={true}
                      >
                        <Ionicons 
                          name="arrow-up-circle-outline" 
                          size={32} 
                          color={colors.placeholderText} 
                        />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
          </View>
        </SafeAreaView>
      </Animated.View>
    </>
  );
}

export default function Index() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  mainContainer: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: 'transparent',
  },
  chatArea: {
    flex: 1,
    minHeight: 0,
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  container: {
    flex: 1,
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === "ios" ? 8 : 16,
    paddingTop: 8,
  },
  inputWrapper: {
    position: "relative",
    width: "100%",
  },
  input: {
    width: "100%",
    borderRadius: 32,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 15,
    minHeight: 44,
    maxHeight: 130,
  },
  submitButton: {
    position: 'absolute',
    right: 8,
    bottom: 3,
    padding: 4,
  },
  messagesListContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  messageContainer: {
    maxWidth: '100%',
    paddingVertical: 0,
    paddingHorizontal: 8,
    borderRadius: 100,
    marginVertical: 0,
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  userMessage: {
    alignSelf: 'flex-end',
    marginRight: 0,
    paddingRight: 12,
    paddingLeft: 12,
    maxWidth: '80%',
    paddingTop: 8,
    paddingBottom: 8,
    borderRadius: 22,
    backgroundColor: '#0066CC',
    color: '#fff',
    marginTop: 16,
  },
  botMessage: {
    alignSelf: 'flex-start',
    marginLeft: 0,
    paddingLeft: 4,
    maxWidth: '100%',
    width: 'auto',
    minWidth: 'auto',
    paddingTop: 0,
    paddingBottom: 0,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 4,
    marginHorizontal: 0,
  },
  botMessageContent: {
    flex: 1,
    paddingTop: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  actionIconsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginTop: 6,
    marginLeft: 0,
    gap: 6,
  },
  actionIcon: {
    padding: 4,
  },
  menuIconContainer: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: 5,
  },
  menuLine: {
    height: 2,
    borderRadius: 2,
  },
  menuLineBig: {
    width: 20,
  },
  menuLineSmall: {
    width: 12,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  menuPanel: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    zIndex: 1001,
    shadowColor: '#000',
    shadowOffset: {
      width: 2,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  menuContent: {
    flex: 1,
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  menuTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  menuItems: {
    paddingTop: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  menuItemText: {
    fontSize: 16,
  },
  mainContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
});
