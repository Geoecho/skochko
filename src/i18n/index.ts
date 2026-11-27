import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import mk from './locales/mk.json';
import en from './locales/en.json';

export const SUPPORTED = ['mk', 'en'] as const;
export type Locale = (typeof SUPPORTED)[number];

// Keep the server and first client render identical. Preferences are restored after mounting.

i18n.use(initReactI18next).init({
  resources: { mk: { translation: mk }, en: { translation: en } },
  lng: 'mk',
  fallbackLng: 'mk',
  interpolation: { escapeValue: false },
  returnNull: false,
});

export default i18n;
