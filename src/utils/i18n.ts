import { Storage } from "@plasmohq/storage";
import { useLocaleStore } from "~hooks/useLocaleStore";

export const SELECTED_LOCALE_KEY = "selectedLocale";
export const DEFAULT_LOCALE = "en";

export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  // Major Global Languages
  { code: "en", name: "English", nativeName: "English" },
  { code: "es", name: "Spanish", nativeName: "Español" },
  { code: "zh-CN", name: "Chinese (Simplified)", nativeName: "中文 (简体)" },
  { code: "zh-TW", name: "Chinese (Traditional)", nativeName: "中文 (繁體)" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी" },
  { code: "ar", name: "Arabic", nativeName: "العربية" },
  { code: "pt", name: "Portuguese", nativeName: "Português" },
  { code: "ru", name: "Russian", nativeName: "Русский" },
  { code: "ja", name: "Japanese", nativeName: "日本語" },
  
  // European Languages
  { code: "fr", name: "French", nativeName: "Français" },
  { code: "de", name: "German", nativeName: "Deutsch" },
  { code: "it", name: "Italian", nativeName: "Italiano" },
  { code: "pl", name: "Polish", nativeName: "Polski" },
  { code: "uk", name: "Ukrainian", nativeName: "Українська" },
  { code: "nl", name: "Dutch", nativeName: "Nederlands" },
  { code: "sv", name: "Swedish", nativeName: "Svenska" },
  { code: "da", name: "Danish", nativeName: "Dansk" },
  { code: "no", name: "Norwegian", nativeName: "Norsk" },
  { code: "fi", name: "Finnish", nativeName: "Suomi" },
  { code: "cs", name: "Czech", nativeName: "Čeština" },
  { code: "sk", name: "Slovak", nativeName: "Slovenčina" },
  { code: "hu", name: "Hungarian", nativeName: "Magyar" },
  { code: "ro", name: "Romanian", nativeName: "Română" },
  { code: "bg", name: "Bulgarian", nativeName: "Български" },
  { code: "hr", name: "Croatian", nativeName: "Hrvatski" },
  { code: "sl", name: "Slovenian", nativeName: "Slovenščina" },
  { code: "et", name: "Estonian", nativeName: "Eesti" },
  { code: "lv", name: "Latvian", nativeName: "Latviešu" },
  { code: "lt", name: "Lithuanian", nativeName: "Lietuvių" },
  { code: "el", name: "Greek", nativeName: "Ελληνικά" },
  { code: "tr", name: "Turkish", nativeName: "Türkçe" },
  
  // Asian Languages
  { code: "ko", name: "Korean", nativeName: "한국어" },
  { code: "th", name: "Thai", nativeName: "ไทย" },
  { code: "vi", name: "Vietnamese", nativeName: "Tiếng Việt" },
  { code: "id", name: "Indonesian", nativeName: "Bahasa Indonesia" },
  { code: "ms", name: "Malay", nativeName: "Bahasa Melayu" },
  { code: "tl", name: "Filipino", nativeName: "Filipino" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்" },
  { code: "ur", name: "Urdu", nativeName: "اردو" },
  { code: "fa", name: "Persian", nativeName: "فارسی" },
  { code: "he", name: "Hebrew", nativeName: "עברית" },
  
  // Americas
  { code: "pt-BR", name: "Portuguese (Brazil)", nativeName: "Português (Brasil)" },
  { code: "es-MX", name: "Spanish (Mexico)", nativeName: "Español (México)" },
  
  // African Languages
  { code: "sw", name: "Swahili", nativeName: "Kiswahili" },
  { code: "ig", name: "Igbo", nativeName: "Igbo" },
  { code: "ha", name: "Hausa", nativeName: "Hausa" },
];

const storage = new Storage();

export function getMessage(key: string, substitutions?: string | string[], fallbackMessage?: string): string {
  // First try to get the message from the Zustand store (for popup/options pages)
  const { messages, locale } = useLocaleStore.getState();

  // Try direct lookup first
  let entry = messages[key];

  // If not found, attempt some common key variations to allow older/newer naming conventions
  if (!entry) {
    const variations: string[] = [];

    // 1. Replace long suffixes
    if (key.endsWith("Description")) {
      variations.push(key.replace(/Description$/, "Desc"));
    }
    if (key.endsWith("Label")) {
      variations.push(key.replace(/Label$/, "Text"));
    }
    // 2. Remove 'LightUp' from middle of key (e.g., autoOpenLightUpLabel → autoOpenLabel)
    if (key.includes("LightUp")) {
      variations.push(key.replace("LightUp", ""));
    }

    // 3. Try variations
    variations.forEach((variation) => {
      if (!entry && messages[variation]) {
        entry = messages[variation];
      }
    });
  }

  if (entry) {
    let message = entry.message;
    if (substitutions) {
      const subs = Array.isArray(substitutions) ? substitutions : [substitutions];
      subs.forEach((sub, i) => {
        message = message.replace(new RegExp(`\\$${i + 1}`, 'g'), sub);
      });
    }
    return message;
  }
  
  // If not found in store, try using chrome.i18n API directly (for content scripts)
  if (typeof chrome !== 'undefined' && chrome.i18n) {
    const chromeMessage = chrome.i18n.getMessage(key, 
      Array.isArray(substitutions) ? substitutions : substitutions ? [substitutions] : []);
    if (chromeMessage) {
      return chromeMessage;
    }
  }

  // Fallback if nothing else works
  if (fallbackMessage) return fallbackMessage;
  console.warn(`Translation key not found: ${key} for locale: ${locale}`);
  return key; // Return just the key without brackets to avoid confusion
}

export async function getSelectedLocale(): Promise<string> {
  try {
    const selectedLocale = await storage.get(SELECTED_LOCALE_KEY);
    return selectedLocale || chrome.i18n.getUILanguage() || DEFAULT_LOCALE;
  } catch (error) {
    console.error("Error getting selected locale:", error);
    return DEFAULT_LOCALE;
  }
}

export async function setSelectedLocale(locale: string): Promise<void> {
  try {
    await storage.set(SELECTED_LOCALE_KEY, locale);
    useLocaleStore.getState().setLocale(locale);
  } catch (error) {
    console.error("Error setting selected locale:", error);
  }
}

export function isLocaleSupported(locale: string): boolean {
  return SUPPORTED_LANGUAGES.some(lang => lang.code === locale);
}

export async function formatDate(date: Date, options?: Intl.DateTimeFormatOptions): Promise<string> {
  const locale = await getSelectedLocale();
  return new Intl.DateTimeFormat(locale, options).format(date);
}

export async function formatNumber(num: number, options?: Intl.NumberFormatOptions): Promise<string> {
  const locale = await getSelectedLocale();
  return new Intl.NumberFormat(locale, options).format(num);
}

export async function getCurrentLocale(): Promise<string> {
  return getSelectedLocale();
}
