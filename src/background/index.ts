import { Storage } from "@plasmohq/storage"
import { verifyServerConnection } from "~utils/storage"
import type { ProcessTextRequest, StreamChunk } from "~types/messages"
import { SYSTEM_PROMPTS, USER_PROMPTS } from "~utils/constants"
import { processLocalText } from "~services/llm/local"
import { processOpenAIText } from "~services/llm/openai"
import { processGeminiText } from "~services/llm/gemini"

interface Settings {
  modelType: "local" | "openai" | "gemini"
  serverUrl?: string
  translationSettings?: {
    fromLanguage: string
    toLanguage: string
  }
}

let activeConnections = new Map<string, {
  controller: AbortController;
  timestamp: number;
}>();

// Clean up old connections periodically
setInterval(() => {
  const now = Date.now();
  for (const [id, connection] of activeConnections.entries()) {
    if (now - connection.timestamp > 1000 * 60 * 60) { // 1 hour timeout
      connection.controller.abort();
      activeConnections.delete(id);
    }
  }
}, 1000 * 60 * 5); // Check every 5 minutes

export async function handleProcessText(request: ProcessTextRequest, port: chrome.runtime.Port) {
  try {
    const connectionId = port.name.split('text-processing-')[1];
    const abortController = new AbortController();
    
    activeConnections.set(connectionId, {
      controller: abortController,
      timestamp: Date.now()
    });

    const { mode, text, context, isFollowUp, settings } = request;
    
    console.log('Processing request:', { 
      mode, 
      text, 
      context, 
      isFollowUp,
      translationSettings: settings?.translationSettings 
    });

    const storage = new Storage();
    const globalSettings = await storage.get("settings") as Settings;
    
    let textProcessor;
    switch (globalSettings?.modelType) {
      case "local":
        textProcessor = processLocalText;
        break;
      case "openai":
        textProcessor = processOpenAIText;
        break;
      case "gemini":
        textProcessor = processGeminiText;
        break;
      default:
        textProcessor = processOpenAIText;
    }

    for await (const result of textProcessor(request)) {
      if (result.type === 'chunk') {
        port.postMessage({ 
          type: 'chunk', 
          content: result.content,
          isFollowUp: request.isFollowUp
        });
      } else if (result.type === 'done') {
        port.postMessage({ 
          type: 'done',
          isFollowUp: request.isFollowUp
        });
      } else if (result.type === 'error') {
        port.postMessage({ 
          type: 'error',
          error: result.error
        });
      }
    }

  } catch (error) {
    console.error('Processing error:', error);
    port.postMessage({ 
      type: 'error', 
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  } finally {
    const connectionId = port.name.split('text-processing-')[1];
    activeConnections.delete(connectionId);
  }
}

// Update message listener to use port-based communication
chrome.runtime.onConnect.addListener((port) => {
  console.log("Connection established", port.name);
  
  port.onMessage.addListener(async (msg) => {
    if (msg.type === "STOP_GENERATION") {
      const connectionId = port.name.split('text-processing-')[1];
      const connection = activeConnections.get(connectionId);
      
      if (connection) {
        connection.controller.abort();
        activeConnections.delete(connectionId);
      }
    }
    if (msg.type === "PROCESS_TEXT") {
      handleProcessText(msg.payload, port);
    }
  });

  port.onDisconnect.addListener(() => {
    const connectionId = port.name.split('text-processing-')[1];
    const connection = activeConnections.get(connectionId);
    
    if (connection) {
      connection.controller.abort();
      activeConnections.delete(connectionId);
    }
  });
}); 