import { useState, useEffect } from "react"
import { Storage } from "@plasmohq/storage"
import type { Mode } from "~types/settings"

interface UseModeReturn {
  activeMode: Mode;
  setActiveMode: React.Dispatch<React.SetStateAction<Mode>>;
  preferredModes: Mode[];
  setPreferredModes: React.Dispatch<React.SetStateAction<Mode[]>>;
  translationSettings: {
    fromLanguage: string;
    toLanguage: string;
  };
  setTranslationSettings: React.Dispatch<React.SetStateAction<{
    fromLanguage: string;
    toLanguage: string;
  }>>;
}

export const useMode = (): UseModeReturn => {
  const [activeMode, setActiveMode] = useState<Mode>("explain")
  const [preferredModes, setPreferredModes] = useState<Mode[]>(["explain", "summarize", "translate"])
  const [translationSettings, setTranslationSettings] = useState({
    fromLanguage: "en",
    toLanguage: "es"
  })

  useEffect(() => {
    const loadModeSettings = async () => {
      const storage = new Storage()
      
      // Load active mode
      const savedMode = await storage.get("mode") as Mode | undefined
      if (savedMode) {
        setActiveMode(savedMode)
      }
      
      // Load preferred modes
      const savedPreferredModes = await storage.get("preferredModes") as Mode[] | undefined
      if (savedPreferredModes && savedPreferredModes.length > 0) {
        setPreferredModes(savedPreferredModes.slice(0, 3))
      }
      
      // Load translation settings
      const savedTranslationSettings = await storage.get("translationSettings") as any
      if (savedTranslationSettings) {
        setTranslationSettings(savedTranslationSettings)
      }
    }

    loadModeSettings()
    
    // Listen for mode changes from the popup
    const handleModeChanged = (event: CustomEvent) => {
      const { mode, translationSettings: newTranslationSettings, reprocessExisting } = event.detail;
      
      if (mode) {
        setActiveMode(mode);
      }
      
      if (newTranslationSettings) {
        setTranslationSettings(newTranslationSettings);
      }
      
      // If reprocessExisting flag is set, trigger reprocessing of existing text
      if (reprocessExisting) {
        // Dispatch a custom event to notify components that they should reprocess text
        const reprocessEvent = new CustomEvent('reprocessText', { 
          detail: { 
            mode,
            translationSettings: newTranslationSettings
          } 
        });
        window.dispatchEvent(reprocessEvent);
      }
    };
    
    // Listen for preferred modes updates from the popup
    const handleModesUpdated = (event: CustomEvent) => {
      const { preferredModes: newPreferredModes } = event.detail;
      
      if (newPreferredModes && newPreferredModes.length > 0) {
        setPreferredModes((newPreferredModes as Mode[]).slice(0, 3));
      }
    };
    
    window.addEventListener('modeChanged', handleModeChanged as EventListener);
    window.addEventListener('modesUpdated', handleModesUpdated as EventListener);
    
    return () => {
      window.removeEventListener('modeChanged', handleModeChanged as EventListener);
      window.removeEventListener('modesUpdated', handleModesUpdated as EventListener);
    };
  }, [])

  return {
    activeMode,
    setActiveMode,
    preferredModes,
    setPreferredModes,
    translationSettings,
    setTranslationSettings
  }
} 