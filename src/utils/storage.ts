import { Storage } from "@plasmohq/storage"
import type { Settings } from "~types/settings"

export const storage = new Storage()

// Encryption key management
const getEncryptionKey = async (): Promise<string> => {
  let key = await storage.get("encryptionKey")
  if (!key) {
    key = crypto.randomUUID()
    await storage.set("encryptionKey", key)
  }
  return key
}

// Encrypt API keys
const encryptApiKey = async (apiKey: string): Promise<string> => {
  try {
    const key = await getEncryptionKey()
    const encoder = new TextEncoder()
    const data = encoder.encode(apiKey)
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      encoder.encode(key),
      { name: "AES-GCM" },
      false,
      ["encrypt"]
    )
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const encrypted = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      cryptoKey,
      data
    )
    return JSON.stringify({
      iv: Array.from(iv),
      data: Array.from(new Uint8Array(encrypted))
    })
  } catch (error) {
    console.error("Encryption failed:", error)
    throw new Error("Failed to secure API key")
  }
}

// Decrypt API keys
const decryptApiKey = async (encryptedData: string): Promise<string> => {
  try {
    const key = await getEncryptionKey()
    const { iv, data } = JSON.parse(encryptedData)
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(key),
      { name: "AES-GCM" },
      false,
      ["decrypt"]
    )
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: new Uint8Array(iv) },
      cryptoKey,
      new Uint8Array(data)
    )
    return new TextDecoder().decode(decrypted)
  } catch (error) {
    console.error("Decryption failed:", error)
    throw new Error("Failed to retrieve API key")
  }
}

export const getSettings = async (): Promise<Settings> => {
  try {
    const settings = await storage.get<Settings>("settings")
    if (!settings) {
      return getDefaultSettings()
    }

    // Decrypt API keys
    if (settings.geminiApiKey) {
      settings.geminiApiKey = await decryptApiKey(settings.geminiApiKey)
    }
    if (settings.xaiApiKey) {
      settings.xaiApiKey = await decryptApiKey(settings.xaiApiKey)
    }
    if (settings.apiKey) {
      settings.apiKey = await decryptApiKey(settings.apiKey)
    }

    return settings
  } catch (error) {
    console.error("Error fetching settings:", error)
    return getDefaultSettings()
  }
}

export const verifyServerConnection = async (serverUrl: string): Promise<boolean> => {
  try {
    if (!serverUrl) {
      throw new Error("Server URL is required")
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

    const response = await fetch(`${serverUrl}/v1/models`, {
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`)
    }

    const data = await response.json()
    return true
  } catch (error) {
    console.error("Server connection verification failed:", error)
    return false
  }
}

// Add cleanup function for old data
export const cleanupStorage = async (): Promise<void> => {
  try {
    // Get all items with null key to get everything
    const items = await storage.get(null)
    const keysToRemove = Object.keys(items).filter(key =>
      key.startsWith("temp_") || key.startsWith("cache_")
    )

    const cleanupTasks = keysToRemove.map(key => storage.remove(key))
    await Promise.all(cleanupTasks)
  } catch (error) {
    console.error("Storage cleanup failed:", error)
  }
}

// Validate settings before saving
export const validateAndSaveSettings = async (settings: Settings): Promise<boolean> => {
  try {
    if (!settings.modelType) {
      throw new Error("Model type is required")
    }

    // Create a copy of settings to modify
    const secureSettings = { ...settings }

    // Encrypt API keys before saving
    if (settings.geminiApiKey) {
      secureSettings.geminiApiKey = await encryptApiKey(settings.geminiApiKey)
    }
    if (settings.xaiApiKey) {
      secureSettings.xaiApiKey = await encryptApiKey(settings.xaiApiKey)
    }
    if (settings.apiKey) {
      secureSettings.apiKey = await encryptApiKey(settings.apiKey)
    }

    // Validate API keys based on model type
    if (settings.modelType === "gemini" && !settings.geminiApiKey) {
      throw new Error("Gemini API key is required")
    }
    if (settings.modelType === "xai" && !settings.xaiApiKey) {
      throw new Error("xAI API key is required")
    }

    // Add rate limiting metadata - removed as it's not in the Settings type
    // secureSettings.apiUsage = {
    //   lastRequest: Date.now(),
    //   requestCount: 0
    // }

    await storage.set("settings", secureSettings)
    return true
  } catch (error) {
    console.error("Settings validation failed:", error)
    return false
  }
}

// Helper function for default settings
const getDefaultSettings = (): Settings => ({
  modelType: "local",
  maxTokens: 1000,
  // aiResponseLanguage: undefined by default - will use extension UI language as fallback
  customization: {
    showSelectedText: false,
    theme: "system",
    radicallyFocus: false,
    fontSize: "16px",
    highlightColor: "default",
    popupAnimation: "none",
    persistHighlight: false,
    layoutMode: "floating",
    showGlobalActionButton: true,
    activationMode: "manual",  // Changed default from automatic to manual
    enablePDFSupport: false,
    showTextSelectionButton: true,
    showWebsiteInfo: false,
    sidebarPinned: false  // Default to unpinned
  }
}) 