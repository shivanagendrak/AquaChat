import { Feather, FontAwesome6 } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Alert,
    Dimensions,
    Linking,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useTheme } from '../context/ThemeContext';

// Get screen dimensions
const { width } = Dimensions.get('window');
const MENU_WIDTH = width * 0.75; // Menu width is 75% of screen width

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ChatHistoryItem {
  id: string;
  title: string;
  timestamp: number;
}

// Mock data for chat history - replace with actual data in your implementation
const MOCK_CHAT_HISTORY: ChatHistoryItem[] = [
  { id: '1', title: 'Water quality management', timestamp: Date.now() - 86400000 },
  { id: '2', title: 'Fish feeding schedules', timestamp: Date.now() - 172800000 },
  { id: '3', title: 'Disease prevention', timestamp: Date.now() - 259200000 },
];

const SideMenu: React.FC<SideMenuProps> = ({ onClose }) => {
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>(MOCK_CHAT_HISTORY);
  const [searchText, setSearchText] = useState('');
  const [filteredChats, setFilteredChats] = useState<ChatHistoryItem[]>(MOCK_CHAT_HISTORY);
  const { isDarkMode, toggleTheme, theme } = useTheme();

  // Filter chats when search text changes
  React.useEffect(() => {
    if (searchText.trim() === '') {
      setFilteredChats(chatHistory);
    } else {
      const filtered = chatHistory.filter(chat =>
        chat.title.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredChats(filtered);
    }
  }, [searchText, chatHistory]);

  const handleChatSelect = (id: string) => {
    console.log(`Selected chat: ${id}`);
    // Implement chat loading logic here
    onClose();
  };

  const handleDeleteChat = (id: string) => {
    Alert.alert(
      "Delete Chat",
      "Are you sure you want to delete this chat? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            // Filter out the deleted chat
            const updatedChats = chatHistory.filter(chat => chat.id !== id);
            setChatHistory(updatedChats);
            // Filtered chats will be updated automatically via the useEffect
          }
        }
      ]
    );
  };

  // Function to handle search submission
  const handleSearchSubmit = () => {
    // This could be used to trigger additional search functionality
    console.log(`Searching for: ${searchText}`);
  };

  // Function to handle opening URLs
  const handleOpenURL = (url: string) => {
    Linking.openURL(url).catch((err: Error) => console.error('An error occurred', err));
  };



  return (
    <View style={[styles.container, { width: MENU_WIDTH, backgroundColor: theme.background }]}>
      {/* Search Box */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBoxContainer}>
          <View style={[
            styles.searchBox,
            {
              backgroundColor: theme.searchBackground,
              borderColor: searchText.length > 0 ? theme.primary : theme.divider,
              borderWidth: 1,
            }
          ]}>
            <Feather
              name="search"
              size={20}
              color={searchText.length > 0 ? theme.primary : theme.icon}
              style={styles.searchIcon}
            />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder="Search chats..."
              placeholderTextColor={theme.placeholderText}
              value={searchText}
              onChangeText={setSearchText}
              returnKeyType="search"
              autoCapitalize="none"
              onSubmitEditing={handleSearchSubmit}
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={() => setSearchText('')}>
                <Feather name="x" size={16} color={theme.icon} style={{ marginLeft: 5 }} />
              </TouchableOpacity>
            )}
          </View>
          {/* Dark mode toggle functionality preserved but icon removed */}
          <TouchableOpacity
            onPress={toggleTheme}
            style={styles.hiddenThemeToggle}
          />
        </View>
      </View>

      <View style={[styles.divider, { backgroundColor: theme.divider }]} />

      {/* Chat History */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {chatHistory.length === 0 ? (
          <View style={styles.emptyState}>
            <FontAwesome6 name="comment" size={24} color={theme.secondary} />
            <Text style={[styles.emptyStateText, { color: theme.secondary }]}>No saved chats yet</Text>
          </View>
        ) : filteredChats.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="search" size={24} color={theme.secondary} />
            <Text style={[styles.emptyStateText, { color: theme.secondary }]}>No matching chats found</Text>
          </View>
        ) : (
          filteredChats.map((chat) => (
            <ChatHistoryRow
              key={chat.id}
              title={chat.title}
              onSelect={() => handleChatSelect(chat.id)}
              onDelete={() => handleDeleteChat(chat.id)}
              theme={theme}
              isDarkMode={isDarkMode}
            />
          ))
        )}
      </ScrollView>

      {/* Footer with Terms and Privacy */}
      <View style={styles.footer}>
        <View style={[styles.divider, { backgroundColor: theme.divider }]} />

        <View style={styles.footerContent}>
          <TouchableOpacity
            onPress={() => handleOpenURL('https://kurma.ai/term-conditions')}
          >
            <Text style={[styles.footerText, { color: theme.secondary }]}>Terms of Use</Text>
          </TouchableOpacity>

          <Text style={[styles.footerText, { color: theme.secondary }]}> | </Text>

          <TouchableOpacity
            onPress={() => handleOpenURL('https://kurma.ai/privacy-policy')}
          >
            <Text style={[styles.footerText, { color: theme.secondary }]}>Privacy Policy</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

// Chat history row component
interface ChatHistoryRowProps {
  title: string;
  onSelect: () => void;
  onDelete: () => void;
  theme?: any; // Using any for simplicity, but ideally should be properly typed
  isDarkMode?: boolean;
}

const ChatHistoryRow: React.FC<ChatHistoryRowProps> = ({
  title,
  onSelect,
  onDelete,
  theme
}) => {
  const [isPressed, setIsPressed] = useState(false);

  // Use default theme if not provided
  const rowTheme = theme || {
    text: '#333333',
    chatRowPressed: 'rgba(0, 0, 0, 0.05)',
    divider: '#EEEEEE'
  };

  const handlePress = () => {
    setIsPressed(true);
    setTimeout(() => {
      setIsPressed(false);
      onSelect();
    }, 100);
  };

  const handleLongPress = () => {
    onDelete();
  };

  return (
    <TouchableOpacity
      style={[
        styles.chatRow,
        { borderBottomColor: rowTheme.divider },
        isPressed && { backgroundColor: rowTheme.chatRowPressed }
      ]}
      onPress={handlePress}
      onLongPress={handleLongPress}
      delayLongPress={500}
    >
      <Text style={[styles.chatTitle, { color: rowTheme.text }]} numberOfLines={1}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor is now applied dynamically
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 60, // Increased top padding since we removed the header
    paddingBottom: 12,
  },
  searchBoxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAEAEA',
    borderRadius: 10, // Slightly more rounded corners
    paddingHorizontal: 12, // Increased horizontal padding
    height: 46, // Slightly taller search box
    flex: 1,
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1, // Subtle elevation for Android
    borderWidth: 0, // We'll apply border dynamically in the component
  },
  searchIcon: {
    marginRight: 10, // Increased spacing between icon and text
  },
  searchInput: {
    flex: 1,
    fontSize: 17,
    fontWeight: '400',
    lineHeight: 22,
    letterSpacing: -0.41,
    color: '#333',
    height: 46, // Match the height of the search box
  },
  hiddenThemeToggle: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    padding: 8,
    // No visible elements inside
  },
  divider: {
    height: 1,
    backgroundColor: '#EEEEEE',
  },
  scrollView: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyStateText: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 21,
    letterSpacing: -0.32,
    color: '#AAAAAA',
  },
  chatRow: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    // borderBottomColor is now applied dynamically
  },
  // chatRowPressed style is now applied dynamically
  chatTitle: {
    fontSize: 17,
    fontWeight: '400',
    lineHeight: 22,
    letterSpacing: -0.41,
    // color is now applied dynamically
  },
  // Footer styles
  footer: {
    width: '100%',
    paddingBottom: 20,
  },

  footerContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 16,
  },
  footerText: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
    letterSpacing: -0.08,
  },

});

export default SideMenu;
