import { Storage } from "@plasmohq/storage"
import { verifyServerConnection } from "~utils/storage"
import type { ProcessTextRequest, StreamChunk } from "~types/messages"
import { SYSTEM_PROMPTS, USER_PROMPTS } from "~utils/constants"

interface Settings {
  modelType: "local" | "cloud"
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
    
    const endpoint = globalSettings?.modelType === "local" 
      ? `/v1/chat/completions`
      : "/api/generate";

    const userMessage = isFollowUp
      ? `Previous context: "${context}"\n\nFollow-up question: ${text}\n\nPlease provide a direct answer to the follow-up question.`
      : mode === "translate" && settings?.translationSettings 
        ? `Translate the following text from ${settings.translationSettings.fromLanguage} to ${settings.translationSettings.toLanguage}:\n\n${text}`
        : typeof USER_PROMPTS[mode] === 'function' 
          ? USER_PROMPTS[mode](text, context)
          : text;

    console.log('Sending message to LLM:', userMessage);

    const response = await fetch(`${settings.serverUrl}${endpoint}`, {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "llama-3.2-3b-instruct",
        messages: [
          {
            role: "system",
            content: SYSTEM_PROMPTS[mode]
          },
          {
            role: "user",
            content: userMessage
          }
        ],
        stream: true
      }),
      signal: abortController.signal
    });

    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Response body is not readable');
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let isFirstChunk = true;

    while (true) {
      try {
        const { done, value } = await reader.read();
        
        if (done) {
          if (buffer) {
            port.postMessage({ type: 'chunk', content: buffer });
          }
          port.postMessage({ type: 'done' });
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim() === '') continue;
          
          try {
            const chunk = JSON.parse(line.replace(/^data: /, ''));
            if (chunk.choices?.[0]?.delta?.content) {
              const content = chunk.choices[0].delta.content;
              
              if (isFirstChunk) {
                console.log('First chunk content:', content);
                isFirstChunk = false;
              }

              port.postMessage({ 
                type: 'chunk', 
                content: content,
                isFollowUp: isFollowUp
              });
            }
          } catch (e) {
            console.warn('Failed to parse streaming response:', e);
          }
        }
      } catch (streamError) {
        // Check if the error is due to an aborted stream
        if (streamError.message?.includes('aborted') || 
            streamError.name === 'AbortError' || 
            streamError.message?.includes('BodyStreamBuffer was aborted')) {
          console.log('Stream was intentionally aborted');
          port.postMessage({ 
            type: 'aborted',
            error: 'Request was cancelled'
          });
          return;
        }
        throw streamError; // Re-throw other errors
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