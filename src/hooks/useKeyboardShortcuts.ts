import { useEffect } from 'react';
import type { Mode } from '~types/settings';
import type { Settings } from '~types/settings';
import { Storage } from "@plasmohq/storage";

interface UseKeyboardShortcutsProps {
  isEnabled: boolean;
  handleEnabledChange: (newState: boolean) => Promise<void>;
  handleModeChange: (newMode: Mode, translationSettings?: any) => Promise<void>;
  settings: Settings | null;
  setSettings: React.Dispatch<React.SetStateAction<Settings | null>>;
  showToast: (message: string) => void;
}

export const useKeyboardShortcuts = ({
  isEnabled,
  handleEnabledChange,
  handleModeChange,
  settings,
  setSettings,
  showToast
}: UseKeyboardShortcutsProps) => {
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey) {
        let newMode: Mode | null = null;
        let translationSettings = undefined;
        let shortcutMessage = '';
        
        switch (e.key.toLowerCase()) {
          case 'x':
            e.preventDefault();
            await handleEnabledChange(!isEnabled);
            return;
          case 'z':
            newMode = 'explain';
            shortcutMessage = 'Switched to Explain mode (Ctrl+Shift+Z)';
            break;
          case 's':
            newMode = 'summarize';
            shortcutMessage = 'Switched to Summarize mode (Ctrl+Shift+S)';
            break;
          case 'a':
            newMode = 'analyze';
            shortcutMessage = 'Switched to Analyze mode (Ctrl+Shift+A)';
            break;
          case 't':
            newMode = 'translate';
            shortcutMessage = 'Switched to Translate mode (Ctrl+Shift+T)';
            translationSettings = {
              fromLanguage: 'en',
              toLanguage: 'es'
            };
            break;
          case 'r':
            e.preventDefault();
            const newRadicallyFocus = !settings?.customization?.radicallyFocus;
            const storage = new Storage();
            await storage.set("settings", {
              ...settings,
              customization: {
                ...settings?.customization,
                radicallyFocus: newRadicallyFocus
              }
            });
            setSettings(prev => ({
              ...prev!,
              customization: {
                ...prev!.customization,
                radicallyFocus: newRadicallyFocus
              }
            }));
            showToast(`Radically Focus Mode ${newRadicallyFocus ? 'enabled' : 'disabled'} (Ctrl+Shift+R)`);
            return;
          case 'd':
            e.preventDefault();
            const newTheme = settings?.customization?.theme === 'dark' ? 'light' : 'dark';
            const themeStorage = new Storage();
            await themeStorage.set("settings", {
              ...settings,
              customization: {
                ...settings?.customization,
                theme: newTheme
              }
            });
            setSettings(prev => ({
              ...prev!,
              customization: {
                ...prev!.customization,
                theme: newTheme
              }
            }));
            showToast(`${newTheme.charAt(0).toUpperCase() + newTheme.slice(1)} theme activated (Ctrl+Shift+D)`);
            return;
        }

        if (newMode) {
          e.preventDefault();
          await handleModeChange(newMode, translationSettings);
          showToast(shortcutMessage);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isEnabled, settings, handleEnabledChange, handleModeChange, showToast]);
}; 