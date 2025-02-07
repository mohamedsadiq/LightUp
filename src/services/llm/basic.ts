import type { ProcessTextRequest } from "~types/messages"
import { SYSTEM_PROMPTS, USER_PROMPTS } from "../../utils/constants"
import { RateLimitService } from "../rateLimit"

const rateLimitService = new RateLimitService()

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
  const { text, mode, settings } = request
  
  try {
    // Check rate limit for basic version
    const rateLimitCheck = await rateLimitService.checkRateLimit()
    if (!rateLimitCheck.allowed) {
      yield {
        type: 'error',
        error: rateLimitCheck.error || 'Rate limit exceeded'
      }
      return
    }

    logDebug('Processing text with settings:', { text, mode, settings });
  
    const getUserPrompt = () => {
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
  
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${settings.basicModel}:streamGenerateContent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': process.env.PLASMO_PUBLIC_BASIC_API_KEY || ''
      },
      body: JSON.stringify({
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
        generationConfig: {
          temperature: 0.5,
          maxOutputTokens: settings.maxTokens || 1000,
          stopSequences: []
        }
      })
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`)
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('Response body is not readable')
    }

    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      
      if (done) {
        if (buffer) {
          yield { 
            type: 'chunk', 
            content: buffer,
            isFollowUp: request.isFollowUp,
            id: request.id
          }
        }
        yield { 
          type: 'done',
          isFollowUp: request.isFollowUp,
          id: request.id
        }
        break
      }

      buffer += decoder.decode(value, { stream: true })
      
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.trim() === '') continue
        
        try {
          const data = JSON.parse(line)
          if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
            yield { 
              type: 'chunk', 
              content: data.candidates[0].content.parts[0].text,
              isFollowUp: request.isFollowUp,
              id: request.id
            }
          }
        } catch (e) {
          console.warn('Failed to parse line:', line)
        }
      }
    }
  } catch (error) {
    logDebug('Error in processBasicText:', error);
    yield {
      type: 'error',
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
} 