import { useState, useEffect } from "react"
import { Storage } from "@plasmohq/storage"
import type { Settings } from "~types/settings"

export const useSettings = () => {
  const [settings, setSettings] = useState<Settings>({
    modelType: "local",
    maxTokens: 1000
  })
  const [isConfigured, setIsConfigured] = useState(false)

  useEffect(() => {
    const loadSettings = async () => {
      const storage = new Storage()
      const savedSettings = await storage.get("settings")
      
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings)
        setSettings(parsedSettings)
        setIsConfigured(
          (parsedSettings.modelType === "local" && parsedSettings.serverUrl) ||
          (parsedSettings.modelType === "openai" && parsedSettings.apiKey)
        )
      }
    }

    loadSettings()
  }, [])

  const updateSettings = async (newSettings: Partial<Settings>) => {
    const storage = new Storage()
    const updatedSettings = { ...settings, ...newSettings }
    await storage.set("settings", updatedSettings)
    setSettings(updatedSettings)
  }

  return { settings, isConfigured, updateSettings }
} 