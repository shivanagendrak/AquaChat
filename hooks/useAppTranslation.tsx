import React, { useCallback } from 'react';
import { I18nextProvider, useTranslation as useI18nTranslation } from 'react-i18next';
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
  return (
    <I18nextProvider i18n={i18next}>
      {children}
    </I18nextProvider>
  );
}; 