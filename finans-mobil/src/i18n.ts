import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

import tr from './locales/tr.json';
import en from './locales/en.json';
import de from './locales/de.json';
import fr from './locales/fr.json';

const LANGUAGE_KEY = 'selectedLanguage';

export const languages = [
  { code: 'tr', name: 'Turkce', flag: '🇹🇷' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', name: 'Francais', flag: '🇫🇷' },
];

const resources = {
  tr: { translation: tr },
  en: { translation: en },
  de: { translation: de },
  fr: { translation: fr },
};

export const initI18n = async () => {
  const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
  
  await i18n.use(initReactI18next).init({
    resources,
    lng: savedLanguage || 'tr',
    fallbackLng: 'tr',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

  return i18n;
};

export const changeLanguage = async (languageCode: string) => {
  await AsyncStorage.setItem(LANGUAGE_KEY, languageCode);
  await i18n.changeLanguage(languageCode);
};

export const getCurrentLanguage = () => {
  return i18n.language || 'tr';
};

export const getStoredLanguage = async (): Promise<string | null> => {
  return AsyncStorage.getItem(LANGUAGE_KEY);
};

export default i18n;
