import { Storage } from "@plasmohq/storage"
import { verifyServerConnection } from "~utils/storage"
import type { ProcessTextRequest } from "~types/messages"

// Add this interface at the top of the file
interface Settings {
  modelType: "local" | "cloud"
  serverUrl?: string
}

export async function handleExplainText(request: ProcessTextRequest) {
  try {
    const storage = new Storage()
    const settings = await storage.get("settings") as Settings
    
    if (!settings) {
      throw new Error("Extension not configured. Please visit the options page.")
    }

    if (settings.modelType === "local") {
      if (!settings.serverUrl) {
        throw new Error("Local LLM server URL not configured")
      }

      const isServerAvailable = await verifyServerConnection(settings.serverUrl)
      if (!isServerAvailable) {
        throw new Error("Cannot connect to Local LLM server")
      }
    }

    // Rest of your existing code...
  } catch (error) {
    console.error('Error:', error)
    return {
      error: error.message
    }
  }
}

// Handle messages from popup and content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "PROCESS_TEXT") {
    handleExplainText(message.payload)
      .then(sendResponse)
    return true // Keep the message channel open for async response
  }
}) 