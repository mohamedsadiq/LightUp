import { useState, useEffect } from "react"
import { Storage } from "@plasmohq/storage"
import type { Settings } from "~types/settings"
import type { Theme } from "~types/theme"

interface UseSettingsReturn {
  settings: Settings | null;
  setSettings: React.Dispatch<React.SetStateAction<Settings | null>>;
  isConfigured: boolean;
  currentTheme: Theme;
  targetLanguage: string;
  fontSize: "0.8rem" | "0.9rem" | "1rem";
}

export const useSettings = (): UseSettingsReturn => {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [isConfigured, setIsConfigured] = useState(false)

  useEffect(() => {
    const loadSettings = async () => {
      const storage = new Storage()
      const savedSettings = await storage.get("settings") as Settings | null
      const translationSettings = await storage.get("translationSettings")
      
      setSettings(savedSettings)
      
      if (savedSettings) {
        const isConfigValid = (() => {
          switch (savedSettings.modelType) {
            case "local":
              return !!savedSettings.serverUrl
            case "openai":
              return !!savedSettings.apiKey
            case "gemini":
              return !!savedSettings.geminiApiKey
            case "xai":
              return !!savedSettings.xaiApiKey
            case "basic":
              return true // Basic model is always configured
            default:
              return false
          }
        })()

        setIsConfigured(isConfigValid)
      } else {
        setIsConfigured(false)
      }
    }

    loadSettings()
    
    // Listen for settings updates from the popup
    const handleSettingsUpdated = (event: CustomEvent) => {
      const { settings: newSettings } = event.detail;
      if (newSettings) {
        setSettings(newSettings);
        
        // Update configuration status
        const isConfigValid = (() => {
          switch (newSettings.modelType) {
            case "local":
              return !!newSettings.serverUrl
            case "openai":
              return !!newSettings.apiKey
            case "gemini":
              return !!newSettings.geminiApiKey
            case "xai":
              return !!newSettings.xaiApiKey
            case "basic":
              return true // Basic model is always configured
            default:
              return false
          }
        })()
        
        setIsConfigured(isConfigValid);
      }
    };
    
    window.addEventListener('settingsUpdated', handleSettingsUpdated as EventListener);
    
    return () => {
      window.removeEventListener('settingsUpdated', handleSettingsUpdated as EventListener);
    };
  }, [])

  const currentTheme = (settings?.customization?.theme || "light") as Theme
  const targetLanguage = settings?.translationSettings?.toLanguage || 'en'
  const fontSize = settings?.customization?.fontSize || "1rem" as "0.8rem" | "0.9rem" | "1rem"

  return {
    settings,
    setSettings,
    isConfigured,
    currentTheme,
    targetLanguage,
    fontSize
  }
} 