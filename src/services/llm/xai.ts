import type { ProcessTextRequest } from "~types/messages"
import { SYSTEM_PROMPTS, USER_PROMPTS, FOLLOW_UP_SYSTEM_PROMPTS } from "../../utils/constants"

// Enhanced error types for better error handling
interface XAIError {
  error: {
    message: string;
    type: string;
    param?: string;
    code?: string;
  };
}

// Rate limiting and retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2
};

// Enhanced request parameters interface
interface XAIRequestParams {
  messages: Array<{
    role: "system" | "user" | "assistant";
    content: string;
  }>;
  model: string;
  stream: boolean;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  top_k?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  repetition_penalty?: number;
  seed?: number;
  stop?: string | string[];
  user?: string;
  reasoning_effort?: "low" | "medium" | "high";
  response_format?: {
    type: "text" | "json_object";
  };
}

// Utility function for exponential backoff
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Enhanced retry logic with exponential backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  retries: number = RETRY_CONFIG.maxRetries
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) throw error;
    
    // Check if error is retryable
    const isRetryable = error instanceof Error && (
      error.message.includes('rate limit') ||
      error.message.includes('timeout') ||
      error.message.includes('503') ||
      error.message.includes('502') ||
      error.message.includes('500')
    );
    
    if (!isRetryable) throw error;
    
    const delayMs = Math.min(
      RETRY_CONFIG.baseDelay * Math.pow(RETRY_CONFIG.backoffFactor, RETRY_CONFIG.maxRetries - retries),
      RETRY_CONFIG.maxDelay
    );
    
    console.warn(`xAI API request failed, retrying in ${delayMs}ms... (${retries} retries left)`);
    await delay(delayMs);
    
    return retryWithBackoff(fn, retries - 1);
  }
}

export const processXAIText = async function*(request: ProcessTextRequest) {
  const { text, mode, context, isFollowUp, settings } = request;
  
  try {
    // Validate API key
    if (!settings.xaiApiKey || settings.xaiApiKey.trim() === '') {
      throw new Error('❌ xAI API key is missing. Please add your API key in the extension settings.');
    }

    // Enhanced API key format validation
    const apiKey = settings.xaiApiKey.trim();
    
    if (!apiKey.startsWith('xai-')) {
      throw new Error('❌ Invalid xAI API key format. xAI API keys must start with "xai-". Please check your API key in settings.');
    }
    
    if (apiKey.length < 50) {
      throw new Error('❌ xAI API key appears to be incomplete. xAI API keys are typically 64+ characters long. Please verify your complete API key.');
    }
    
    if (apiKey.includes(' ') || apiKey.includes('\n') || apiKey.includes('\t')) {
      throw new Error('❌ xAI API key contains invalid characters (spaces, tabs, or line breaks). Please copy the key carefully without extra whitespace.');
    }
    
    // Log successful validation (without exposing the key)
    console.log('✅ xAI API key format validation passed');
    console.log(`API key length: ${apiKey.length} characters`);
    console.log(`API key prefix: ${apiKey.substring(0, 8)}...`);

    // Get the system prompt (custom or default)
    const getSystemPrompt = (): string => {
      if (isFollowUp) {
        if (settings.customPrompts?.systemPrompts?.[mode]) {
          return `${settings.customPrompts.systemPrompts[mode]} 

FOLLOW-UP CONTEXT: You are continuing the conversation. The user is asking a follow-up question about the same content. Maintain your expertise and perspective while providing fresh insights.`;
        }
        return FOLLOW_UP_SYSTEM_PROMPTS[mode] || FOLLOW_UP_SYSTEM_PROMPTS.free;
      }
      
      if (settings.customPrompts?.systemPrompts?.[mode]) {
        return settings.customPrompts.systemPrompts[mode];
      }
      return SYSTEM_PROMPTS[mode];
    };

    // Get the user prompt (custom or default)
    const getUserPrompt = (): string => {
      if (isFollowUp) {
        const contextText = context || '';
        const originalContent = contextText.length > 500 ? contextText.substring(0, 500) + "..." : contextText;
        
        return `ORIGINAL CONTENT CONTEXT:
${originalContent}

FOLLOW-UP QUESTION: ${text}

Instructions: Build on your previous analysis/explanation of this content. If the question asks for "more" or "other" aspects (like "what else is strange/unusual/problematic"), provide genuinely new insights you haven't covered yet. Avoid repeating previous points unless directly relevant to the new question.`;
      }
      
      if (mode === "translate") {
        if (settings.customPrompts?.userPrompts?.[mode]) {
          const customPrompt = settings.customPrompts.userPrompts[mode];
          return customPrompt
            .replace('${fromLanguage}', settings.translationSettings?.fromLanguage || "en")
            .replace('${toLanguage}', settings.translationSettings?.toLanguage || "es")
            .replace('${text}', text);
        }
        
        return `Translate the following text from ${settings.translationSettings?.fromLanguage || "en"} to ${settings.translationSettings?.toLanguage || "es"}:\n\n${text}`;
      }
      
      if (settings.customPrompts?.userPrompts?.[mode]) {
        return settings.customPrompts.userPrompts[mode].replace('${text}', text);
      }
      
      return `${typeof USER_PROMPTS[mode] === 'function' ? USER_PROMPTS[mode](text) : USER_PROMPTS[mode]}\n${text}`;
    };

    // Build messages array
    const messages = [
      {
        role: "system" as const,
        content: getSystemPrompt()
      },
      {
        role: "user" as const,
        content: getUserPrompt()
      }
    ];

    // Enhanced request parameters with latest API features
    const requestParams: XAIRequestParams = {
      messages,
      model: settings.grokModel || "grok-3", // ✅ Correct: No xai/ prefix needed
      stream: true,
      temperature: settings.temperature ?? 0.7,
      max_tokens: settings.maxTokens || 4096,
      top_p: 0.9,
      frequency_penalty: 0,
      presence_penalty: 0,
      user: request.connectionId || 'lightup-extension'
    };

    // Add reasoning effort for supported models
    if (settings.grokModel?.includes('grok-3')) {
      requestParams.reasoning_effort = "medium";
    }

    // Add response format for structured outputs if needed
    if (mode === "analyze" || mode === "summarize") {
      requestParams.response_format = { type: "text" };
    }

    // Add seed for deterministic outputs in certain modes
    if (mode === "translate") {
      requestParams.seed = 42;
    }

    // Make API request with retry logic
    const response = await retryWithBackoff(async () => {
      const res = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'User-Agent': 'LightUp-Extension/1.0',
          'X-Request-ID': request.id || Date.now().toString()
        },
        body: JSON.stringify(requestParams),
        signal: AbortSignal.timeout(30000) // 30 second timeout
      });

      if (!res.ok) {
        let errorMessage = `xAI API Error: ${res.status} ${res.statusText}`;
        let errorDetails: XAIError | null = null;
        
        try {
          errorDetails = await res.json() as XAIError;
          console.error('xAI Error Response:', errorDetails);
          
          // Enhanced error messages based on error type
          if (errorDetails.error) {
            switch (errorDetails.error.type) {
              case 'invalid_request_error':
                errorMessage = `Invalid request: ${errorDetails.error.message}`;
                break;
              case 'authentication_error':
                errorMessage = 'Invalid API key. Please check your xAI API key in settings.';
                break;
              case 'permission_error':
                errorMessage = 'Permission denied. Your API key may not have access to this model.';
                break;
              case 'forbidden':
                errorMessage = 'Access forbidden. This could be due to: invalid API key, insufficient permissions, geographic restrictions, or account issues. Please verify your API key and account status.';
                break;
              case 'rate_limit_error':
                errorMessage = 'Rate limit exceeded. Please try again in a moment.';
                break;
              case 'server_error':
                errorMessage = 'xAI server error. Please try again later.';
                break;
              default:
                errorMessage = errorDetails.error.message || errorMessage;
            }
          }
          
          // Special handling for 403 errors
          if (res.status === 403) {
            errorMessage = `Access Forbidden (403): ${errorDetails?.error?.message || 'Your request was denied'}. 

Possible causes:
• Invalid or expired API key
• Insufficient permissions for model "${requestParams.model}"
• Geographic or network restrictions (try disabling VPN)
• Account billing or suspension issues
• Corporate firewall blocking the request

Please verify your API key and account status at x.ai`;
          }
        } catch (parseError) {
          console.warn('Could not parse error response:', parseError);
        }
        
        throw new Error(errorMessage);
      }

      return res;
    });

    // Enhanced streaming with better error handling
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Response body is not readable');
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let totalContent = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          // Send any remaining buffer content
          if (buffer.trim()) {
            yield { 
              type: 'chunk', 
              content: buffer,
              isFollowUp: request.isFollowUp,
              id: request.id
            };
          }
          
          yield { 
            type: 'done',
            isFollowUp: request.isFollowUp,
            id: request.id,
            totalTokens: totalContent.split(' ').length // Approximate token count
          };
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        
        // Process complete lines
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine || trimmedLine === 'data: [DONE]') continue;
          
          if (trimmedLine.startsWith('data: ')) {
            try {
              const jsonStr = trimmedLine.slice(6); // Remove 'data: ' prefix
              const data = JSON.parse(jsonStr);
              
              // Handle different response formats
              const delta = data.choices?.[0]?.delta;
              let content = '';
              
              // Support both content and reasoning_content
              if (typeof delta?.content === 'string') {
                content = delta.content;
              } else if (typeof delta?.reasoning_content === 'string') {
                content = delta.reasoning_content;
              }
              
              if (content) {
                totalContent += content;
                yield { 
                  type: 'chunk', 
                  content,
                  isFollowUp: request.isFollowUp,
                  id: request.id
                };
              }
              
              // Handle completion
              if (data.choices?.[0]?.finish_reason) {
                yield { 
                  type: 'done',
                  isFollowUp: request.isFollowUp,
                  id: request.id,
                  finishReason: data.choices[0].finish_reason,
                  totalTokens: data.usage?.total_tokens || totalContent.split(' ').length
                };
                return;
              }
              
            } catch (parseError) {
              console.warn('Failed to parse streaming response line:', trimmedLine, parseError);
              // Continue processing other lines instead of failing completely
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

  } catch (error) {
    console.error('xAI Processing Error:', error);
    
    // Enhanced error reporting
    let errorMessage = 'Unknown error occurred';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    
    yield {
      type: 'error',
      error: errorMessage,
      isFollowUp: request.isFollowUp,
      id: request.id
    };
  }
}

// Helper function to test xAI API key validity
export async function testXAIApiKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
  try {
    // Basic format validation first
    if (!apiKey || !apiKey.startsWith('xai-') || apiKey.length < 50) {
      return { 
        valid: false, 
        error: 'Invalid API key format. xAI keys must start with "xai-" and be 50+ characters long.' 
      };
    }

    // Test with a minimal request
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey.trim()}`,
        'User-Agent': 'LightUp-Extension/1.0'
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Hi' }],
        model: 'grok-3',
        max_tokens: 1,
        stream: false
      })
    });

    if (response.ok) {
      return { valid: true };
    } else if (response.status === 401) {
      return { valid: false, error: 'Invalid API key - authentication failed' };
    } else if (response.status === 403) {
      return { valid: false, error: 'API key valid but access forbidden - check permissions' };
    } else {
      const errorText = await response.text();
      return { valid: false, error: `API test failed: ${response.status} ${errorText}` };
    }
  } catch (error) {
    return { 
      valid: false, 
      error: `Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
} 