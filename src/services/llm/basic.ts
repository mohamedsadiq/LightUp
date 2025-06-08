import type { ProcessTextRequest } from "~types/messages"
import { SYSTEM_PROMPTS, USER_PROMPTS, FOLLOW_UP_SYSTEM_PROMPTS } from "../../utils/constants"
import { RateLimitService } from "../rateLimit"

// The proxy endpoint URL for the basic version
const PROXY_URL = "https://www.boimaginations.com/api/v1/basic/generate";

// Add debug logging (disabled for production)
const logDebug = (message: string, data?: any) => {
  // console.log(`[Basic Service] ${message}`, data || '');
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
    
    // Get the system prompt (custom or default)
    const getSystemPrompt = () => {
      // For follow-up questions, use enhanced context-aware prompts
      if (isFollowUp) {
        // If custom system prompt is available for follow-ups, use it
        if (settings.customPrompts?.systemPrompts?.[mode]) {
          return `${settings.customPrompts.systemPrompts[mode]} 

FOLLOW-UP CONTEXT: You are continuing the conversation. The user is asking a follow-up question about the same content. Maintain your expertise and perspective while providing fresh insights.`;
        }
        // Otherwise use enhanced follow-up prompt
        return FOLLOW_UP_SYSTEM_PROMPTS[mode] || FOLLOW_UP_SYSTEM_PROMPTS.free;
      }
      
      // If custom system prompt is available, use it
      if (settings.customPrompts?.systemPrompts?.[mode]) {
        return settings.customPrompts.systemPrompts[mode];
      }
      // Otherwise use default
      return SYSTEM_PROMPTS[mode];
    };

    const getUserPrompt = () => {
      if (isFollowUp) {
        // Include rich context for follow-ups with original content and conversation history
        const contextText = request.context || '';
        const originalContent = contextText.length > 500 ? contextText.substring(0, 500) + "..." : contextText;
        
        return `ORIGINAL CONTENT CONTEXT:
${originalContent}

FOLLOW-UP QUESTION: ${text}

Instructions: Build on your previous analysis/explanation of this content. If the question asks for "more" or "other" aspects (like "what else is strange/unusual/problematic"), provide genuinely new insights you haven't covered yet. Avoid repeating previous points unless directly relevant to the new question.`;
      }
      
      // For translate mode
      if (mode === "translate") {
        // Use custom user prompt if available
        if (settings.customPrompts?.userPrompts?.[mode]) {
          const customPrompt = settings.customPrompts.userPrompts[mode];
          return customPrompt
            .replace('${fromLanguage}', settings.translationSettings?.fromLanguage || "en")
            .replace('${toLanguage}', settings.translationSettings?.toLanguage || "es")
            .replace('${text}', text);
        }
        
        // Otherwise use default
        const translateFn = USER_PROMPTS.translate as (fromLang: string, toLang: string) => string
        return translateFn(
          settings.translationSettings?.fromLanguage || "en",
          settings.translationSettings?.toLanguage || "es"
        ) + "\n" + text;
      }
      
      // For other modes
      if (settings.customPrompts?.userPrompts?.[mode]) {
        // Use custom user prompt if available
        return settings.customPrompts.userPrompts[mode].replace('${text}', text);
      }
      
      // Otherwise use default
      const prompt = USER_PROMPTS[mode];
      return typeof prompt === "function" ? prompt(text) : prompt + "\n" + text;
    };
    
    const requestBody = {
      contents: [
        {
          role: "user",
          parts: [{
            text: getSystemPrompt()
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
              const chunkSize = 10; // Send 10 words at a time instead of 3
              
              for (let i = 0; i < words.length; i += chunkSize) {
                const chunk = words.slice(i, i + chunkSize).join(' ');
                yield {
                  type: 'chunk',
                  content: chunk + ' ',
                  isFollowUp: request.isFollowUp,
                  id: request.id
                };
                // Reduce typing delay for faster appearance
                await new Promise(resolve => setTimeout(resolve, 10)); // 10ms instead of 50ms
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