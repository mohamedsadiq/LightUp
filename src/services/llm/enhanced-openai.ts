import type { ProcessTextRequest } from "~types/messages";
import { SYSTEM_PROMPTS, USER_PROMPTS, FOLLOW_UP_SYSTEM_PROMPTS, getMaxTokensFromPromptOrSetting } from "../../utils/constants";
import { getSelectedLocale } from "../../utils/i18n";
import { useEnhancedConversation } from "~hooks/useLangChainConversation";

/**
 * Enhanced OpenAI service with LangChain-style conversational memory
 * Fixes the context loss issues while maintaining compatibility with existing streaming interface
 */

export interface EnhancedProcessTextRequest extends ProcessTextRequest {
  // Enhanced conversation context
  enhancedContext?: {
    systemPrompt: string;
    userPrompt: string;
    hasContext: boolean;
    contextQuality: "excellent" | "good" | "basic" | "none";
  };
}

export const processEnhancedOpenAIText = async function*(request: EnhancedProcessTextRequest) {
  const { text, mode, settings, isFollowUp, enhancedContext } = request;
  
  // Get the user's selected language for AI responses
  const responseLanguage = settings.aiResponseLanguage || await getSelectedLocale();
  
  try {
    // Use enhanced context if available, otherwise fall back to standard prompts
    const getSystemPrompt = () => {
      if (enhancedContext) {
        return enhancedContext.systemPrompt;
      }
      
      // Language instruction to add to all system prompts
      const languageInstruction = responseLanguage !== "en" 
        ? `\n\nIMPORTANT: Respond in ${responseLanguage} language. Adapt your response to be culturally appropriate for speakers of this language.` 
        : "";
        
      // For follow-up questions, use enhanced context-aware prompts
      if (isFollowUp) {
        if (settings.customPrompts?.systemPrompts?.[mode]) {
          return `${settings.customPrompts.systemPrompts[mode]} 

FOLLOW-UP CONTEXT: You are continuing the conversation. The user is asking a follow-up question about the same content. Maintain your expertise and perspective while providing fresh insights.${languageInstruction}`;
        }
        const basePrompt = FOLLOW_UP_SYSTEM_PROMPTS[mode] || FOLLOW_UP_SYSTEM_PROMPTS.free;
        return basePrompt + languageInstruction;
      }
      
      // If custom system prompt is available, use it
      if (settings.customPrompts?.systemPrompts?.[mode]) {
        return settings.customPrompts.systemPrompts[mode] + languageInstruction;
      }
      // Otherwise use default
      return SYSTEM_PROMPTS[mode] + languageInstruction;
    };

    // Use enhanced user prompt if available
    const getUserPrompt = () => {
      if (enhancedContext) {
        return enhancedContext.userPrompt;
      }
      
      if (isFollowUp) {
        const contextText = request.context || '';
        const originalContent = contextText.length > 500 ? contextText.substring(0, 500) + "..." : contextText;
        
        return `ORIGINAL CONTENT CONTEXT:
${originalContent}

FOLLOW-UP QUESTION: ${text}

Instructions: Build on your previous analysis/explanation of this content. If the question asks for "more" or "other" aspects, provide genuinely new insights you haven't covered yet. Avoid repeating previous points unless directly relevant to the new question.`;
      }
      
      // For translate mode
      if (mode === "translate") {
        if (settings.customPrompts?.userPrompts?.[mode]) {
          const customPrompt = settings.customPrompts.userPrompts[mode];
          return customPrompt
            .replace('${fromLanguage}', settings.translationSettings?.fromLanguage || "en")
            .replace('${toLanguage}', settings.translationSettings?.toLanguage || "es")
            .replace('${text}', text);
        }
        
        return typeof USER_PROMPTS.translate === 'function'
          ? USER_PROMPTS.translate(
              settings.translationSettings?.fromLanguage || "en",
              settings.translationSettings?.toLanguage || "es"
            ) + "\n" + text
          : text;
      }
      
      // For other modes
      if (settings.customPrompts?.userPrompts?.[mode]) {
        return settings.customPrompts.userPrompts[mode].replace('${text}', text);
      }
      
      return typeof USER_PROMPTS[mode] === 'function'
        ? USER_PROMPTS[mode](text)
        : USER_PROMPTS[mode] + "\n" + text;
    };
    
    const selectedModel = settings.openaiModel || "gpt-4o";

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.apiKey}`
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [
          {
            role: "system",
            content: getSystemPrompt()
          },
          {
            role: "user",
            content: getUserPrompt()
          }
        ],
        max_tokens: getMaxTokensFromPromptOrSetting(mode, getSystemPrompt()) || settings.maxTokens || 2048,
        temperature: 0.5,
        stream: true
      }),
    });

    if (!response.ok) {
      let errorMessage = `OpenAI API Error (${response.status})`;
      try {
        const errorJson = await response.json();
        const openAiError = errorJson?.error?.message;
        if (openAiError) {
          errorMessage = openAiError;
        }
      } catch (parseError) {
        errorMessage = `OpenAI API Error: ${response.status} ${response.statusText || ''}`.trim();
      }

      throw new Error(errorMessage);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Response body is not readable');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    // Add context quality indicator for enhanced responses
    if (enhancedContext && enhancedContext.hasContext) {
      yield { 
        type: 'chunk', 
        content: `[Context: ${enhancedContext.contextQuality}] `,
        isFollowUp: request.isFollowUp,
        id: request.id
      };
    }

    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        if (buffer) {
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
          id: request.id
        };
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      
      // Optimize buffer handling for faster response
      if (buffer.length > 500) {
        yield { 
          type: 'chunk', 
          content: buffer,
          isFollowUp: request.isFollowUp,
          id: request.id
        };
        buffer = '';
        continue;
      }
      
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      // Process multiple lines at once for faster response
      const chunksToProcess = [];
      
      for (const line of lines) {
        if (line.trim() === '') continue;
        if (line.includes('[DONE]')) {
          yield { type: 'done' };
          continue;
        }
        
        try {
          const data = JSON.parse(line.replace(/^data: /, ''));
          if (data.choices?.[0]?.delta?.content) {
            chunksToProcess.push(data.choices[0].delta.content);
          }
        } catch (e) {
          console.warn('Failed to parse line:', line);
        }
      }
      
      // Combine chunks and send in bulk for faster display
      if (chunksToProcess.length > 0) {
        yield { 
          type: 'chunk', 
          content: chunksToProcess.join(''),
          isFollowUp: request.isFollowUp,
          id: request.id
        };
      }
    }
  } catch (error) {
    yield {
      type: 'error',
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

/**
 * Helper function to create enhanced request with conversation context
 */
export function createEnhancedRequest(
  baseRequest: ProcessTextRequest,
  enhancedContext?: {
    systemPrompt: string;
    userPrompt: string;
    hasContext: boolean;
    contextQuality: "excellent" | "good" | "basic" | "none";
  }
): EnhancedProcessTextRequest {
  return {
    ...baseRequest,
    enhancedContext
  };
} 