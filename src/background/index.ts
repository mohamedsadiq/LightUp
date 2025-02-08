import { Storage } from "@plasmohq/storage"
import { verifyServerConnection } from "~utils/storage"
import type { ProcessTextRequest, StreamChunk } from "~types/messages"
import { SYSTEM_PROMPTS, USER_PROMPTS } from "~utils/constants"
import { processGeminiText } from "~services/llm/gemini"
import { processXAIText } from "~services/llm/xai"
import { processBasicText } from "~services/llm/basic"

// Default settings for new installations
const DEFAULT_SETTINGS: Settings = {
  modelType: "basic",
  basicModel: "gemini-2.0-flash-lite-preview-02-05",
  customization: {
    showSelectedText: true,
    theme: "light",
    radicallyFocus: false,
    fontSize: "1rem",
    highlightColor: "default",
    popupAnimation: "scale",
    persistHighlight: false
  }
}

// Initialize settings when extension is installed
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === "install") {
    const storage = new Storage()
    const existingSettings = await storage.get("settings")
    
    if (!existingSettings) {
      await storage.set("settings", DEFAULT_SETTINGS)
      console.log("Initialized default settings for new installation")
    }
  }
})

interface Settings {
  modelType: "local" | "openai" | "gemini" | "xai" | "basic"
  serverUrl?: string
  translationSettings?: {
    fromLanguage: string
    toLanguage: string
  }
  apiKey?: string
  geminiApiKey?: string
  xaiApiKey?: string
  openaiApiKey?: string
  geminiModel?: string
  maxTokens?: number
  basicModel?: string
  customization?: {
    showSelectedText: boolean
    theme: "light" | "dark"
    radicallyFocus: boolean
    fontSize: "0.8rem" | "0.9rem" | "1rem"
    highlightColor: "default" | "orange" | "blue" | "green" | "purple" | "pink"
    popupAnimation: "none" | "scale" | "fade"
    persistHighlight: boolean
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

// Add rate limiting constants
const RATE_LIMITS = {
  REQUESTS_PER_MINUTE: 60,
  REQUESTS_PER_HOUR: 1000
};

// Rate limiting tracking
const rateLimiter = {
  requests: new Map<string, number[]>(),
  clean: () => {
    const now = Date.now();
    for (const [key, timestamps] of rateLimiter.requests.entries()) {
      const filtered = timestamps.filter(t => now - t < 60 * 60 * 1000); // Keep last hour
      if (filtered.length === 0) {
        rateLimiter.requests.delete(key);
      } else {
        rateLimiter.requests.set(key, filtered);
      }
    }
  }
};

// Clean up rate limiting data periodically
setInterval(rateLimiter.clean, 5 * 60 * 1000); // Every 5 minutes

const checkRateLimit = (apiKey: string): boolean => {
  const now = Date.now();
  const timestamps = rateLimiter.requests.get(apiKey) || [];
  
  // Clean old timestamps
  const recentTimestamps = timestamps.filter(t => now - t < 60 * 60 * 1000);
  const lastMinuteTimestamps = recentTimestamps.filter(t => now - t < 60 * 1000);

  // Check limits
  if (lastMinuteTimestamps.length >= RATE_LIMITS.REQUESTS_PER_MINUTE) {
    throw new Error("Rate limit exceeded. Please wait a minute before trying again.");
  }
  if (recentTimestamps.length >= RATE_LIMITS.REQUESTS_PER_HOUR) {
    throw new Error("Hourly rate limit exceeded. Please try again later.");
  }

  // Update timestamps
  recentTimestamps.push(now);
  rateLimiter.requests.set(apiKey, recentTimestamps);
  return true;
};

const isConfigurationValid = (settings: Settings): boolean => {
  if (!settings) {
    console.error('No settings provided');
    return false;
  }

  try {
    switch (settings.modelType) {
      case "local":
        return !!settings.serverUrl;
      case "openai": {
        const openaiKey = settings.openaiApiKey || settings.apiKey;
        return !!openaiKey && (
          openaiKey.startsWith('sk-') || 
          openaiKey.startsWith('org-') || 
          openaiKey.length >= 32 
        );
      }
      case "gemini":
        return !!settings.geminiApiKey;
      case "xai": {
        const xaiKey = settings.xaiApiKey || '';
        return xaiKey.length > 0;
      }
      case "basic":
        return true; // Basic version doesn't require configuration
      default:
        return false;
    }
  } catch (error) {
    console.error('Configuration validation error:', error);
    return false;
  }
};

const waitForSettings = async (maxAttempts = 3, delayMs = 1000): Promise<Settings | null> => {
  const storage = new Storage();
  
  for (let i = 0; i < maxAttempts; i++) {
    const settings = await storage.get("settings") as Settings;
    if (settings && isConfigurationValid(settings)) {
      return settings;
    }
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }
  return null;
};

export async function handleProcessText(request: ProcessTextRequest, port: chrome.runtime.Port) {
  const connectionId = port.name.split('text-processing-')[1];
  const abortController = new AbortController();
  let timeoutId: NodeJS.Timeout;
  
  try {
    const settings = await waitForSettings();
    if (!settings) {
      throw new Error("Failed to initialize settings. Please try again.");
    }

    // Set up request timeout
    const timeout = new Promise((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error("Request timed out. Please try again."));
      }, 30000);
    });

    activeConnections.set(connectionId, {
      controller: abortController,
      timestamp: Date.now()
    });

    const { mode, text, context, isFollowUp, settings: requestSettings } = request;
    
    if (!isConfigurationValid(requestSettings)) {
      throw new Error(
        `Invalid configuration for ${requestSettings?.modelType?.toUpperCase() || 'AI model'}.\n` +
        'Please check your settings and try again.'
      );
    }

    // Process text based on model type
    if (requestSettings.modelType === "basic") {
      for await (const chunk of processBasicText(request)) {
        port.postMessage(chunk);
      }
      return;
    }

    // Check rate limits based on API key
    const apiKey = requestSettings.geminiApiKey || requestSettings.xaiApiKey || requestSettings.apiKey || requestSettings.openaiApiKey;
    if (apiKey) {
      checkRateLimit(apiKey);
    }

    const userMessage = isFollowUp
      ? `Previous context: "${context}"\n\nFollow-up question: ${text}\n\nPlease provide a direct answer to the follow-up question.`
      : mode === "translate" && requestSettings?.translationSettings 
        ? typeof USER_PROMPTS[mode] === 'function'
          ? USER_PROMPTS[mode](text, `${requestSettings.translationSettings.fromLanguage}:${requestSettings.translationSettings.toLanguage}`)
          : text
        : typeof USER_PROMPTS[mode] === 'function' 
          ? USER_PROMPTS[mode](text, context)
          : text;

   
    const storage = new Storage();
    const globalSettings = await storage.get("settings") as Settings;
    
    const endpoint = globalSettings?.modelType === "local" 
      ? `/v1/chat/completions`
      : globalSettings?.modelType === "gemini"
        ? "/v1beta/models/gemini-pro:streamGenerateContent"
        : "/api/generate";


    let headers = { 'Content-Type': 'application/json' };
    let requestBody;
    let url = requestSettings.serverUrl;

    if (globalSettings?.modelType === "gemini") {
      headers['x-goog-api-key'] = requestSettings.geminiApiKey || '';
      url = `https://generativelanguage.googleapis.com/v1beta/models/${globalSettings.geminiModel || "gemini-pro"}:generateContent`;
      requestBody = {
        contents: [{
          parts: [{
            text: userMessage
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: requestSettings.maxTokens || 2048
        }
      };

      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(requestBody),
        signal: abortController.signal
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Gemini API error:', errorText);
        throw new Error(`Server responded with ${response.status}: ${errorText}`);
      }

      // Handle non-streaming response for now
      const data = await response.json();

      if (data.candidates && data.candidates.length > 0) {
        const candidate = data.candidates[0];
        if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
          const text = candidate.content.parts[0].text;
          
          // Split the text into smaller chunks for streaming-like behavior
          const words = text.split(' ');
          const chunkSize = 5; // Send 5 words at a time
          
          for (let i = 0; i < words.length; i += chunkSize) {
            const chunk = words.slice(i, i + chunkSize).join(' ');
          
            port.postMessage({
              type: 'chunk',
              content: chunk + ' ',
              isFollowUp: isFollowUp,
              id: request.id
            });
            // Add a small delay to simulate streaming
            await new Promise(resolve => setTimeout(resolve, 50));
          }
        } else {
          console.warn('No content in Gemini response:', data);
        }
      } else {
        console.warn('No candidates in Gemini response:', data);
      }

      port.postMessage({ 
        type: 'done',
        isFollowUp: isFollowUp,
        id: request.id
      });
      return;
    }

    if (requestSettings.modelType === "xai") {
     
      let buffer = '';
      let markdownBuffer = '';
      let isInMarkdown = false;
      let lastSentWasHeading = false;

      const cleanAndSendText = (text: string, isMarkdown = false) => {
        if (!text.trim()) return;

        // Clean the text
        let cleanedText = text
          // Remove common introductory phrases
          .replace(/^(?:Explanation of the Text:?\s*|The text (?:describes|explains|discusses):?\s*)+/i, '')
          // Remove repeated colons and dots
          .replace(/[:.]\s*[:.]\s*/g, ': ')
          // Remove duplicate content
          .replace(/(.{20,}?)\s*\1/g, '$1')
          // Fix markdown formatting
          .replace(/\*\s*\*/g, '**')
          // Fix bullet points and dashes
          .replace(/(?:^|\n)\s*[-•]\s*/g, '\n• ')
          // Fix spacing around punctuation
          .replace(/\s*([.,!?:;])\s*/g, '$1 ')
          // Remove extra spaces
          .replace(/\s+/g, ' ')
          // Fix spacing after bullet points
          .replace(/•\s+/g, '• ')
          .trim();

        // Special handling for markdown headings
        if (isMarkdown && cleanedText.startsWith('**') && cleanedText.endsWith('**')) {
          // Remove redundant punctuation in headings
          cleanedText = cleanedText.replace(/\*\*(.*?)[:.]+\s*\*\*$/, '**$1**');
          
          if (lastSentWasHeading) {
            // Skip if we just sent a heading
            return;
          }
          lastSentWasHeading = true;
        } else {
          lastSentWasHeading = false;
        }

        // Only send if we have meaningful content
        if (cleanedText.length > 2) {
          // Don't add extra punctuation to headings or bullet points
          const needsPunctuation = !cleanedText.endsWith('.') && 
                                 !cleanedText.endsWith('!') && 
                                 !cleanedText.endsWith('?') &&
                                 !cleanedText.endsWith('**') &&
                                 !cleanedText.startsWith('• ');
          
          port.postMessage({
            type: 'chunk',
            content: cleanedText + (needsPunctuation ? '. ' : ' '),
            isFollowUp: isFollowUp,
            id: request.id
          });
        }
      };

      for await (const chunk of processXAIText(request)) {
        if (chunk.type === 'chunk') {
          const text = chunk.content;
          let currentIndex = 0;

          while (currentIndex < text.length) {
            // Handle markdown sections
            if (text.substr(currentIndex, 2) === '**') {
              if (!isInMarkdown) {
                // Start of markdown
                if (buffer) {
                  cleanAndSendText(buffer);
                  buffer = '';
                }
                isInMarkdown = true;
                markdownBuffer = '**';
                currentIndex += 2;
                continue;
              } else {
                // End of markdown
                markdownBuffer += '**';
                cleanAndSendText(markdownBuffer, true);
                markdownBuffer = '';
                isInMarkdown = false;
                currentIndex += 2;
                continue;
              }
            }

            if (isInMarkdown) {
              markdownBuffer += text[currentIndex];
            } else {
              buffer += text[currentIndex];
              
              // Check for sentence end
              if (['.', '!', '?'].includes(text[currentIndex]) && 
                  (currentIndex === text.length - 1 || /\s/.test(text[currentIndex + 1]))) {
                cleanAndSendText(buffer);
                buffer = '';
              }
            }
            currentIndex++;
          }
        } else {
          // Send any remaining text
          if (buffer) {
            cleanAndSendText(buffer);
          }
          if (markdownBuffer) {
            cleanAndSendText(markdownBuffer, true);
          }
          port.postMessage({
            ...chunk,
            isFollowUp: isFollowUp,
            id: request.id
          });
        }
      }
      return;
    }

    url = requestSettings.serverUrl + endpoint;
    requestBody = {
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
    };

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
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
            port.postMessage({ 
              type: 'chunk', 
              content: buffer,
              isFollowUp: isFollowUp,
              id: request.id
            });
          }
          port.postMessage({ 
            type: 'done',
            isFollowUp: isFollowUp,
            id: request.id
          });
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim() === '') continue;
          
          const parsedLine = JSON.parse(line.replace(/^data: /, ''));
          const settings = await storage.get("settings") as Settings;
          
          if (settings?.modelType === "gemini" && parsedLine.candidates?.[0]?.content?.parts?.[0]?.text) {
            // Handle Gemini response format
            const content = parsedLine.candidates[0].content.parts[0].text;
            port.postMessage({ 
              type: 'chunk', 
              content: content,
              isFollowUp: isFollowUp,
              id: request.id
            });
          } else if (parsedLine.choices?.[0]?.delta?.content) {
            // Handle other models' response format
            const content = parsedLine.choices[0].delta.content;
            
            if (isFirstChunk) {
              isFirstChunk = false;
            }

            port.postMessage({ 
              type: 'chunk', 
              content: content,
              isFollowUp: isFollowUp,
              id: request.id
            });
          }
        }
      } catch (e) {
        console.warn('Failed to parse streaming response:', e);
      }
    }

    if (requestSettings.modelType === "openai") {
      try {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter(line => line.trim());
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.choices[0].delta.content) {
                  port.postMessage({
                    type: 'chunk',
                    content: data.choices[0].delta.content,
                    isFollowUp: request.isFollowUp,
                    id: request.id
                  });
                }
              } catch (e) {
                console.error('Error parsing OpenAI stream chunk:', e);
              }
            }
          }
        }
      } catch (streamError) {
        if (streamError.message?.includes('aborted')) return;
        throw streamError;
      }
    }

  } catch (error) {
    console.error("Error processing text:", error);
    
    // Send user-friendly error message
    const userMessage = error.message.includes("rate limit")
      ? error.message
      : error.message.includes("timeout")
      ? "Request timed out. Please try again."
      : "An error occurred while processing your request. Please try again.";

    port.postMessage({
      type: 'error',
      error: userMessage,
      isFollowUp: request.isFollowUp,
      id: request.id
    });
  } finally {
    // Clean up
    clearTimeout(timeoutId);
    activeConnections.delete(connectionId);
  }
}

const ONBOARDING_URL = "https://www.boimaginations.com/lightup/welcome" // Replace with your actual onboarding URL

// Listen for extension installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    // Open onboarding page in a new tab
    chrome.tabs.create({ url: ONBOARDING_URL });
  }
});

// Update message listener to use port-based communication
chrome.runtime.onConnect.addListener((port) => {
  console.log("[Background] New connection established:", port.name);
  
  port.onMessage.addListener(async (msg) => {
    console.log("[Background] Received message:", msg);
    
    if (msg.type === "STOP_GENERATION") {
      const connectionId = port.name.split('text-processing-')[1];
      console.log("[Background] Stopping generation for:", connectionId);
      const connection = activeConnections.get(connectionId);
      
      if (connection) {
        connection.controller.abort();
        activeConnections.delete(connectionId);
      }
    }
    if (msg.type === "PROCESS_TEXT") {
      console.log("[Background] Processing text request:", {
        mode: msg.payload.mode,
        modelType: msg.payload.settings?.modelType,
        text: msg.payload.text?.substring(0, 100) + "..."
      });
      handleProcessText(msg.payload, port).catch(error => {
        console.error("[Background] Error processing text:", error);
        port.postMessage({
          type: 'error',
          error: error.message || 'Unknown error occurred'
        });
      });
    }
  });

  port.onDisconnect.addListener(() => {
    console.log("[Background] Port disconnected:", port.name);
    const connectionId = port.name.split('text-processing-')[1];
    const connection = activeConnections.get(connectionId);
    
    if (connection) {
      connection.controller.abort();
      activeConnections.delete(connectionId);
    }
  });
}); 