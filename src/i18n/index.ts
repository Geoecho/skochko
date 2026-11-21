import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import mk from './locales/mk.json';
import en from './locales/en.json';

export const SUPPORTED = ['mk', 'en'] as const;
export type Locale = (typeof SUPPORTED)[number];

// Macedonian is the default. English only if the device prefers it.
const device = typeof navigator === 'undefined' ? undefined : navigator.language.split('-')[0];
const initial: Locale = device === 'en' ? 'en' : 'mk';

i18n.use(initReactI18next).init({
  resources: { mk: { translation: mk }, en: { translation: en } },
  lng: initial,
  fallbackLng: 'mk',
  interpolation: { escapeValue: false },
  returnNull: false,
});

export default i18n;
