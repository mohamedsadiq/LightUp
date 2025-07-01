import { create } from 'zustand';

interface Messages {
  [key: string]: {
    message: string;
    description?: string;
  };
}

interface LocaleState {
  locale: string;
  messages: Messages;
  setLocale: (locale: string) => void;
  loadMessages: (locale: string) => Promise<void>;
}

export const useLocaleStore = create<LocaleState>()((set, get) => ({
  locale: '',
  messages: {},
  setLocale: (locale) => set({ locale }),
  loadMessages: async (locale) => {
    try {
      if (!locale) return;
      const url = chrome.runtime.getURL(`locales/${locale}/messages.json`);
      
      const response = await fetch(url);
      if (!response.ok) {
        // Fallback to English if the locale file is not found
        if (locale !== 'en') {
          console.warn(`Messages for locale "${locale}" not found. Falling back to English.`);
          await get().loadMessages('en');
        }
        return;
      }
      const messages: Messages = await response.json();
      set({ messages });
    } catch (error) {
      console.error(`Error loading messages for locale "${locale}":`, error);
      // Fallback to English on any other error
      if (locale !== 'en') {
        await get().loadMessages('en');
      }
    }
  },
}));
