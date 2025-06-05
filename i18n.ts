import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

// Define supported languages
export type Language = 'en' | 'es' | 'fr' | 'zh' | 'ja' | 'de' | 'pt' | 'id' | 'tl' | 'it';

// Define RTL languages
export const RTL_LANGUAGES: Language[] = [];

// Define the structure of our translations
export interface TranslationSchema {
  appName: string;
  newChat: string;
  askAnything: string;
  thinking: string;
  deleteAllChats: string;
  deleteAllChatsConfirm: string;
  deleteAllChatsWarning: string;
  termsOfUse: string;
  privacyPolicy: string;
  version: string;
  welcomeMessage: string;
  howCanIHelp: string;
  tipsFishHealth: string;
  setupFishFarm: string;
  waterQuality: string;
  phLevel: string;
  searchChats: string;
  continue: string;
  chooseLanguage: string;
  chooseLanguageSubtitle: string;
}

// Create a type-safe translation function
declare module 'i18next' {
  interface CustomTypeOptions {
    resources: {
      translation: TranslationSchema;
    };
    compatibilityJSON: 'v4';
  }
}

// Initialize i18next
i18next
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: require('./locales/en.json')
      },
      es: {
        translation: require('./locales/es.json')
      },
      fr: {
        translation: require('./locales/fr.json')
      },
      zh: {
        translation: require('./locales/zh.json')
      },
      ja: {
        translation: require('./locales/ja.json')
      },
      de: {
        translation: require('./locales/de.json')
      },
      pt: {
        translation: require('./locales/pt.json')
      },
      id: {
        translation: require('./locales/id.json')
      },
      tl: {
        translation: require('./locales/tl.json')
      },
      it: {
        translation: require('./locales/it.json')
      }
    },
    fallbackLng: 'en',
    lng: Localization.locale.split('-')[0], // Use device language as default
    interpolation: {
      escapeValue: false // React already escapes values
    },
    react: {
      useSuspense: false // Required for React Native
    }
  } as const);

// Function to change language with persistence
export const changeLanguage = async (language: Language) => {
  try {
    await AsyncStorage.setItem('selectedLanguage', language);
    await i18next.changeLanguage(language);
  } catch (error) {
    console.error('Error changing language:', error);
    // Fallback to English if there's an error
    await i18next.changeLanguage('en');
  }
};

// Function to get current language
export const getCurrentLanguage = async (): Promise<Language> => {
  try {
    const savedLanguage = await AsyncStorage.getItem('selectedLanguage');
    if (savedLanguage && i18next.languages.includes(savedLanguage)) {
      return savedLanguage as Language;
    }
    return Localization.locale.split('-')[0] as Language || 'en';
  } catch (error) {
    console.error('Error getting current language:', error);
    return 'en';
  }
};

// Function to validate translations
export const validateTranslations = (translations: Partial<Record<Language, TranslationSchema>>) => {
  const requiredKeys = Object.keys(translations.en || {});
  const missingKeys: Partial<Record<Language, string[]>> = {};

  Object.entries(translations).forEach(([lang, trans]) => {
    if (trans) {
      const missing = requiredKeys.filter(key => !trans[key as keyof TranslationSchema]);
      if (missing.length > 0) {
        missingKeys[lang as Language] = missing;
      }
    }
  });

  return missingKeys;
};

export default i18next; 