import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
// import { getTextStyle } from '../utils/typography';
import Logo from './Logo';

interface SuggestionButtonProps {
  text: string;
  onPress: () => void;
  theme: any;
}

const SuggestionButton: React.FC<SuggestionButtonProps> = ({ text, onPress, theme }) => {
  return (
    <TouchableOpacity
      style={[styles.suggestionButton, { borderColor: theme.primary }]}
      onPress={onPress}
    >
      <Text style={[styles.suggestionText, { color: theme.primary }]}>{text}</Text>
    </TouchableOpacity>
  );
};

interface ChatWelcomeProps {
  onSuggestionPress: (suggestion: string) => void;
}

const ChatWelcome: React.FC<ChatWelcomeProps> = ({ onSuggestionPress }) => {
  const { theme } = useTheme();

  const suggestions = [
    "Tips to improve fish health?",
    "How to set up a small fish farm?",
    "Best practices for water quality?",
    "What is the ideal pH level for fish?"
  ];

  return (
    <View style={styles.container}>
      {/* Logo */}
      <View style={styles.logoContainer}>
        <Logo size={220} />
      </View>

      {/* Greeting Text */}
      <Text style={[styles.greeting, { color: theme.primary }]}>
        Hi, I'm AquaChat.
      </Text>

      {/* Help Text */}
      <Text style={[styles.helpText, { color: theme.secondaryText }]}>
        How can I help you today?
      </Text>

      {/* Suggestion Buttons */}
      <View style={styles.suggestionsContainer}>
        <View style={styles.suggestionRow}>
          <SuggestionButton
            text={suggestions[0]}
            onPress={() => onSuggestionPress(suggestions[0])}
            theme={theme}
          />
          <SuggestionButton
            text={suggestions[1]}
            onPress={() => onSuggestionPress(suggestions[1])}
            theme={theme}
          />
        </View>
        <View style={styles.suggestionRow}>
          <SuggestionButton
            text={suggestions[2]}
            onPress={() => onSuggestionPress(suggestions[2])}
            theme={theme}
          />
          <SuggestionButton
            text={suggestions[3]}
            onPress={() => onSuggestionPress(suggestions[3])}
            theme={theme}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 40, // Reduced top padding to position content higher
  },
  logoContainer: {
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700', // Bold weight
    lineHeight: 34,
    letterSpacing: 0.36,
    marginTop: 20, // Reduced margin to position text higher
    textAlign: 'center',
  },
  helpText: {
    fontSize: 20,
    fontWeight: '400',
    lineHeight: 25,
    letterSpacing: 0.38,
    marginTop: 8, // Reduced margin to position text higher
    marginBottom: 30, // Reduced bottom margin
    textAlign: 'center',
  },
  suggestionsContainer: {
    width: '100%',
  },
  suggestionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  suggestionButton: {
    borderWidth: 0.3, // Reduced border width
    borderRadius: 25,
    paddingVertical: 15,
    paddingHorizontal: 15,
    width: '48%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionText: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 21,
    letterSpacing: -0.32,
    textAlign: 'center',
  },
});

export default ChatWelcome;
