import { Feather, FontAwesome6, MaterialIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    Dimensions,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming
} from 'react-native-reanimated';

// Import our components
import ChatThread from './components/ChatThread';
import DimOverlay from './components/DimOverlay';
import EdgeDragDetector from './components/EdgeDragDetector';
import SettingsView from './components/SettingsView';
import SideMenu from './components/SideMenu';
import { useChat } from './context/ChatContext';
import { useTheme } from './context/ThemeContext';

// Get screen dimensions
const { width } = Dimensions.get('window');
const MENU_WIDTH = width * 0.75; // Menu width is 75% of screen width

export default function Index() {
  const [globeActive, setGlobeActive] = useState(false);
  const [inputText, setInputText] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [edgeDragActive, setEdgeDragActive] = useState(false);

  // Get theme from context
  const { theme } = useTheme();

  // Get chat context
  const {
    sendMessage,
    currentConversation,
    startNewConversation
  } = useChat();

  // Initialize a new conversation if none exists
  useEffect(() => {
    if (!currentConversation) {
      startNewConversation();
    }
  }, [currentConversation, startNewConversation]);

  // Handle message submission
  const handleSubmit = async () => {
    if (inputText.trim() !== "") {
      // Send message using chat context
      await sendMessage(inputText);

      // Clear the input after sending
      setInputText("");
    }
  };

  // Handle suggestion press
  const handleSuggestionPress = (suggestion: string) => {
    setInputText(suggestion);
  };

  // Animated values
  const menuPosition = useSharedValue(-MENU_WIDTH);
  const mainContentPosition = useSharedValue(0);
  const overlayOpacity = useSharedValue(0);

  // Function to open menu with animation
  const openMenu = () => {
    // Dismiss keyboard if open
    Keyboard.dismiss();

    // Animate menu opening
    menuPosition.value = withSpring(0, {
      damping: 15,
      stiffness: 90
    });

    // Animate main content sliding right
    mainContentPosition.value = withSpring(MENU_WIDTH, {
      damping: 15,
      stiffness: 90
    });

    // Animate overlay fading in
    overlayOpacity.value = withTiming(1, { duration: 300 });

    // Update state
    setIsMenuOpen(true);
  };

  // Function to close menu with animation
  const closeMenu = () => {
    // Animate menu closing
    menuPosition.value = withSpring(-MENU_WIDTH, {
      damping: 15,
      stiffness: 90
    });

    // Animate main content sliding right
    mainContentPosition.value = withSpring(0, {
      damping: 15,
      stiffness: 90
    });

    // Animate overlay fading out
    overlayOpacity.value = withTiming(0, { duration: 300 });

    // Update state
    setIsMenuOpen(false);
  };

  // Handle drag from edge
  const handleDragStart = () => {
    setEdgeDragActive(true);
    Keyboard.dismiss();
  };

  const handleDragUpdate = (translationX: number) => {
    // Apply some resistance to the drag
    const dragWithResistance = Math.min(translationX * 0.8, MENU_WIDTH);

    if (dragWithResistance >= 0) {
      menuPosition.value = -MENU_WIDTH + dragWithResistance;
      mainContentPosition.value = dragWithResistance;
      overlayOpacity.value = dragWithResistance / MENU_WIDTH;
    }
  };

  const handleDragEnd = (translationX: number, velocityX: number) => {
    setEdgeDragActive(false);

    // Open menu if dragged more than 1/3 of menu width or with sufficient velocity
    if (translationX > MENU_WIDTH / 3 || velocityX > 500) {
      openMenu();
    } else {
      // Reset to closed position
      menuPosition.value = withSpring(-MENU_WIDTH);
      mainContentPosition.value = withSpring(0);
      overlayOpacity.value = withTiming(0);
    }
  };

  // Menu pan gesture handler using the new Gesture API
  const menuPanGesture = Gesture.Pan()
    .onStart(() => {
      // Store the current position in the shared value itself
      // We don't need to store it in the context
    })
    .onUpdate((event) => {
      // Only allow dragging to the left (negative values)
      const dragAmount = Math.min(0, event.translationX);
      const newPosition = Math.max(-MENU_WIDTH, menuPosition.value + dragAmount);

      // Don't allow dragging beyond the menu width
      if (newPosition >= -MENU_WIDTH) {
        menuPosition.value = newPosition;
        mainContentPosition.value = MENU_WIDTH + newPosition;
        overlayOpacity.value = (MENU_WIDTH + newPosition) / MENU_WIDTH;
      }
    })
    .onEnd((event) => {
      // Close menu if dragged left more than 1/3 of menu width or with sufficient velocity
      if (event.translationX < -MENU_WIDTH / 3 || event.velocityX < -500) {
        runOnJS(closeMenu)();
      } else {
        // Reset to fully open position
        menuPosition.value = withSpring(0);
        mainContentPosition.value = withSpring(MENU_WIDTH);
        overlayOpacity.value = withTiming(1);
      }
    });

  // Animated styles
  const menuAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: menuPosition.value }],
    };
  });

  const mainContentAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: mainContentPosition.value }],
    };
  });

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        {/* Side Menu */}
        <Animated.View style={[styles.menuContainer, menuAnimatedStyle]}>
          <GestureDetector gesture={menuPanGesture}>
            <Animated.View style={{ flex: 1 }}>
              <SideMenu
                isOpen={isMenuOpen}
                onClose={closeMenu}
              />
            </Animated.View>
          </GestureDetector>
        </Animated.View>

        {/* Main Content */}
        <Animated.View style={[styles.mainContent, mainContentAnimatedStyle, { backgroundColor: theme.background }]}>
          {/* Dim Overlay */}
          <DimOverlay
            isVisible={isMenuOpen || edgeDragActive}
            opacity={overlayOpacity}
            onPress={closeMenu}
          />

          {/* Edge Drag Detector */}
          <EdgeDragDetector
            isMenuOpen={isMenuOpen}
            onDragStart={handleDragStart}
            onDragUpdate={handleDragUpdate}
            onDragEnd={handleDragEnd}
          />

          {/* Header */}
          <View style={[styles.header, { backgroundColor: theme.headerBackground }]}>
            <View style={styles.headerContent}>
              <TouchableOpacity
                style={styles.menuButton}
                onPress={isMenuOpen ? closeMenu : openMenu}
              >
                <View style={[styles.menuLineLong, { backgroundColor: theme.primary }]} />
                <View style={[styles.menuLineShort, { backgroundColor: theme.primary }]} />
              </TouchableOpacity>
              <Text style={[styles.headerTitle, { color: theme.primary }]}>New Chat</Text>
              <TouchableOpacity style={styles.editButton}>
                <FontAwesome6 name="pen-to-square" size={24} color={theme.primary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Content Area (will be pushed up by keyboard) */}
          <View style={[styles.contentArea, { backgroundColor: theme.background }]}>
            {/* Chat thread with messages */}
            {currentConversation && (
              <ChatThread
                messages={currentConversation.messages}
                onSuggestionPress={handleSuggestionPress}
              />
            )}
          </View>

          {/* Input Area */}
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
            style={[styles.keyboardAvoidingView, { backgroundColor: theme.background }]}
          >
            <View style={[styles.inputContainer, { backgroundColor: theme.background }]}>
              <View style={[styles.inputRow, { backgroundColor: theme.searchBackground }]}>
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder="Ask anything on Aquaculture"
                  placeholderTextColor={theme.placeholderText}
                  value={inputText}
                  onChangeText={setInputText}
                  multiline={true}
                />
                {inputText.trim() === "" && (
                  <TouchableOpacity style={styles.micButton}>
                    <MaterialIcons name="mic" size={24} color={theme.icon} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Buttons row with search and submit buttons */}
              <View style={styles.buttonsRow}>
                {/* Search/Globe button on the left */}
                <View style={styles.globeBoxWrapper}>
                  <TouchableOpacity
                    style={[
                      styles.globeBox,
                      { backgroundColor: theme.searchBackground },
                      globeActive && { backgroundColor: '#204553' }
                    ]}
                    onPress={() => setGlobeActive(!globeActive)}
                  >
                    <Feather
                      name="globe"
                      size={20}
                      color={globeActive ? '#fff' : theme.icon}
                    />
                    <Text
                      style={[
                        styles.globeText,
                        { color: theme.text },
                        globeActive && { color: '#fff' }
                      ]}
                    >
                      Search
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Submit button on the right - always visible but only active when there's text */}
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={handleSubmit}
                  disabled={inputText.trim() === ""}
                >
                  <FontAwesome6
                    name="circle-arrow-up"
                    size={32}
                    color={inputText.trim() === "" ? theme.secondary : theme.primary}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Animated.View>
      </View>

      {/* Settings View */}
      <SettingsView
        isVisible={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  menuContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: MENU_WIDTH,
    zIndex: 2,
  },
  mainContent: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 110,
    paddingTop: 60, // Increased from 50 to move elements down
    backgroundColor: 'transparent', // Changed from '#FFFFFF' to transparent
    zIndex: 10,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  contentArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: 110, // Adjusted padding to account for the moved header
    paddingBottom: 80, // Added bottom padding to ensure messages don't get hidden behind the input area
    overflow: 'visible', // Ensure content isn't clipped
  },
  keyboardAvoidingView: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    position: 'absolute',
    bottom: 15, // Added space from bottom of screen when keyboard is hidden
  },
  inputContainer: {
    width: '100%',
    paddingHorizontal: 20,
    paddingBottom: 8, // Increased bottom padding slightly
    paddingTop: 5,
    backgroundColor: '#FFFFFF',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#EAEAEA',
    borderRadius: 25,
    paddingHorizontal: 10,
    marginBottom: 0, // Removed bottom margin completely
    paddingVertical: 5,
  },
  input: {
    flex: 1,
    minHeight: 50,
    maxHeight: 120,
    borderRadius: 25,
    paddingHorizontal: 10,
    fontSize: 17, // Updated to match body text style (17pt)
    lineHeight: 22, // Added line height for better readability
    fontWeight: '400', // Regular weight
    letterSpacing: -0.41, // SF Pro Text default for body
    backgroundColor: 'transparent',
    textAlignVertical: 'top',
    paddingTop: 15,
  },
  micButton: {
    padding: 10,
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 3, // Slightly increased top margin
    marginBottom: 12, // Further increased bottom margin for more space when keyboard is hidden
  },
  submitButton: {
    borderRadius: 20,
    padding: 10,
    marginRight: 5,
    backgroundColor: 'transparent',
  },
  globeBoxWrapper: {
    alignItems: 'flex-start',
  },
  globeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAEAEA',
    borderRadius: 20,
    paddingHorizontal: 10,
    height: 35,
    minWidth: 95,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  globeText: {
    fontSize: 16,
    fontWeight: '400', // Regular weight
    lineHeight: 21, // Added line height for better readability
    letterSpacing: -0.32, // SF Pro Text default for callout
    color: '#333',
    marginLeft: 4,
  },
  menuButton: {
    padding: 10,
  },
  menuLineLong: {
    width: 22,
    height: 3,
    backgroundColor: '#204553',
    borderRadius: 2,
    marginBottom: 6,
  },
  menuLineShort: {
    width: 15,
    height: 3,
    backgroundColor: '#204553',
    borderRadius: 2,
  },
  editButton: {
    padding: 10,
  },
  headerTitle: {
    fontSize: 17, // Match headline text style
    fontWeight: '600', // Semibold weight
    lineHeight: 22, // Added line height for better readability
    letterSpacing: -0.41, // SF Pro Text default for headline
    color: '#204553',
  },
});
