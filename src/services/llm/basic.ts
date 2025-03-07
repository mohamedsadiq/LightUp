import type { ProcessTextRequest } from "~types/messages"
import { SYSTEM_PROMPTS, USER_PROMPTS } from "../../utils/constants"
import { RateLimitService } from "../rateLimit"

// The proxy endpoint URL for the basic version
const PROXY_URL = "https://www.boimaginations.com/api/v1/basic/generate";

// Add debug logging
const logDebug = (message: string, data?: any) => {
  console.log(`[Basic Service] ${message}`, data || '');
};

// Retry configuration
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const fetchWithRetry = async (url: string, options: RequestInit, retryCount = 0): Promise<Response> => {
  try {
    logDebug(`Making request to ${url}`);
    logDebug('Request options:', options);
    
    const response = await fetch(url, options);
    logDebug(`Response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      logDebug('Error response:', errorText);
    }
    
    if (response.status === 503 && retryCount < MAX_RETRIES) {
      const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
      logDebug(`Server overloaded, retrying in ${delay}ms...`);
      await sleep(delay);
      return fetchWithRetry(url, options, retryCount + 1);
    }
    
    return response;
  } catch (error) {
    logDebug('Fetch error:', error);
    if (retryCount < MAX_RETRIES) {
      const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
      logDebug(`Request failed, retrying in ${delay}ms...`);
      await sleep(delay);
      return fetchWithRetry(url, options, retryCount + 1);
    }
    throw error;
  }
};

export const processBasicText = async function*(request: ProcessTextRequest) {
  const { text, mode, settings, isFollowUp } = request
  
  logDebug('Processing text with settings:', { text, mode, settings });

  // Check rate limit
  const rateLimitService = new RateLimitService()
  
  try {
    const actionsAvailable = await rateLimitService.checkActionAvailable()
    if (!actionsAvailable) {
      throw new Error("Daily action limit reached. Please try again tomorrow. Or use your API key.");
    }
    
    const remainingActions = await rateLimitService.useAction()
    logDebug(`Actions remaining: ${remainingActions}`)
    
    const getUserPrompt = () => {
      if (isFollowUp) {
        // Include original context and previous conversation for follow-ups
        return `Context from previous conversation:\n${request.context || ''}\n\nFollow-up question:\n${text}`;
      }
      
      if (mode === "translate") {
        const translateFn = USER_PROMPTS.translate as (fromLang: string, toLang: string) => string
        return translateFn(
          settings.translationSettings?.fromLanguage || "en",
          settings.translationSettings?.toLanguage || "es"
        ) + "\n" + text
      }
      
      const prompt = USER_PROMPTS[mode]
      return typeof prompt === "function" ? prompt(text) : prompt + "\n" + text
    }
    
    const requestBody = {
      contents: [
        {
          role: "user",
          parts: [{
            text: SYSTEM_PROMPTS[mode]
          }]
        },
        {
          role: "user",
          parts: [{
            text: getUserPrompt()
          }]
        }
      ],
      model: "gemini-2.0-flash-lite-preview-02-05",
      generationConfig: {
        temperature: 0.5,
        maxOutputTokens: settings.maxTokens || 1000,
        stopSequences: []
      }
    };

    logDebug('Request body:', requestBody);

    const response = await fetchWithRetry(PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    logDebug('Response received:', { status: response.status, ok: response.ok });

    if (!response.ok) {
      if (response.status === 503) {
        throw new Error("Server is currently overloaded. Please try again in a few moments.");
      }
      const errorText = await response.text();
      logDebug('Error response:', errorText);
      throw new Error(`Basic API Error: ${response.statusText} - ${errorText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Response body is not readable');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        logDebug('Stream complete, final buffer:', buffer);
        if (buffer) {
          try {
            const data = JSON.parse(buffer);
            logDebug('Parsed final buffer:', data);
            if (Array.isArray(data)) {
              // Get the complete text first
              const fullText = data.reduce((acc, chunk) => {
                if (chunk.candidates?.[0]?.content?.parts?.[0]?.text) {
                  return acc + chunk.candidates[0].content.parts[0].text;
                }
                return acc;
              }, '');

              // Split the text into smaller chunks for streaming
              const words = fullText.split(' ');
              const chunkSize = 3; // Send 3 words at a time
              
              for (let i = 0; i < words.length; i += chunkSize) {
                const chunk = words.slice(i, i + chunkSize).join(' ');
                yield {
                  type: 'chunk',
                  content: chunk + ' ',
                  isFollowUp: request.isFollowUp,
                  id: request.id
                };
                // Add a natural typing delay
                await new Promise(resolve => setTimeout(resolve, 50));
              }
            }
          } catch (e) {
            logDebug('Failed to parse final buffer:', e);
          }
        }
        yield { 
          type: 'done',
          isFollowUp: request.isFollowUp,
          id: request.id
        };
        break;
      }

      const chunk = decoder.decode(value, { stream: true });
      logDebug('Received chunk:', chunk);
      buffer += chunk;
    }
  } catch (error) {
    logDebug('Error in processBasicText:', error);
    yield {
      type: 'error',
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
} 