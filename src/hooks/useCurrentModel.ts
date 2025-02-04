import { useState, useEffect } from "react"
import { Storage } from "@plasmohq/storage"
import type { Settings, ModelType } from "~types/settings"
import { useSettings } from "./useSettings"

export const useCurrentModel = () => {
  const { settings } = useSettings()
  const [currentModel, setCurrentModel] = useState<string>("Not configured")

  useEffect(() => {
    const storage = new Storage()
    
    // Initial load
    const loadCurrentModel = async () => {
      try {
        const settings = await storage.get("settings") as Settings
        console.log("[useCurrentModel] Initial settings:", settings)
        
        if (settings?.modelType) {
          // For Gemini, show the specific model version
          if (settings.modelType === "gemini" && settings.geminiModel) {
            console.log("[useCurrentModel] Found Gemini model:", settings.geminiModel)
            setCurrentModel(settings.geminiModel)
          }
          // For Grok, show the specific model version
          else if (settings.modelType === "xai" && settings.grokModel) {
            console.log("[useCurrentModel] Found Grok model:", settings.grokModel)
            setCurrentModel(settings.grokModel)
          }
          else {
            console.log("[useCurrentModel] Found model type:", settings.modelType)
            setCurrentModel(settings.modelType)
          }
        } else {
          console.log("[useCurrentModel] No model type found in settings")
          setCurrentModel("Not configured")
        }
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
        
        if (settings?.modelType) {
          // For Gemini, show the specific model version
          if (settings.modelType === "gemini" && settings.geminiModel) {
            console.log("[useCurrentModel] Model updated to Gemini:", settings.geminiModel)
            setCurrentModel(settings.geminiModel)
          }
          // For Grok, show the specific model version
          else if (settings.modelType === "xai" && settings.grokModel) {
            console.log("[useCurrentModel] Model updated to Grok:", settings.grokModel)
            setCurrentModel(settings.grokModel)
          }
          else {
            console.log("[useCurrentModel] Model type updated to:", settings.modelType)
            setCurrentModel(settings.modelType)
          }
        } else {
          console.log("[useCurrentModel] No model type in updated settings")
          setCurrentModel("Not configured")
        }
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
    console.log("[useCurrentModel] Settings from useSettings changed:", settings)
    if (settings?.modelType) {
      // For Gemini, show the specific model version
      if (settings.modelType === "gemini" && settings.geminiModel) {
        console.log("[useCurrentModel] Updating to Gemini model:", settings.geminiModel)
        setCurrentModel(settings.geminiModel)
      }
      // For Grok, show the specific model version
      else if (settings.modelType === "xai" && settings.grokModel) {
        console.log("[useCurrentModel] Updating to Grok model:", settings.grokModel)
        setCurrentModel(settings.grokModel)
      }
      else {
        console.log("[useCurrentModel] Updating to model type:", settings.modelType)
        setCurrentModel(settings.modelType)
      }
    }
  }, [settings])

  return currentModel
} 