import { useEffect, useState } from 'react';
import { getSelectedLocale, setSelectedLocale } from '~utils/i18n';
import { useLocaleStore } from './useLocaleStore';

export const useLocale = () => {
  const { locale, setLocale, loadMessages } = useLocaleStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadInitialLocale = async () => {
      try {
        const storedLocale = await getSelectedLocale();
        setLocale(storedLocale || 'en');
      } catch (error) {
        console.error("Failed to load locale:", error);
        setLocale('en');
      } finally {
        setIsLoading(false);
      }
    };
    loadInitialLocale();
  }, [setLocale]);

  useEffect(() => {
    if (locale) {
      loadMessages(locale);
    }
  }, [locale, loadMessages]);

  const changeLocale = async (newLocale: string) => {
    try {
      await setSelectedLocale(newLocale);
      setLocale(newLocale);
    } catch (error) {
      console.error("Failed to change locale:", error);
    }
  };

  return { locale, isLoading, changeLocale };
};

export default useLocale;
