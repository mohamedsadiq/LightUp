import { Storage } from "@plasmohq/storage"
import { verifyServerConnection } from "~utils/storage"
import type { ProcessTextRequest, StreamChunk, ConversationContext } from "~types/messages"
import { SYSTEM_PROMPTS, USER_PROMPTS } from "~utils/constants"
import { processGeminiText } from "~services/llm/gemini"
import { processXAIText } from "~services/llm/xai"
import { processBasicText } from "~services/llm/basic"
import type { Mode, Settings, CustomPrompts } from "~types/settings"

// Default custom prompts based on constants
const DEFAULT_CUSTOM_PROMPTS: CustomPrompts = {
  systemPrompts: {
    explain: SYSTEM_PROMPTS.explain,
    summarize: SYSTEM_PROMPTS.summarize,
    analyze: SYSTEM_PROMPTS.analyze,
    translate: SYSTEM_PROMPTS.translate,
    free: SYSTEM_PROMPTS.free
  },
  userPrompts: {
    explain: typeof USER_PROMPTS.explain === 'function' ? 'What does this mean: ${text}' : USER_PROMPTS.explain,
    summarize: typeof USER_PROMPTS.summarize === 'function' ? 'Key points from: ${text}' : USER_PROMPTS.summarize,
    analyze: typeof USER_PROMPTS.analyze === 'function' ? 'Analyze this: ${text}' : USER_PROMPTS.analyze,
    translate: typeof USER_PROMPTS.translate === 'function' ? 'Translate from ${fromLanguage} to ${toLanguage}:\n${text}' : USER_PROMPTS.translate,
    free: typeof USER_PROMPTS.free === 'function' ? '${text}' : USER_PROMPTS.free
  }
};

// Default settings for new installations
const DEFAULT_SETTINGS: Settings = {
  modelType: "basic",
  basicModel: "gemini-2.0-flash-lite-preview-02-05",
  preferredModes: ["summarize", "explain", "analyze", "free"],
  maxTokens: 2000,
  customPrompts: DEFAULT_CUSTOM_PROMPTS,
  customization: {
    showSelectedText: false,
    theme: "light",
    radicallyFocus: false,
    fontSize: "1rem",
    highlightColor: "default",
    popupAnimation: "none",
    persistHighlight: false,
    layoutMode: "sidebar",
    showGlobalActionButton: true,
    contextAwareness: false,
    activationMode: "automatic"
  }
}

// Initialize settings when extension is installed
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === "install") {
    const storage = new Storage()
    const existingSettings = await storage.get("settings")
    
    if (!existingSettings) {
      await storage.set("settings", DEFAULT_SETTINGS)
    
    }
  }
})

let activeConnections = new Map<string, {
  controller: AbortController;
  timestamp: number;
}>();

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
        const openaiKey = settings.apiKey;
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
  
  try {
    const settings = await waitForSettings();
    if (!settings) {
      throw new Error("Failed to initialize settings. Please try again.");
    }

    // No longer setting up heartbeat interval
    // Just store the connection
    activeConnections.set(connectionId, {
      controller: abortController,
      timestamp: Date.now()
    });

    // Check if connection is still active before proceeding
    if (!port) {
      throw new Error("Connection lost");
    }

    const { mode, text, context, isFollowUp, settings: requestSettings, conversationContext } = request;
    
    // Enhanced context handling
    let enhancedContext = conversationContext;
    if (isFollowUp && conversationContext) {
      // Load the stored context from storage
      const storage = new Storage();
      const storedContext = await storage.get<ConversationContext>("conversationContext");
      
      // Merge stored context with current context if available
      if (storedContext) {
        enhancedContext = {
          ...storedContext,
          history: [...storedContext.history, ...conversationContext.history],
          entities: [...storedContext.entities, ...conversationContext.entities.filter(e => 
            !storedContext.entities.some(se => se.name === e.name)
          )],
          activeEntity: conversationContext.activeEntity || storedContext.activeEntity
        };
      }
    }

    // Fix the linter error by creating a valid Settings object for validation
    const validationSettings: Settings = {
      modelType: requestSettings.modelType,
      apiKey: requestSettings.apiKey,
      serverUrl: requestSettings.serverUrl,
      geminiApiKey: requestSettings.geminiApiKey,
      xaiApiKey: requestSettings.xaiApiKey,
      customization: {
        showSelectedText: true,
        theme: "light",
        radicallyFocus: false,
        fontSize: "1rem",
        highlightColor: "default",
        popupAnimation: "scale",
        persistHighlight: false,
        layoutMode: "sidebar"
      }
    };
    
    if (!isConfigurationValid(validationSettings)) {
      throw new Error(
        `Invalid configuration for ${requestSettings?.modelType?.toUpperCase() || 'AI model'}.\n` +
        'Please check your settings and try again.'
      );
    }

    // Process text based on model type
    if (requestSettings.modelType === "basic") {
      for await (const chunk of processBasicText({
        ...request,
        conversationContext: enhancedContext
      })) {
        port.postMessage(chunk);
      }
      return;
    }

    // Check rate limits based on API key
    const apiKey = requestSettings.geminiApiKey || requestSettings.xaiApiKey || requestSettings.apiKey;
    if (apiKey) {
      checkRateLimit(apiKey);
    }

    const userMessage = isFollowUp && conversationContext
      ? `You are a direct and knowledgeable assistant. Respond naturally but efficiently.

${conversationContext.activeEntity?.name ? `Current topic: ${conversationContext.activeEntity.name}` : ''}

Last exchange:
${conversationContext.history.slice(-2).map(msg => 
  msg.role === "user" 
    ? `Q: ${msg.content}` 
    : `A: ${msg.content}`
).join('\n')}

New question: "${text}"

Guidelines:
1. Answer directly without preambles or unnecessary acknowledgments
2. If the question changes topic, simply answer the new question
3. Don't mention topic changes or previous context unless directly relevant
4. Don't apologize for not knowing something - just state what you know or don't know
5. Keep responses focused and concise`
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
          const chunkSize = 20; // Send more words at a time (increased from 15)
          
          for (let i = 0; i < words.length; i += chunkSize) {
            const chunk = words.slice(i, i + chunkSize).join(' ');
          
            port.postMessage({
              type: 'chunk',
              content: chunk + ' ',
              isFollowUp: isFollowUp,
              id: request.id
            });
            // Reduce delay to simulate faster streaming
            await new Promise(resolve => setTimeout(resolve, 5)); // Reduced from 10ms to 5ms
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
    let pendingChunks = [];
    let processingTimer = null;

    // Function to efficiently process and send accumulated chunks
    const processAndSendChunks = () => {
      if (pendingChunks.length > 0) {
        port.postMessage({ 
          type: 'chunk', 
          content: pendingChunks.join(''),
          isFollowUp: isFollowUp,
          id: request.id
        });
        pendingChunks = [];
      }
      processingTimer = null;
    };

    while (true) {
      try {
        const { done, value } = await reader.read();
        
        if (done) {
          // Process any pending chunks
          processAndSendChunks();
          
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

        // Fast processing for multiple lines at once
        for (const line of lines) {
          if (line.trim() === '') continue;
          
          try {
            const parsedLine = JSON.parse(line.replace(/^data: /, ''));
            const settings = await storage.get("settings") as Settings;
            
            if (settings?.modelType === "gemini" && parsedLine.candidates?.[0]?.content?.parts?.[0]?.text) {
              // Handle Gemini response format
              const content = parsedLine.candidates[0].content.parts[0].text;
              pendingChunks.push(content);
            } else if (parsedLine.choices?.[0]?.delta?.content) {
              // Handle other models' response format
              const content = parsedLine.choices[0].delta.content;
              pendingChunks.push(content);
            }
          } catch (e) {
            console.warn('Failed to parse streaming response:', e);
          }
        }
        
        // Send accumulated chunks every 5ms (debounced)
        if (pendingChunks.length > 0 && !processingTimer) {
          processingTimer = setTimeout(processAndSendChunks, 5);
        }
      } catch (e) {
        console.warn('Failed to parse streaming response:', e);
      }
    }

    if (requestSettings.modelType === "openai") {
      try {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let pendingChunks = [];
        let processingTimer = null;
        
        // Function to efficiently process and send accumulated chunks
        const processAndSendChunks = () => {
          if (pendingChunks.length > 0) {
            port.postMessage({
              type: 'chunk',
              content: pendingChunks.join(''),
              isFollowUp: request.isFollowUp,
              id: request.id
            });
            pendingChunks = [];
          }
          processingTimer = null;
        };
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            // Send any remaining chunks
            processAndSendChunks();
            break;
          }
          
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter(line => line.trim());
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.choices[0].delta.content) {
                  pendingChunks.push(data.choices[0].delta.content);
                }
              } catch (e) {
                console.error('Error parsing OpenAI stream chunk:', e);
              }
            }
          }
          
          // Send accumulated chunks every 5ms (debounced)
          if (pendingChunks.length > 0 && !processingTimer) {
            processingTimer = setTimeout(processAndSendChunks, 5);
          }
        }
        
        // Send done signal
        port.postMessage({
          type: 'done',
          isFollowUp: request.isFollowUp,
          id: request.id
        });
      } catch (streamError) {
        if (streamError.message?.includes('aborted')) return;
        throw streamError;
      }
    }

  } catch (error) {
    console.error("Error processing text:", error);
    
    // Send user-friendly error message
    let userMessage = "An error occurred while processing your request. Please try again.";
    
    if (error.message?.includes("rate limit")) {
      userMessage = error.message;
    } 
    else if (error.message?.includes("Server responded with")) {
      // For API server errors, provide more context
      userMessage = `API server error: ${error.message}. This might be a temporary issue with the AI provider.`;
    }
    else if (error.message?.includes("Failed to fetch") || error.message?.includes("NetworkError")) {
      userMessage = "Network connection error. Please check your internet connection and try again.";
    }
    else if (error.message?.includes("aborted")) {
      userMessage = "The request was cancelled. This might be due to a connection issue or because you navigated away.";
    }

    port.postMessage({
      type: 'error',
      error: userMessage,
      isFollowUp: request.isFollowUp,
      id: request.id
    });
  } finally {
    // Clean up
    activeConnections.delete(connectionId);
  }
}

const ONBOARDING_URL = "https://www.boimaginations.com/lightup/welcome" // Replace with your actual onboarding URL

// Create context menu item for manual activation
const createContextMenu = () => {
  // Remove existing items to avoid duplicates
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "lightup-process-text",
      title: "Process with LightUp",
      contexts: ["selection"],
    });
  });
};

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "lightup-process-text" && tab?.id) {
    chrome.tabs.sendMessage(tab.id, {
      type: "PROCESS_SELECTED_TEXT",
      selectionText: info.selectionText
    });
  }
});

// Listen for extension installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    // Open onboarding page in a new tab
    chrome.tabs.create({ url: ONBOARDING_URL });
    
    // Create context menu
    createContextMenu();
  } else {
    // Also create context menu on update or other events
    createContextMenu();
  }
});

// Listen for commands
chrome.commands.onCommand.addListener((command) => {
  if (command === "open-welcome") {
    chrome.tabs.create({ url: ONBOARDING_URL });
  } else if (command === "open-free-popup") {
    // Get the current active tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      if (activeTab && activeTab.id) {
        // Send a message to the content script to open the popup in free mode
        chrome.tabs.sendMessage(activeTab.id, {
          type: "OPEN_FREE_POPUP"
        });
      }
    });
  }
});

// Listen for port connections
chrome.runtime.onConnect.addListener((port) => {
  // Text processing ports
  if (port.name.startsWith('text-processing-')) {
    // Store the port callback reference to prevent garbage collection
    const connectionId = port.name.split('text-processing-')[1];
    
    // Set up message listener
    port.onMessage.addListener(async (request) => {
      if (request.type === "PROCESS_TEXT") {
        await handleProcessText(request.payload, port);
      } else if (request.type === "STOP_GENERATION") {
        // If we have an active generation for this connection, abort it
        if (activeConnections.has(request.connectionId)) {
          activeConnections.get(request.connectionId)?.controller.abort();
          activeConnections.delete(request.connectionId);
        }
      } else if (request.type === "PING") {
        // Simply respond to keep the connection alive
        try {
          port.postMessage({ type: "PONG" });
        } catch (e) {
          console.error("Error responding to ping:", e);
        }
      }
      // Return true to indicate we'll handle the request asynchronously
      return true;
    });
    
    // Handle port disconnect
    port.onDisconnect.addListener(() => {
      // If we have an active generation for this connection, abort it
      if (activeConnections.has(connectionId)) {
        activeConnections.get(connectionId)?.controller.abort();
        activeConnections.delete(connectionId);
      }
    });
  }
}); 