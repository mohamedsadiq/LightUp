import { Storage } from "@plasmohq/storage";
import { SELECTED_LOCALE_KEY, DEFAULT_LOCALE } from "./i18n";
import React from "react";

// Interface for translation entries
export interface TranslationEntry {
  message: string;
  description?: string;
}

// Interface for translations
export interface Translations {
  [key: string]: TranslationEntry;
}

// Create a singleton class to manage translations for content scripts
class ContentScriptI18n {
  private static instance: ContentScriptI18n;
  private translations: Translations = {};
  private currentLocale: string = DEFAULT_LOCALE;
  private storage = new Storage();
  private listeners: Array<() => void> = [];

  private constructor() {
    this.init();
  }

  public static getInstance(): ContentScriptI18n {
    if (!ContentScriptI18n.instance) {
      ContentScriptI18n.instance = new ContentScriptI18n();
    }
    return ContentScriptI18n.instance;
  }

  private async init() {
    try {
      // Get the user's selected locale from storage
      const selectedLocale = await this.storage.get(SELECTED_LOCALE_KEY) || DEFAULT_LOCALE;
      await this.loadTranslations(selectedLocale);
      
      // Listen for changes to the selected locale
      this.storage.watch({
        [SELECTED_LOCALE_KEY]: async (change) => {
          if (change.newValue !== this.currentLocale) {
            await this.loadTranslations(change.newValue as string);
          }
        }
      });
    } catch (error) {
      console.error("Error initializing ContentScriptI18n:", error);
    }
  }

  private async loadTranslations(locale: string) {
    try {
      const response = await fetch(chrome.runtime.getURL(`_locales/${locale}/messages.json`));
      if (response.ok) {
        this.translations = await response.json();
        this.currentLocale = locale;
        // Notify all listeners that translations have been updated
        this.notifyListeners();
      } else {
        console.error(`Failed to load translations for ${locale}`);
      }
    } catch (error) {
      console.error(`Error loading translations for ${locale}:`, error);
    }
  }

  public getMessage(key: string, fallback: string = ""): string {
    return this.translations[key]?.message || fallback || `[${key}]`;
  }

  public getCurrentLocale(): string {
    return this.currentLocale;
  }

  public addChangeListener(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener());
  }
}

// Export a singleton instance
export const contentI18n = ContentScriptI18n.getInstance();

// Helper function to get messages
export function getContentMessage(key: string, fallback: string = ""): string {
  return contentI18n.getMessage(key, fallback);
}

// Hook for React components to use translations and re-render on changes
export function useContentI18n() {
  const [, forceUpdate] = React.useState({});
  
  React.useEffect(() => {
    const removeListener = contentI18n.addChangeListener(() => {
      forceUpdate({});
    });
    
    return removeListener;
  }, []);
  
  return {
    getMessage: (key: string, fallback: string = "") => contentI18n.getMessage(key, fallback),
    currentLocale: contentI18n.getCurrentLocale()
  };
}
