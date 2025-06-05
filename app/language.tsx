import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { Dimensions, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const languages = [
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

const { width } = Dimensions.get('window');

// Group languages into rows for manual layout
const languageRows = [
  [
    { code: 'en', label: 'English' },
    { code: 'es', label: 'Español' },
  ],
  [
    { code: 'fr', label: 'Français' },
    { code: 'zh', label: '中文' },
    { code: 'ja', label: '日本語' },
  ],
  [
    { code: 'de', label: 'Deutsch' },
    { code: 'pt', label: 'Português' },
    { code: 'id', label: 'Bahasa' },
  ],
  [
    { code: 'tl', label: 'Tagalog' },
    { code: 'it', label: 'Italiano' },
  ],
];

export default function LanguagePage() {
  const [selected, setSelected] = useState<string | null>(null);

  const handleContinue = async () => {
    try {
      // Store the selected language
      await AsyncStorage.setItem('selectedLanguage', selected || 'en');
      // Set the flag to indicate we're coming from language selection
      await AsyncStorage.setItem('fromLanguage', 'true');
      // Navigate to main screen
      router.replace('/');
    } catch (error) {
      console.error('Error saving language preference:', error);
      // Still try to navigate even if storage fails
      router.replace('/');
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Image with rounded corners and fade */}
      <View style={styles.topImageContainer}>
        <Image
          source={require('../assets/images/slide11.jpg')}
          style={styles.topImage}
          resizeMode="cover"
        />
        <LinearGradient
          colors={["rgba(255,255,255,0)", "#fff"]}
          style={styles.topImageFade}
        />
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Choose Your{"\n"}Preferred Language</Text>
        <Text style={styles.subtitle}>
          Choose a language to start chatting and get instant answers to your aquaculture questions.
        </Text>
        <View style={styles.optionsGrid}>
          {languageRows.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.languageRow}>
              {row.map(lang => (
                <TouchableOpacity
                  key={lang.code}
                  style={[styles.option, selected === lang.code && styles.selectedOption]}
                  onPress={() => setSelected(lang.code)}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.optionText, selected === lang.code && styles.selectedOptionText]}>{lang.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
      <TouchableOpacity
        style={[styles.continueButton, !selected && { opacity: 0.5 }]}
        onPress={handleContinue}
        disabled={!selected}
      >
        <Text style={styles.continueButtonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  topImageContainer: {
    width: '100%',
    height: 320,
    overflow: 'hidden',
    position: 'relative',
  },
  topImage: {
    width: '100%',
    height: 320,
  },
  topImageFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 60,
  },
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 0,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#20434A',
    marginBottom: 12,
    textAlign: 'center',
    fontFamily: 'BricolageGrotesque-Bold',
    lineHeight: 38,
  },
  subtitle: {
    fontSize: 15,
    color: '#20434A',
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: 'BricolageGrotesque-Regular',
    lineHeight: 22,
  },
  optionsGrid: {
    marginBottom: 24,
    width: '100%',
    alignItems: 'center',
  },
  languageRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 6,
  },
  option: {
    backgroundColor: '#E3EFF5',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 22,
    margin: 3,
    marginBottom: 6,
    minWidth: 110,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedOption: {
    backgroundColor: '#BFD7E6',
    borderColor: '#20434A',
  },
  optionText: {
    fontSize: 20,
    color: '#20434A',
    fontFamily: 'BricolageGrotesque-Bold',
  },
  selectedOptionText: {
    color: '#20434A',
    fontWeight: 'bold',
  },
  continueButton: {
    backgroundColor: '#20434A',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    width: width - 48,
    position: 'absolute',
    bottom: 32,
    left: 24,
    right: 24,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'BricolageGrotesque-Bold',
  },
}); 