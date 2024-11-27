import { Storage } from "@plasmohq/storage"
import { verifyServerConnection } from "~utils/storage"
import type { ProcessTextRequest, StreamChunk } from "~types/messages"
import { SYSTEM_PROMPTS, USER_PROMPTS } from "~utils/constants"

interface Settings {
  modelType: "local" | "cloud"
  serverUrl?: string
}

export async function handleProcessText(request: ProcessTextRequest, port: chrome.runtime.Port) {
  try {
    const { mode, text, context, isFollowUp } = request;
    const storage = new Storage()
    const settings = await storage.get("settings") as Settings
    
    if (!settings) {
      port.postMessage({ type: 'error', error: "Extension not configured. Please visit the options page." });
      return;
    }

    console.log('Processing request:', { mode, text, context, isFollowUp });

    const endpoint = settings.modelType === "local" 
      ? `/v1/chat/completions`
      : "/api/generate";

    const userMessage = isFollowUp
      ? `Previous context: "${context}"\n\nFollow-up question: ${text}\n\nPlease provide a direct answer to the follow-up question.`
      : text;

    console.log('Sending message to LLM:', userMessage);

    const response = await fetch(settings.serverUrl + endpoint, {
      method: 'POST',
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
      })
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
          } else {
            console.warn('Empty or invalid chunk received:', chunk);
          }
        } catch (e) {
          console.warn('Failed to parse streaming response:', e);
        }
      }
    }

  } catch (error) {
    console.error('Processing error:', error);
    port.postMessage({ 
      type: 'error', 
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
}

// Update message listener to use port-based communication
chrome.runtime.onConnect.addListener((port) => {
  if (port.name === "text-processing") {
    port.onMessage.addListener((message) => {
      if (message.type === "PROCESS_TEXT") {
        handleProcessText(message.payload, port);
      }
    });
  }
}); 