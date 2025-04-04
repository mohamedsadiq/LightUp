import { useState, useEffect } from "react"
import { Storage } from "@plasmohq/storage"
import type { Settings, ModelType } from "~types/settings"
import { useSettings } from "./useSettings"

export const useCurrentModel = () => {
  const { settings } = useSettings()
  const [currentModel, setCurrentModel] = useState<string>("Not configured")

  const getModelDisplay = (settings: Settings) => {
    if (!settings?.modelType) return "Not configured"
    
    // For Basic version, show the specific model version
    if (settings.modelType === "basic") {
      // Format the model name to be more user-friendly
      return "Gemini 2.0 Flash"
    }
    
    // For Gemini, show the specific model version
    if (settings.modelType === "gemini" && settings.geminiModel) {
      return settings.geminiModel
    }
    // For Grok, show the specific model version
    else if (settings.modelType === "xai" && settings.grokModel) {
      return settings.grokModel
    }
    // For Local, show the specific model version
    else if (settings.modelType === "local" && settings.localModel) {
      return settings.localModel
    }
    
    return settings.modelType
  }

  useEffect(() => {
    const storage = new Storage()
    
    // Initial load
    const loadCurrentModel = async () => {
      try {
        const settings = await storage.get("settings") as Settings
      
        setCurrentModel(getModelDisplay(settings))
      } catch (error) {
        console.error("[useCurrentModel] Error loading settings:", error)
        setCurrentModel("Error")
      }
    }

    loadCurrentModel()

    // Watch for changes
    const handleSettingsChange = async () => {
      try {
        const settings = await storage.get("settings") as Settings
        console.log("[useCurrentModel] Settings changed:", settings)
        setCurrentModel(getModelDisplay(settings))
      } catch (error) {
        console.error("[useCurrentModel] Error handling settings change:", error)
        setCurrentModel("Error")
      }
    }

    storage.watch({
      settings: handleSettingsChange
    })

    return () => {
      storage.unwatch({
        settings: handleSettingsChange
      })
    }
  }, [])

  // Also watch for settings changes from useSettings hook
  useEffect(() => {
   
    if (settings) {
      setCurrentModel(getModelDisplay(settings))
    }
  }, [settings])

  return currentModel
} 