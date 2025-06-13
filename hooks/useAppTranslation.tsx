import React, { useCallback, useEffect, useState } from 'react';
import { I18nextProvider, useTranslation as useI18nTranslation } from 'react-i18next';
import { ActivityIndicator, View } from 'react-native';
import i18next, { Language, changeLanguage, getCurrentLanguage } from '../i18n';

export const useAppTranslation = () => {
  const { t, i18n } = useI18nTranslation();

  const translate = useCallback((key: string, options?: any) => {
    try {
      return t(key, options);
    } catch (error) {
      console.warn(`Translation missing for key: ${key}`);
      return key; // Fallback to key
    }
  }, [t]);

  const setLanguage = useCallback(async (language: Language) => {
    await changeLanguage(language);
  }, []);

  const getLanguage = useCallback(async () => {
    return await getCurrentLanguage();
  }, []);

  return {
    t: translate,
    language: i18n.language as Language,
    setLanguage,
    getLanguage,
    isRTL: false // We can add RTL support later if needed
  };
};

interface TranslationProviderProps {
  children: React.ReactNode;
}

// Provider component to wrap the app
export const TranslationProvider: React.FC<TranslationProviderProps> = ({ children }) => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initI18n = async () => {
      try {
        // Wait for i18next to be ready
        await i18next.isInitialized;
        // Get the saved language or use device language
        const language = await getCurrentLanguage();
        await i18next.changeLanguage(language);
        setIsReady(true);
      } catch (error) {
        console.error('Error initializing i18n:', error);
        // Fallback to English if there's an error
        await i18next.changeLanguage('en');
        setIsReady(true);
      }
    };

    initI18n();
  }, []);

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <I18nextProvider i18n={i18next}>
      {children}
    </I18nextProvider>
  );
}; 