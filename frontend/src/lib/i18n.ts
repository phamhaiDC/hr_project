'use client';

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from '@/locales/en.json';
import vi from '@/locales/vi.json';

// Read saved language — safe here because this module is client-only ('use client').
const savedLang = typeof window !== 'undefined' ? localStorage.getItem('i18nextLng') : null;

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      vi: { translation: vi },
    },
    lng: savedLang || 'vi',
    fallbackLng: 'vi',
    supportedLngs: ['en', 'vi'],
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;