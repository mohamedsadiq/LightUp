import { Storage } from "@plasmohq/storage"
import { verifyServerConnection } from "~utils/storage"
import type { ProcessTextRequest } from "~types/messages"

// Add this interface at the top of the file
interface Settings {
  modelType: "local" | "cloud"
  serverUrl?: string
}

export async function handleExplainText(request: ProcessTextRequest) {
  const { signal } = request;

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

    const response = await fetch(settings.serverUrl + "/api/generate", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
      signal
    });

    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}`);
    }

    const data = await response.json();
    return data;

  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('Request was cancelled');
      return {
        error: 'Request cancelled by user'
      };
    }
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