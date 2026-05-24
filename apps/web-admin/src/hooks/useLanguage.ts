import { create } from 'zustand';
import { translations, Language, TranslationKey } from '@/lib/i18n';

const LANG_KEY = 'coreHRM_language';

interface LanguageState {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

export const useLanguage = create<LanguageState>((set, get) => ({
  language: (typeof window !== 'undefined'
    ? (localStorage.getItem(LANG_KEY) as Language) || 'vi'
    : 'vi'),

  setLanguage: (lang: Language) => {
    localStorage.setItem(LANG_KEY, lang);
    set({ language: lang });
  },

  t: (key: TranslationKey) => {
    const { language } = get();
    return translations[language][key] || translations['vi'][key] || key;
  },
}));
