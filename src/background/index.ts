import { Storage } from "@plasmohq/storage"
import { verifyServerConnection } from "~utils/storage"
import type { ProcessTextRequest, StreamChunk, ConversationContext } from "~types/messages"
import { SYSTEM_PROMPTS, USER_PROMPTS } from "~utils/constants"
// New unified AI service (preferred)
import { unifiedAIService } from "~services/llm/UnifiedAIService"
import type { Mode, Settings, CustomPrompts } from "~types/settings"

// Feature flag for new architecture
const USE_UNIFIED_AI_SERVICE = true;

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
  basicModel: "grok-4-1-fast-non-reasoning",
  openaiModel: "gpt-5.2",
  geminiModel: "gemini-3-flash",
  grokModel: "grok-4",
  preferredModes: ["explain", "summarize", "translate"],
  maxTokens: 2000,
  customPrompts: DEFAULT_CUSTOM_PROMPTS,
  translationSettings: {
    fromLanguage: "en",
    toLanguage: "es"
  },
  customization: {
    showSelectedText: false,
    theme: "system",
    radicallyFocus: false,
    fontSize: "medium",
    highlightColor: "default",
    popupAnimation: "none",
    persistHighlight: false,
    layoutMode: "floating",
    showGlobalActionButton: true,
    contextAwareness: false,
    activationMode: "manual",
    enablePDFSupport: false,
    showTextSelectionButton: true,
    automaticActivation: false,
    showWebsiteInfo: false,
    sidebarPinned: false
  }
}

// Initialize settings when extension is installed
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === "install") {
    const storage = new Storage()
    const existingSettings = await storage.get("settings")
    const onboardingComplete = await storage.get("onboardingComplete")

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
        // Enhanced xAI API key validation
        if (!xaiKey || xaiKey.trim().length === 0) {
          console.error('xAI API key is missing or empty');
          return false;
        }

        // Check if API key has the correct format
        if (!xaiKey.startsWith('xai-')) {
          console.error('xAI API key must start with "xai-"');
          return false;
        }

        // Check minimum length (xAI keys are typically 64+ characters)
        if (xaiKey.length < 50) {
          console.error('xAI API key appears to be too short');
          return false;
        }

        // Check for common formatting issues
        if (xaiKey.includes(' ') || xaiKey.includes('\n') || xaiKey.includes('\t')) {
          console.error('xAI API key contains invalid whitespace characters');
          return false;
        }

        console.log('xAI API key validation passed');
        return true;
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

const waitForSettings = async (maxAttempts = 3, delayMs = 100): Promise<Settings | null> => {
  const storage = new Storage();

  for (let i = 0; i < maxAttempts; i++) {
    const settings = await storage.get("settings") as Settings;
    if (settings && isConfigurationValid(settings)) {
      return settings;
    }
    // Only wait on retry, not first attempt - use short delay for faster recovery
    if (i < maxAttempts - 1) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
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

    // Store the connection
    activeConnections.set(connectionId, {
      controller: abortController,
      timestamp: Date.now()
    });

    // Check if connection is still active before proceeding
    if (!port) {
      throw new Error("Connection lost");
    }

    let { mode, text, context, isFollowUp, settings: requestSettings, conversationContext } = request;

    // Apply text cleaning for translate mode
    if (mode === 'translate' && text) {
      text = text
        .replace(/\{"props":\{[^}]*\}[^}]*\}/g, '')
        .replace(/window\.__NEXT_DATA__\s*=\s*\{[^}]*\}/g, '')
        .replace(/\{"page":"[^"]*","query":\{[^}]*\}[^}]*\}/g, '')
        .replace(/window\.dataLayer\s*=\s*window\.dataLayer\s*\|\|\s*\[\]\s*;?/g, '')
        .replace(/function\s+gtag\(\)\s*\{[^}]*\}/g, '')
        .replace(/gtag\([^)]*\)\s*;?/g, '')
        .replace(/ga\([^)]*\)\s*;?/g, '')
        .replace(/fbq\([^)]*\)\s*;?/g, '')
        .replace(/buildId:\s*["'][^"']*["']/g, '')
        .replace(/nextExport:\s*(?:true|false)/g, '')
        .replace(/autoExport:\s*(?:true|false)/g, '')
        .replace(/isFallback:\s*(?:true|false)/g, '')
        .replace(/locale:\s*["'][^"']*["']/g, '')
        .replace(/locales:\s*\[[^\]]*\]/g, '')
        .replace(/defaultLocale:\s*["'][^"']*["']/g, '')
        .replace(/scriptLoader:\s*\{[^}]*\}/g, '')
        .replace(/\s*\n\s*\n\s*/g, '\n\n')
        .replace(/[ \t]+/g, ' ')
        .replace(/^\s+|\s+$/gm, '')
        .trim();

      if (!text || text.length < 3) {
        throw new Error("Selected text appears to contain only technical content and cannot be translated.");
      }
    }

    // Enhanced context handling
    let enhancedContext = conversationContext;
    if (isFollowUp && conversationContext) {
      const storage = new Storage();
      const storedContext = await storage.get<ConversationContext>("conversationContext");

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

    // Validate configuration
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
        fontSize: "16px",
        highlightColor: "default",
        popupAnimation: "slide",
        persistHighlight: false,
        layoutMode: "sidebar",
        enablePDFSupport: false,
        showTextSelectionButton: true,
        showGlobalActionButton: true,
        contextAwareness: false,
        activationMode: "manual",
        automaticActivation: false
      }
    };

    if (!isConfigurationValid(validationSettings)) {
      throw new Error(
        `Invalid configuration for ${requestSettings?.modelType?.toUpperCase() || 'AI model'}.\n` +
        'Please check your settings and try again.'
      );
    }

    // Check rate limits
    const apiKey = requestSettings.geminiApiKey || requestSettings.xaiApiKey || requestSettings.apiKey;
    if (apiKey) {
      checkRateLimit(apiKey);
    }

    // Get domain from sender for conversation isolation
    const domain = port.sender?.tab?.url
      ? new URL(port.sender.tab.url).hostname
      : 'unknown';

    if (USE_UNIFIED_AI_SERVICE) {
      // New unified AI service with persistent context
      const mergedSettings = { ...settings, ...requestSettings } as Settings;

      if (!unifiedAIService.isInitialized() || unifiedAIService.getCurrentDomain() !== domain) {
        await unifiedAIService.initialize(domain, mergedSettings);
      }

      for await (const chunk of unifiedAIService.processText({
        text,
        mode,
        settings: { ...settings, ...requestSettings } as Settings,
        domain,
        isFollowUp,
        context,
        connectionId,
        id: request.id
      })) {
        port.postMessage(chunk);
      }
    } else {
      throw new Error("Legacy AI service is no longer available. Please enable USE_UNIFIED_AI_SERVICE.");
    }

  } catch (error) {
    console.error('Error in handleProcessText:', error);

    // Clean up connection
    if (activeConnections.has(connectionId)) {
      activeConnections.delete(connectionId);
    }

    // Send user-friendly error message
    let userMessage = "An error occurred while processing your request. Please try again.";

    if (error.message?.includes("rate limit")) {
      userMessage = error.message;
    } else if (error.message?.includes("Server responded with")) {
      userMessage = `API server error: ${error.message}. This might be a temporary issue with the AI provider.`;
    } else if (error.message?.includes("Failed to fetch") || error.message?.includes("NetworkError")) {
      userMessage = "Network connection error. Please check your internet connection and try again.";
    } else if (error.message?.includes("aborted")) {
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
    requestLoadUI(tab.id)
    // Delay to allow UI bundle to load, then deliver selection text
    setTimeout(() => {
      chrome.tabs.sendMessage(tab.id!, {
        type: "PROCESS_SELECTED_TEXT",
        selectionText: info.selectionText
      })
    }, 300)
  }
})

// Listen for extension installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    // Open options page with onboarding on first install
    chrome.runtime.openOptionsPage();

    // Create context menu
    createContextMenu();
  } else {
    // Also create context menu on update or other events
    createContextMenu();
  }
});

// Utility to request the content UI to load on-demand
const requestLoadUI = (tabId: number) => {
  chrome.tabs.sendMessage(tabId, { type: "LOAD_LIGHTUP_UI" }).catch(() => {
    /* The loader may not be injected yet (first page load). Since loader is declarative content script, message will be delivered once ready */
  })
}

// Handle toolbar (action) click to open LightUp
chrome.action.onClicked.addListener((tab) => {
  if (tab.id !== undefined) {
    requestLoadUI(tab.id)
  }
})

// Listen for commands
chrome.commands.onCommand.addListener((command) => {
  if (command === "open-welcome") {
    chrome.runtime.openOptionsPage()
  } else if (command === "open-free-popup") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0]
      if (activeTab?.id) {
        // Ensure UI is loaded, then request free popup
        requestLoadUI(activeTab.id)
        chrome.tabs.sendMessage(activeTab.id, { type: "OPEN_FREE_POPUP" })
      }
    })
  }
})

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