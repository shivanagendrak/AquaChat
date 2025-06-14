import Anthropic from '@anthropic-ai/sdk';
import { Ionicons, MaterialCommunityIcons, MaterialIcons, SimpleLineIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import * as Clipboard from 'expo-clipboard';
import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system';
import { useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, FlatList, Image, KeyboardAvoidingView, Linking, Modal, Platform, Pressable, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import Markdown from 'react-native-markdown-display';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import SplashScreen from "../components/SplashScreen";
import { ThemeProvider, useTheme } from "../components/theme";
import { TranslationProvider, useAppTranslation } from '../hooks/useAppTranslation';
import { Language } from "../i18n";

// Initialize Anthropic client with API key from environment
const anthropic = new Anthropic({
  apiKey: Constants.expoConfig?.extra?.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY,
});

// Define language options
const languageOptions: { code: Language; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'zh', label: '中文' },
  { code: 'ja', label: '日本語' },
  { code: 'de', label: 'Deutsch' },
  { code: 'pt', label: 'Português' },
  { code: 'id', label: 'Bahasa' },
  { code: 'tl', label: 'Tagalog' },
  { code: 'it', label: 'Italiano' },
];

interface Message {
  id: string;
  text: string;
  isUser: boolean;
}

interface ContentPart {
  text?: string;
  [key: string]: any;
}

interface Chat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

async function generateResponse(prompt: string, language: string): Promise<string> {
  try {
    const response = await anthropic.messages.create({
      model: "claude-3-7-sonnet-20250219", // Using the latest Claude 3.7 Sonnet model
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `Please respond in ${language}. ${prompt}`
        }
      ]
    });

    // Type guard to check if the content is a text block
    const content = response.content[0];
    if (!content || content.type !== 'text') {
      console.error('Unexpected API Response Structure:', response);
      throw new Error('Invalid response format from API');
    }

    return content.text;
  } catch (error) {
    console.error('Error calling Claude API:', error);
    if (error instanceof Error) {
      return `Error: ${error.message}`;
    }
    return "Sorry, I encountered an error while processing your request.";
  }
}

// Simple cache for TTS audio files
const ttsCache = new Map<string, string>();

// ElevenLabs Text-to-Speech function
async function generateElevenLabsSpeech(text: string): Promise<string | null> {
  // Check cache first
  const cacheKey = text.slice(0, 100); // Use first 100 chars as cache key
  if (ttsCache.has(cacheKey)) {
    const cachedUri = ttsCache.get(cacheKey)!;
    // Check if file still exists
    try {
      const fileInfo = await FileSystem.getInfoAsync(cachedUri);
      if (fileInfo.exists) {
        return cachedUri;
      } else {
        ttsCache.delete(cacheKey);
      }
    } catch (error) {
      ttsCache.delete(cacheKey);
    }
  }
  try {
    // You'll need to get your ElevenLabs API key from https://elevenlabs.io/
    const ELEVENLABS_API_KEY = Constants.expoConfig?.extra?.ELEVENLABS_API_KEY || process.env.ELEVENLABS_API_KEY;
    
    if (!ELEVENLABS_API_KEY) {
      console.warn('ElevenLabs API key not found, falling back to system TTS');
      return null;
    }

    // Using Rachel voice (you can change this to any voice ID you prefer)
    const VOICE_ID = "21m00Tcm4TlvDq8ikWAM"; // Rachel voice
    
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY,
      },
      body: JSON.stringify({
        text: text,
        model_id: "eleven_monolingual_v1",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5,
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    // Save audio to temporary file
    const fileName = `elevenlabs_${Date.now()}.mp3`;
    const fileUri = FileSystem.documentDirectory + fileName;
    
    // Get the audio data as ArrayBuffer
    const audioBuffer = await response.arrayBuffer();
    
    // Convert ArrayBuffer to Uint8Array and then to base64 string
    const uint8Array = new Uint8Array(audioBuffer);
    const binaryString = uint8Array.reduce((data, byte) => data + String.fromCharCode(byte), '');
    const base64Audio = btoa(binaryString);
    
    // Write the file
    await FileSystem.writeAsStringAsync(fileUri, base64Audio, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    // Cache the file URI
    ttsCache.set(cacheKey, fileUri);
    
    return fileUri;
  } catch (error) {
    console.error('Error generating ElevenLabs speech:', error);
    return null;
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

// Add the LoadingDot component for TTS loading
const LoadingDot = ({ color }: { color: string }) => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  const animate = useCallback(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [opacity]);

  useEffect(() => {
    animate();
    return () => {
      opacity.stopAnimation();
    };
  }, [animate, opacity]);

  return (
    <View style={styles.loadingSpinner}>
      <Animated.View style={[
        styles.spinnerDot,
        { backgroundColor: color, opacity }
      ]} />
    </View>
  );
};

// Add the ThinkingText component
const ThinkingText = () => {
  const dot1Opacity = useRef(new Animated.Value(0)).current;
  const dot2Opacity = useRef(new Animated.Value(0)).current;
  const dot3Opacity = useRef(new Animated.Value(0)).current;

  const animateDot = useCallback((dot: Animated.Value, delay: number) => {
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
  }, []);

  const startAnimation = useCallback(() => {
    Animated.loop(
      Animated.parallel([
        animateDot(dot1Opacity, 0),
        animateDot(dot2Opacity, 200),
        animateDot(dot3Opacity, 400),
      ])
    ).start();
  }, [dot1Opacity, dot2Opacity, dot3Opacity, animateDot]);

  useEffect(() => {
    startAnimation();
    return () => {
      dot1Opacity.stopAnimation();
      dot2Opacity.stopAnimation();
      dot3Opacity.stopAnimation();
    };
  }, [startAnimation, dot1Opacity, dot2Opacity, dot3Opacity]);

  return (
    <View style={styles.thinkingContainer}>
      <Animated.View style={[styles.thinkingDot, { opacity: dot1Opacity }]} />
      <Animated.View style={[styles.thinkingDot, { opacity: dot2Opacity }]} />
      <Animated.View style={[styles.thinkingDot, { opacity: dot3Opacity }]} />
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

interface MenuPanelProps {
  isOpen: boolean;
  onClose: () => void;
  slideAnim: Animated.Value;
  chats: Chat[];
  currentChatId: string | null;
  onSwitchChat: (chatId: string) => void;
  onNewChat: () => void;
  showDeleteForId: string | null;
  setShowDeleteForId: (id: string | null) => void;
  deleteChat: (id: string) => void;
}

const MenuPanel = ({ isOpen, onClose, slideAnim, chats, currentChatId, onSwitchChat, onNewChat, showDeleteForId, setShowDeleteForId, deleteChat }: MenuPanelProps) => {
  const { colors } = useTheme();
  const { t, language, setLanguage } = useAppTranslation();
  const screenWidth = Dimensions.get('window').width;
  const menuWidth = screenWidth * 0.75;
  const router = useRouter();
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  const [search, setSearch] = React.useState('');
  // Make filteredChats more defensive
  const filteredChats = React.useMemo(() => {
    if (!Array.isArray(chats)) {
      console.warn('Chats is not an array in MenuPanel');
      return [];
    }
    return chats.filter(chat => {
      if (!chat || typeof chat.title !== 'string') {
        console.warn('Invalid chat found in filter:', chat);
        return false;
      }
      return chat.title.toLowerCase().includes(search.toLowerCase());
    });
  }, [chats, search]);

  // Dynamic storage size calculation
  const [storageSize, setStorageSize] = React.useState('0 KB');
  const [storageBytes, setStorageBytes] = React.useState(0);
  React.useEffect(() => {
    const calcStorageSize = async () => {
      try {
        const chatsStr = await AsyncStorage.getItem('chats');
        if (!chatsStr) {
          setStorageSize('0 KB');
          setStorageBytes(0);
          return;
        }
        // Calculate byte length
        const bytes = new TextEncoder().encode(chatsStr).length;
        setStorageBytes(bytes);
        let size = '';
        if (bytes < 1024) size = `${bytes} B`;
        else if (bytes < 1024 * 1024) size = `${(bytes / 1024).toFixed(2)} KB`;
        else if (bytes < 1024 * 1024 * 1024) size = `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
        else size = `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
        setStorageSize(size);
      } catch (e) {
        console.error('Error calculating storage size:', e);
        setStorageSize('?');
        setStorageBytes(0);
      }
    };
    if (isOpen) {
      calcStorageSize();
    }
  }, [isOpen, chats]);

  const appVersion = '1.0.1';

  const handleDeleteAllChats = () => {
    if (!Array.isArray(chats)) {
      console.error('Cannot delete chats: chats is not an array');
      return;
    }
    
    if (window.confirm && typeof window.confirm === 'function') {
      if (!window.confirm(t('deleteAllChatsConfirm'))) return;
    }
    
    // Delete chats one by one to ensure proper state updates
    const deleteNext = async (index: number) => {
      if (index >= chats.length) return;
      try {
        await deleteChat(chats[index].id);
        // Use setTimeout to avoid stack overflow with many chats
        setTimeout(() => deleteNext(index + 1), 0);
      } catch (error) {
        console.error('Error deleting chat:', error);
        // Continue with next chat even if one fails
        setTimeout(() => deleteNext(index + 1), 0);
      }
    };
    
    deleteNext(0);
  };

  const handleChatPress = (chatId: string) => {
    if (!chatId) {
      console.warn('Invalid chatId in handleChatPress');
      return;
    }
    if (showDeleteForId === chatId) {
      return;
    }
    try {
      onSwitchChat(chatId);
      onClose();
    } catch (error) {
      console.error('Error switching chat:', error);
    }
  };

  const openUrl = (url: string) => {
    Linking.openURL(url);
  };

  const translateX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-menuWidth, 0],
  });

  const backdropOpacity = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.5],
  });

  const handleLanguagePress = () => {
    setShowLanguageModal(true);
  };

  const handleLanguageSelect = async (selectedLanguage: Language) => {
    try {
      await setLanguage(selectedLanguage);
      setShowLanguageModal(false);
    } catch (error) {
      console.error('Error changing language:', error);
    }
  };

  const LanguageModal = () => {
    if (!showLanguageModal) return null;

    return (
      <Modal
        transparent
        visible={showLanguageModal}
        animationType="fade"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowLanguageModal(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{t('appLanguage')}</Text>
              <TouchableOpacity 
                onPress={() => setShowLanguageModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.languageList}>
              {languageOptions.map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  style={[
                    styles.languageOption,
                    { backgroundColor: colors.inputBackground },
                    language === lang.code && { backgroundColor: colors.border }
                  ]}
                  onPress={() => handleLanguageSelect(lang.code)}
                >
                  <Text style={[styles.languageOptionText, { color: colors.text }]}>
                    {lang.label}
                  </Text>
                  {language === lang.code && (
                    <Ionicons name="checkmark" size={20} color={colors.text} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  return (
    <>
      <LanguageModal />
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
        <SafeAreaView style={[styles.menuContent, { flex: 1 }]}>
          <View style={{ flex: 1 }}>
            <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder={t('searchChats')}
                placeholderTextColor={colors.placeholderText}
                style={{
                  backgroundColor: colors.inputBackground,
                  color: colors.inputText,
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  fontSize: 16,
                  borderWidth: 1,
                  borderColor: colors.border,
                  marginBottom: 8,
                }}
                returnKeyType="search"
                clearButtonMode="while-editing"
              />
            </View>
            {Array.isArray(filteredChats) && filteredChats.length > 0 ? (
              <FlatList
                data={filteredChats}
                keyExtractor={item => item?.id || Math.random().toString()}
                renderItem={({ item }) => {
                  if (!item || !item.id) {
                    console.warn('Invalid chat item in FlatList:', item);
                    return null;
                  }
                  return (
                    <TouchableOpacity
                      style={[
                        styles.menuItem,
                        currentChatId === item.id && { backgroundColor: colors.inputBackground }
                      ]}
                      onPress={() => handleChatPress(item.id)}
                      onLongPress={() => setShowDeleteForId(item.id)}
                    >
                      <View style={{ flex: 1 }}>
                        <Text 
                          style={[styles.menuItemText, { color: colors.text }]}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {item.title || t('newChat')}
                        </Text>
                      </View>
                      {showDeleteForId === item.id && (
                        <TouchableOpacity
                          onPress={() => deleteChat(item.id)}
                          style={styles.deleteButton}
                        >
                          <Ionicons name="trash-outline" size={20} color="#d32f2f" />
                        </TouchableOpacity>
                      )}
                    </TouchableOpacity>
                  );
                }}
                contentContainerStyle={{ flexGrow: 1 }}
                ListEmptyComponent={
                  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 }}>
                    <Text style={{ color: colors.placeholderText, textAlign: 'center' }}>
                      {search ? t('noChatsFound') : t('noChats')}
                    </Text>
                  </View>
                }
              />
            ) : (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 }}>
                <Text style={{ color: colors.placeholderText, textAlign: 'center' }}>
                  {search ? t('noChatsFound') : t('noChats')}
                </Text>
              </View>
            )}
          </View>
          {/* Footer section */}
          <View style={{ borderTopWidth: 1, borderTopColor: colors.border, padding: 16, backgroundColor: colors.background }}>
            <TouchableOpacity
              style={{ 
                alignItems: 'center', 
                justifyContent: 'center', 
                marginBottom: 4, 
                paddingVertical: 6,
                paddingHorizontal: 8
              }}
              onPress={handleDeleteAllChats}
            >
              <View style={{ alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                <Text 
                  style={{ 
                    color: '#d32f2f', 
                    fontWeight: '700', 
                    fontSize: 17, 
                    textAlign: 'center',
                    flexShrink: 1
                  }}
                  numberOfLines={2}
                  adjustsFontSizeToFit={true}
                  minimumFontScale={0.8}
                >
                  {t('deleteAllChats')}
                </Text>
                <Text 
                  style={{ 
                    color: colors.placeholderText, 
                    fontWeight: '500', 
                    fontSize: 14, 
                    textAlign: 'center',
                    marginTop: 2
                  }}
                >
                  {storageSize}
                </Text>
              </View>
            </TouchableOpacity>
            {storageBytes > 5 * 1024 * 1024 * 1024 && (
              <Text 
                style={{ 
                  color: '#d32f2f', 
                  fontSize: 14, 
                  marginBottom: 12, 
                  marginTop: 2,
                  textAlign: 'center',
                  paddingHorizontal: 8,
                  lineHeight: 20
                }}
                numberOfLines={3}
                adjustsFontSizeToFit={true}
                minimumFontScale={0.85}
              >
                {t('deleteAllChatsWarning')}
              </Text>
            )}
            <View style={{ height: 1, backgroundColor: colors.border, marginBottom: 12 }} />
            <TouchableOpacity 
              style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                paddingVertical: 8,
                marginBottom: 12,
                backgroundColor: colors.inputBackground,
                borderRadius: 8,
                paddingHorizontal: 12
              }}
              onPress={handleLanguagePress}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, minWidth: 0 }}>
                <Ionicons name="language-outline" size={20} color={colors.text} style={{ marginRight: 8 }} />
                <Text 
                  style={{ color: colors.text, fontSize: 15, flexShrink: 1 }}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {t('appLanguage')}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ color: colors.placeholderText, fontSize: 14, marginRight: 4 }}>{language.toUpperCase()}</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.placeholderText} />
              </View>
            </TouchableOpacity>
            <Text style={{ color: colors.placeholderText, fontSize: 14, marginBottom: 6 }}>
              <Text>{t('appName')} - {t('version')} {appVersion}</Text>
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-start', gap: 8, marginTop: 2 }}>
              <TouchableOpacity onPress={() => openUrl('https://kurma.ai/term-conditions')}>
                <Text style={{ color: colors.placeholderText, fontSize: 14, textDecorationLine: 'underline' }}>{t('termsOfUse')}</Text>
              </TouchableOpacity>
              <Text style={{ color: colors.placeholderText, fontSize: 14, marginHorizontal: 6 }}>|</Text>
              <TouchableOpacity onPress={() => openUrl('https://kurma.ai/privacy-policy')}>
                <Text style={{ color: colors.placeholderText, fontSize: 14, textDecorationLine: 'underline' }}>{t('privacyPolicy')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Animated.View>
    </>
  );
};

// Add this utility function at the top level
const saveChatsToStorage = async (chatsToSave: Chat[]) => {
  try {
    // Sort chats by updatedAt before saving
    const sortedChats = [...chatsToSave].sort((a, b) => b.updatedAt - a.updatedAt);
    await AsyncStorage.setItem('chats', JSON.stringify(sortedChats));
    console.log('Chats saved successfully:', sortedChats.length);
  } catch (error) {
    console.error('Error saving chats to storage:', error);
  }
};

// Add ChatPromptPanel component
const ChatPromptPanel = ({ onSelect }: { onSelect: (q: string) => void }) => {
  const { colors, theme } = useTheme();
  const { t } = useAppTranslation();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: colors.background }}>
      <Image
        source={theme === 'dark' ? require('../assets/images/splash-icon-light.png') : require('../assets/images/splash-icon-dark.png')}
        style={{ width: 200, height: 200, marginBottom: 0 }}
        resizeMode="contain"
      />
      <Text style={{ fontSize: 26, fontWeight: '700', marginBottom: 8, color: colors.text, textAlign: 'center' }}>
        {t('welcomeMessage')}
      </Text>
      <Text style={{ fontSize: 18, color: colors.placeholderText, marginBottom: 28, textAlign: 'center' }}>
        {t('howCanIHelp')}
      </Text>
      <View style={{ width: '100%', maxWidth: 400 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
          <TouchableOpacity
            style={{ flex: 1, marginRight: 8, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 16, backgroundColor: colors.inputBackground }}
            onPress={() => onSelect(t('tipsFishHealth'))}
          >
            <Text style={{ color: colors.text, fontSize: 16, textAlign: 'center' }}>{t('tipsFishHealth')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{ flex: 1, marginLeft: 8, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 16, backgroundColor: colors.inputBackground }}
            onPress={() => onSelect(t('setupFishFarm'))}
          >
            <Text style={{ color: colors.text, fontSize: 16, textAlign: 'center' }}>{t('setupFishFarm')}</Text>
          </TouchableOpacity>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <TouchableOpacity
            style={{ flex: 1, marginRight: 8, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 16, backgroundColor: colors.inputBackground }}
            onPress={() => onSelect(t('waterQuality'))}
          >
            <Text style={{ color: colors.text, fontSize: 16, textAlign: 'center' }}>{t('waterQuality')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{ flex: 1, marginLeft: 8, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 16, backgroundColor: colors.inputBackground }}
            onPress={() => onSelect(t('phLevel'))}
          >
            <Text style={{ color: colors.text, fontSize: 16, textAlign: 'center' }}>{t('phLevel')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

function AppContent() {
  const [text, setText] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamingMessage, setStreamingMessage] = useState<string>("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [loadingTTSMessageId, setLoadingTTSMessageId] = useState<string | null>(null);
  const { colors, toggleTheme } = useTheme();
  const flatListRef = useRef<FlatList>(null);
  const streamIntervalRef = useRef<number | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const [chats, setChats] = useState<Chat[]>([]); // Initialize as empty array
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [showDeleteForId, setShowDeleteForId] = useState<string | null>(null);
  const [headerTitle, setHeaderTitle] = useState('New Chat');
  const { t, language } = useAppTranslation();
  const [isInitialized, setIsInitialized] = useState(false);
  const [showCopyForMessageId, setShowCopyForMessageId] = useState<string | null>(null);
  const [currentSound, setCurrentSound] = useState<any>(null);

  const headerStyles = StyleSheet.create({
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: Platform.OS === 'ios' ? 54 : 0,
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

  const handleStopGeneration = () => {
    if (streamIntervalRef.current) {
      clearInterval(streamIntervalRef.current);
      streamIntervalRef.current = null;
    }
    setIsLoading(false);
    setIsStreaming(false);
  };

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
    
    let chatId = currentChatId;
    
    // If there's no current chat, create one first
    if (!chatId) {
      const newChatId = Date.now().toString();
      const newChat: Chat = {
        id: newChatId,
        title: 'New Chat',
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      
      chatId = newChatId;
      setCurrentChatId(newChatId);
      
      setChats(prevChats => {
        const currentChats = Array.isArray(prevChats) ? prevChats : [];
        const updatedChats = [newChat, ...currentChats];
        
        try {
          saveChatsToStorage(updatedChats);
        } catch (error) {
          console.error('Error saving new chat:', error);
        }
        
        return updatedChats;
      });
    }
    
    const userMessage: Message = {
      id: Date.now().toString(),
      text: text.trim(),
      isUser: true
    };
    const loadingMessage: Message = {
      id: 'loading-' + Date.now().toString(),
      text: "thinking",
      isUser: false
    };
    const newMessages = [...messages, userMessage, loadingMessage];
    setMessages(newMessages);
    
    // Update header title immediately for the first message
    if (messages.length === 0) {
      const title = userMessage.text.length > 30 
        ? userMessage.text.slice(0, 30) + '...'
        : userMessage.text;
      setHeaderTitle(title);
    }
    
    // Use the chat ID directly instead of relying on state
    updateCurrentChatWithId(chatId, newMessages);
    setText("");
    setIsLoading(true);
    setError(null);

    try {
      const response = await generateResponse(text.trim(), language);
      if (response.startsWith('Error:')) {
        setError(response);
        setMessages(prev => {
          const updated = prev.map(msg =>
            msg.id === loadingMessage.id
              ? { ...msg, text: response }
              : msg
          );
          updateCurrentChatWithId(chatId, updated);
          return updated;
        });
      } else {
        setMessages(prev => {
          const updated = prev.map(msg =>
            msg.id === loadingMessage.id
              ? { ...msg, text: '' }
              : msg
          );
          updateCurrentChatWithId(chatId, updated);
          return updated;
        });
        // Streaming logic
        const words = response.split(/(\s+)/);
        let currentIndex = 0;
        let currentText = '';
        setIsStreaming(true);
        streamIntervalRef.current = setInterval(() => {
          if (currentIndex < words.length) {
            currentText += words[currentIndex];
            setMessages(prev => {
              const updated = prev.map(msg =>
                msg.id === loadingMessage.id
                  ? { ...msg, text: currentText }
                  : msg
              );
              updateCurrentChatWithId(chatId, updated);
              return updated;
            });
            currentIndex++;
          } else {
            if (streamIntervalRef.current) {
              clearInterval(streamIntervalRef.current);
              streamIntervalRef.current = null;
            }
            setIsStreaming(false);
            setMessages(prev => {
              const updated = prev.map(msg =>
                msg.id === loadingMessage.id
                  ? { ...msg, text: response, id: Date.now().toString() }
                  : msg
              );
              updateCurrentChatWithId(chatId, updated);
              return updated;
            });
          }
        }, 30);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
      setError(errorMessage);
      setMessages(prev => {
        const updated = prev.map(msg =>
          msg.id === loadingMessage.id
            ? { ...msg, text: errorMessage }
            : msg
        );
        updateCurrentChatWithId(chatId, updated);
        return updated;
      });
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
          setMessages(prev => {
            const updated = prev.map(msg =>
              msg.id === item.id
                ? { ...msg, text: "thinking" }
                : msg
            );
            updateCurrentChat(updated);
            return updated;
          });
          try {
            const response = await generateResponse(userMessageText, language);
            if (response.startsWith('Error:')) {
              setError(response);
              setMessages(prev => {
                const updated = prev.map(msg =>
                  msg.id === item.id
                    ? { ...msg, text: response }
                    : msg
                );
                updateCurrentChat(updated);
                return updated;
              });
            } else {
              // Streaming logic
              const words = response.split(/(\s+)/);
              let currentIndex = 0;
              let currentText = '';
              setIsStreaming(true);
              streamIntervalRef.current = setInterval(() => {
                if (currentIndex < words.length) {
                  currentText += words[currentIndex];
                  setMessages(prev => {
                    const updated = prev.map(msg =>
                      msg.id === item.id
                        ? { ...msg, text: currentText }
                        : msg
                    );
                    updateCurrentChat(updated);
                    return updated;
                  });
                  currentIndex++;
                } else {
                  if (streamIntervalRef.current) {
                    clearInterval(streamIntervalRef.current);
                    streamIntervalRef.current = null;
                  }
                  setIsStreaming(false);
                  setMessages(prev => {
                    const updated = prev.map(msg =>
                      msg.id === item.id
                        ? { ...msg, text: response }
                        : msg
                    );
                    updateCurrentChat(updated);
                    return updated;
                  });
                }
              }, 30);
            }
          } catch (error) {
            const errorText = error instanceof Error ? error.message : "An unexpected error occurred";
            setError(errorText);
            setMessages(prev => {
              const updated = prev.map(msg =>
                msg.id === item.id
                  ? { ...msg, text: errorText }
                  : msg
              );
              updateCurrentChat(updated);
              return updated;
            });
          } finally {
            setIsLoading(false);
          }
        }
      }
    }
  };

    const handleSpeak = async (text: string, messageId: string) => {
    if (speakingMessageId === messageId) {
      // If currently speaking this message, stop it
      if (currentSound) {
        await currentSound.stopAsync();
        await currentSound.unloadAsync();
        setCurrentSound(null);
      }
      Speech.stop(); // Also stop system TTS if running
      setSpeakingMessageId(null);
      setLoadingTTSMessageId(null);
    } else {
      // Stop any currently playing audio
      if (currentSound) {
        await currentSound.stopAsync();
        await currentSound.unloadAsync();
        setCurrentSound(null);
      }
      Speech.stop(); // Also stop system TTS if running
      
      // Show loading indicator
      setLoadingTTSMessageId(messageId);
      setSpeakingMessageId(null);
      
      try {
        // Try ElevenLabs first
        const audioUri = await generateElevenLabsSpeech(text);
        
        // Hide loading indicator
        setLoadingTTSMessageId(null);
        
        if (audioUri) {
          // Play ElevenLabs audio
          setSpeakingMessageId(messageId);
          const { sound } = await Audio.Sound.createAsync(
            { uri: audioUri },
            { shouldPlay: true }
          );
          
          setCurrentSound(sound);
          
          sound.setOnPlaybackStatusUpdate((status: any) => {
            if (status.isLoaded && status.didJustFinish) {
              setSpeakingMessageId(null);
              setCurrentSound(null);
              sound.unloadAsync();
              // Clean up the temporary file
              FileSystem.deleteAsync(audioUri, { idempotent: true });
            }
          });
        } else {
          // Fallback to system TTS
          setSpeakingMessageId(messageId);
          Speech.speak(text, {
            onStart: () => setSpeakingMessageId(messageId),
            onDone: () => setSpeakingMessageId(null),
            onError: () => setSpeakingMessageId(null),
          });
        }
      } catch (error) {
        console.error('Error playing ElevenLabs audio:', error);
        setLoadingTTSMessageId(null);
        // Fallback to system TTS
        setSpeakingMessageId(messageId);
        Speech.speak(text, {
          onStart: () => setSpeakingMessageId(messageId),
          onDone: () => setSpeakingMessageId(null),
          onError: () => setSpeakingMessageId(null),
        });
      }
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

  const scrollToBottom = () => {
    if (flatListRef.current) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  };

  // Load chats from storage on mount
  const loadChats = async () => {
    try {
      const savedChats = await AsyncStorage.getItem('chats');
      console.log('Loading saved chats...');
      
      if (savedChats) {
        const parsedChats = JSON.parse(savedChats);
        // Validate chat structure and ensure it's an array
        const validChats = Array.isArray(parsedChats) ? parsedChats.filter((chat: any) => {
          const isValid = chat && 
            typeof chat.id === 'string' && 
            typeof chat.title === 'string' && 
            Array.isArray(chat.messages) &&
            typeof chat.createdAt === 'number' &&
            typeof chat.updatedAt === 'number';
          
          if (!isValid) {
            console.warn('Invalid chat found:', chat);
          }
          return isValid;
        }) : [];

        console.log(`Loaded ${validChats.length} valid chats`);
        
        // Sort chats by updatedAt
        const sortedChats = validChats.sort((a: Chat, b: Chat) => b.updatedAt - a.updatedAt);
        setChats(sortedChats);
        
        if (sortedChats.length > 0) {
          const mostRecentChat = sortedChats[0];
          setCurrentChatId(mostRecentChat.id);
          setMessages(mostRecentChat.messages || []);
        }
      } else {
        console.log('No saved chats found');
        setChats([]);
        setCurrentChatId(null);
        setMessages([]);
      }
    } catch (error) {
      console.error('Error loading chats:', error);
      setChats([]);
      setCurrentChatId(null);
      setMessages([]);
    }
  };

  // Add useEffect to update header title whenever relevant state changes
  useEffect(() => {
    const updateHeaderTitle = () => {
      if (!currentChatId) {
        setHeaderTitle('New Chat');
        return;
      }

      const currentChat = chats.find((c: Chat) => c.id === currentChatId);
      if (!currentChat) {
        setHeaderTitle('New Chat');
        return;
      }

      // Find the first user message
      const firstUserMessage = currentChat.messages.find(m => m.isUser);
      if (firstUserMessage) {
        const title = firstUserMessage.text.length > 30 
          ? firstUserMessage.text.slice(0, 30) + '...'
          : firstUserMessage.text;
        setHeaderTitle(title);
      } else {
        setHeaderTitle(currentChat.title || 'New Chat');
      }
    };

    updateHeaderTitle();
  }, [currentChatId, chats, messages]); // Update when any of these change

  // Helper function to update a specific chat by ID
  const updateCurrentChatWithId = (chatId: string, newMessages: Message[]) => {
    setChats(prevChats => {
      // Ensure prevChats is an array
      const currentChats = Array.isArray(prevChats) ? prevChats : [];
      
      // Find the index of the chat
      const chatIndex = currentChats.findIndex(chat => chat.id === chatId);
      if (chatIndex === -1) {
        console.warn('Chat not found for update:', chatId);
        return currentChats;
      }

      // Get the first user message for the title
      const firstUserMessage = newMessages.find(m => m.isUser);
      const title = firstUserMessage?.text
        ? (firstUserMessage.text.slice(0, 30) + (firstUserMessage.text.length > 30 ? '...' : ''))
        : currentChats[chatIndex].title || 'New Chat';

      // Create the updated chat
      const updatedChat = {
        ...currentChats[chatIndex],
        title,
        messages: [...newMessages],
        updatedAt: Date.now(),
      };

      // Create new array with updated chat
      const updatedChats = [...currentChats];
      updatedChats[chatIndex] = updatedChat;

      // Save to storage
      try {
        saveChatsToStorage(updatedChats);
      } catch (error) {
        console.error('Error saving chats:', error);
      }

      return updatedChats;
    });
  };

  // Update the updateCurrentChat function
  const updateCurrentChat = (newMessages: Message[]) => {
    if (!currentChatId) return;
    updateCurrentChatWithId(currentChatId, newMessages);
  };

  // Update createNewChat to be more defensive
  const createNewChat = () => {
    // Save current chat before creating new one
    if (currentChatId) {
      updateCurrentChat(messages);
    }
    
    const newChat: Chat = {
      id: Date.now().toString(),
      title: 'New Chat',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    setChats(prevChats => {
      // Ensure prevChats is an array
      const currentChats = Array.isArray(prevChats) ? prevChats : [];
      const updatedChats = [newChat, ...currentChats];
      
      // Save to storage
      try {
        saveChatsToStorage(updatedChats);
      } catch (error) {
        console.error('Error saving new chat:', error);
      }
      
      return updatedChats;
    });
    
    setCurrentChatId(newChat.id);
    setMessages([]);
    setText('');
    setIsMenuOpen(false);
    setHeaderTitle('New Chat');
  };

  // Update deleteChat to be more defensive
  const deleteChat = (chatId: string) => {
    setChats(prevChats => {
      // Ensure prevChats is an array
      const currentChats = Array.isArray(prevChats) ? prevChats : [];
      const updatedChats = currentChats.filter(chat => chat.id !== chatId);
      
      // Save to storage
      try {
        saveChatsToStorage(updatedChats);
      } catch (error) {
        console.error('Error saving after delete:', error);
      }
      
      // If the deleted chat is the current one, switch to another or clear
      if (currentChatId === chatId) {
        if (updatedChats.length > 0) {
          setCurrentChatId(updatedChats[0].id);
          setMessages(updatedChats[0].messages);
        } else {
          setCurrentChatId(null);
          setMessages([]);
        }
      }
      
      return updatedChats;
    });
    setShowDeleteForId(null);
  };

  // Update switchChat to be more defensive
  const switchChat = (chatId: string) => {
    // Save current chat before switching
    if (currentChatId) {
      updateCurrentChat(messages);
    }
    
    const chat = Array.isArray(chats) ? chats.find(c => c.id === chatId) : null;
    if (chat) {
      setCurrentChatId(chatId);
      setMessages(chat.messages);
      setText('');
      setIsMenuOpen(false);
    } else {
      console.warn('Chat not found for switching:', chatId);
    }
  };

  // Add useEffect for initial load
  useEffect(() => {
    const initializeChats = async () => {
      try {
        await loadChats();
        setIsInitialized(true);
      } catch (error) {
        console.error('Error initializing chats:', error);
        setChats([]); // Ensure chats is an empty array on error
        setIsInitialized(true);
      }
    };
    initializeChats();
  }, []);

  // Add useEffect to scroll when messages change
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, isStreaming]);

  // Cleanup audio when component unmounts
  useEffect(() => {
    return () => {
      if (currentSound) {
        currentSound.stopAsync();
        currentSound.unloadAsync();
      }
      Speech.stop();
    };
  }, [currentSound]);

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
        item.isUser ? { alignSelf: 'flex-end' } : styles.botMessage,
      ]}>
        {item.isUser ? (
          <>
            <TouchableOpacity 
              style={[
                styles.userMessage,
                { backgroundColor: colors.inputBackground }
              ]}
              onPress={() => {
                if (showCopyForMessageId === item.id) {
                  setShowCopyForMessageId(null);
                } else {
                  setShowCopyForMessageId(item.id);
                }
              }}
              activeOpacity={0.8}
            >
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
                }}
                rules={solidBulletRule}
              >
                {item.text}
              </Markdown>
            </TouchableOpacity>
            {/* Copy Icon for User Messages - Only show when message is touched */}
            {showCopyForMessageId === item.id && (
              <View style={[styles.actionIconsContainer, { justifyContent: 'flex-end' }]}>
                <Pressable
                  onPress={() => {
                    handleCopy(item.text);
                    setShowCopyForMessageId(null); // Hide after copying
                  }}
                  style={({ pressed }) => ([
                    styles.actionIcon,
                    pressed ? { opacity: 0.7, transform: [{ scale: 0.85 }] } : { opacity: 1, transform: [{ scale: 1 }] }
                  ])}
                >
                  <Ionicons name="copy-outline" size={18} color={colors.text} />
                </Pressable>
              </View>
            )}
          </>
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
                      style={({ pressed }) => ([
                        styles.actionIcon,
                        pressed ? { opacity: 0.7, transform: [{ scale: 0.85 }] } : { opacity: 1, transform: [{ scale: 1 }] }
                      ])}
                    >
                      <Ionicons name="copy-outline" size={18} color={colors.text} />
                    </Pressable>
                    {/* Retry Icon (only for bot messages) */}
                    {!item.text.startsWith('Error:') && (
                      <Pressable
                        onPress={() => handleRetry(item)}
                        style={({ pressed }) => ([
                          styles.actionIcon,
                          pressed ? { opacity: 0.7, transform: [{ scale: 0.85 }] } : { opacity: 1, transform: [{ scale: 1 }] }
                        ])}
                      >
                        <Ionicons name="refresh-outline" size={18} color={colors.text} />
                      </Pressable>
                    )}
                                         {/* Text-to-Speech Icon */}
                     <Pressable
                       onPress={() => handleSpeak(item.text, item.id)}
                       style={({ pressed }) => ([
                         styles.actionIcon,
                         pressed ? { opacity: 0.7, transform: [{ scale: 0.85 }] } : { opacity: 1, transform: [{ scale: 1 }] }
                       ])}
                     >
                       {loadingTTSMessageId === item.id ? (
                         <LoadingDot color={colors.text} />
                       ) : (
                         <Ionicons 
                           name={speakingMessageId === item.id ? "stop-circle-outline" : "volume-high-outline"} 
                           size={18} 
                           color={colors.text} 
                         />
                       )}
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

  return (
    <>
      <MenuPanel 
        isOpen={isMenuOpen}
        onClose={toggleMenu}
        slideAnim={slideAnim}
        chats={chats}
        currentChatId={currentChatId}
        onSwitchChat={switchChat}
        onNewChat={createNewChat}
        showDeleteForId={showDeleteForId}
        setShowDeleteForId={setShowDeleteForId}
        deleteChat={deleteChat}
      />
      <Animated.View style={[styles.mainContent, { transform: [{ translateX: mainContentTranslateX }], backgroundColor: colors.background }]}>
        <View style={[headerStyles.header, { backgroundColor: colors.background, marginBottom: 16 }]}> 
          <TouchableOpacity style={headerStyles.menuButton} onPress={toggleMenu}>
            <CustomMenuIcon color={colors.text} />
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 }}>
            <Text 
              style={{ 
                color: colors.text, 
                fontSize: 18, 
                fontWeight: '600',
                textAlign: 'center',
                maxWidth: '100%'
              }}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {headerTitle || t('newChat')}
            </Text>
          </View>
          <TouchableOpacity 
            style={headerStyles.noteButton} 
            onPress={() => {
              createNewChat();
              setIsMenuOpen(false);
            }}
          >
            <SimpleLineIcons name="note" size={18} color={colors.text} />
          </TouchableOpacity>
        </View>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
        >
          <View style={{ flex: 1 }}>
            <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
              <StatusBar
                barStyle={colors.background === '#fff' ? "dark-content" : "light-content"}
                backgroundColor={colors.background}
              />
              <View style={[styles.mainContainer, { backgroundColor: colors.background }]}> 
                <View style={{ flex: 1, minHeight: 0 }}>
                  {messages.length === 0 ? (
                    <ChatPromptPanel onSelect={setText} />
                  ) : (
                    <FlatList
                      ref={flatListRef}
                      data={messages}
                      renderItem={renderMessage}
                      keyExtractor={item => item.id}
                      keyboardDismissMode="on-drag"
                      contentContainerStyle={{
                        flexGrow: 1,
                        paddingHorizontal: 16,
                        paddingVertical: 8,
                        paddingBottom: 48,
                      }}
                      scrollEnabled={true}
                      onScrollBeginDrag={() => setShowCopyForMessageId(null)}
                    />
                  )}
                </View>
                <View style={[styles.inputContainer, { backgroundColor: colors.background }]}> 
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: colors.inputBackground,
                          color: colors.inputText,
                          paddingRight: 48, // Back to single button width
                          paddingLeft: 16,
                        }
                      ]}
                      placeholder={t('askAnything')}
                      placeholderTextColor={colors.placeholderText}
                      multiline
                      value={text}
                      onChangeText={setText}
                      textAlignVertical="top"
                      blurOnSubmit={false}
                    />
                    
                    {/* Smart Button Logic */}
                    {(isLoading || isStreaming) ? (
                      // Show Stop Button when API is responding
                      <TouchableOpacity 
                        style={styles.submitButton} 
                        onPress={handleStopGeneration}
                      >
                        <MaterialCommunityIcons
                          name="stop-circle"
                          size={32}
                          color={colors.text}
                        />
                      </TouchableOpacity>
                    ) : text.trim().length > 0 ? (
                      // Show Submit Button when user has typed text
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
                    ) : (
                      // Show Mic Button when input is empty
                      <TouchableOpacity 
                        style={[styles.submitButton, { bottom: 6 }]}
                        onPress={() => {
                          // TODO: Add voice input functionality
                          console.log('Mic button pressed - ready for voice input');
                        }}
                      >
                        <MaterialIcons 
                          name="mic" 
                          size={24} 
                          color={colors.text} 
                        />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            </SafeAreaView>
          </View>
        </KeyboardAvoidingView>
      </Animated.View>
    </>
  );
}

export default function Index() {
  const [showSplash, setShowSplash] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const initialize = async () => {
      try {
        // Check if we're coming from language selection
        const fromLanguage = await AsyncStorage.getItem('fromLanguage');
        if (fromLanguage === 'true') {
          // Clear the flag and skip splash screen
          await AsyncStorage.removeItem('fromLanguage');
          setShowSplash(false);
          setIsInitialized(true);
          return;
        }
        
        // Otherwise show splash screen
        const timer = setTimeout(() => {
          setShowSplash(false);
          setIsInitialized(true);
          router.replace('/get-started');
        }, 1500);
        return () => clearTimeout(timer);
      } catch (error) {
        console.error('Error during initialization:', error);
        // Fallback to showing splash screen
        const timer = setTimeout(() => {
          setShowSplash(false);
          setIsInitialized(true);
          router.replace('/get-started');
        }, 2000);
        return () => clearTimeout(timer);
      }
    };

    initialize();
  }, []);

  if (showSplash || !isInitialized) {
    return <SplashScreen />;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <TranslationProvider>
          <AppContent />
        </TranslationProvider>
      </ThemeProvider>
    </SafeAreaProvider>
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
    paddingTop: 2,
    paddingBottom: 2,
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
    borderBottomColor: 'rgba(0,0,0,0.05)',
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
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  menuItemText: {
    fontSize: 16,
    flex: 1,
  },
  deleteButton: {
    padding: 4,
    marginLeft: 8,
  },
  newChatButton: {
    padding: 4,
  },
  menuItemContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 8,
  },
  mainContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    maxHeight: '80%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  languageList: {
    maxHeight: 400,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  languageOptionText: {
    fontSize: 16,
  },
  thinkingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  thinkingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 2,
  },
  loadingSpinner: {
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinnerDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});
