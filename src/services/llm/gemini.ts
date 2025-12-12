import type { ProcessTextRequest } from "~types/messages"
import { SYSTEM_PROMPTS, USER_PROMPTS, FOLLOW_UP_SYSTEM_PROMPTS, getMaxTokensFromPromptOrSetting } from "../../utils/constants"
import type { Settings } from "~types/settings"
import { getSelectedLocale } from "../../utils/i18n"

/**
 * Extract text content from Gemini streaming response
 * Gemini returns an array of JSON objects with candidates containing text parts
 */
const extractTextFromGeminiResponse = (buffer: string): string => {
  let fullText = ''
  
  try {
    // Try to parse as a complete JSON array first
    // Gemini streaming format: [{"candidates":...}, {"candidates":...}, ...]
    let jsonStr = buffer.trim()
    
    // Handle incomplete array - add closing bracket if needed
    if (jsonStr.startsWith('[') && !jsonStr.endsWith(']')) {
      // Remove trailing comma if present
      jsonStr = jsonStr.replace(/,\s*$/, '') + ']'
    }
    
    // Try to parse the JSON
    const parsed = JSON.parse(jsonStr)
    
    if (Array.isArray(parsed)) {
      // Extract text from each candidate in the array
      for (const item of parsed) {
        const text = item?.candidates?.[0]?.content?.parts?.[0]?.text
        if (text) {
          fullText += text
        }
      }
    } else if (parsed?.candidates?.[0]?.content?.parts?.[0]?.text) {
      // Single object
      fullText = parsed.candidates[0].content.parts[0].text
    }
  } catch (e) {
    // If JSON parsing fails, try to extract text using regex
    // This handles partial/malformed JSON during streaming
    const textMatches = buffer.matchAll(/"text":\s*"([^"\\]*(?:\\.[^"\\]*)*)"/g)
    for (const match of textMatches) {
      if (match[1]) {
        // Unescape the JSON string
        try {
          fullText += JSON.parse(`"${match[1]}"`)
        } catch {
          fullText += match[1]
        }
      }
    }
  }
  
  return fullText
}

export const processGeminiText = async function*(request: ProcessTextRequest) {
  const { text, mode, settings, isFollowUp } = request
  
  // Get the user's selected language for AI responses
  // Priority: 1) aiResponseLanguage setting (from website info selector)
  //          2) Extension UI language (from popup/options) as fallback
  const responseLanguage = settings.aiResponseLanguage || await getSelectedLocale()
  
  // Get the system prompt (custom or default)
  const getSystemPrompt = () => {
    // Language instruction to add to all system prompts
    const languageInstruction = responseLanguage !== "en" 
      ? `\n\nIMPORTANT: Respond in ${responseLanguage} language. Adapt your response to be culturally appropriate for speakers of this language.` 
      : "";
      
    // For follow-up questions, use enhanced context-aware prompts
    if (isFollowUp) {
      // If custom system prompt is available for follow-ups, use it
      if (settings.customPrompts?.systemPrompts?.[mode]) {
        return `${settings.customPrompts.systemPrompts[mode]} 

FOLLOW-UP CONTEXT: You are continuing the conversation. The user is asking a follow-up question about the same content. Maintain your expertise and perspective while providing fresh insights.${languageInstruction}`;
      }
      // Otherwise use enhanced follow-up prompt
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
  
  try {
    const modelName = settings.geminiModel || "gemini-2.0-flash"; // Default to 2.0 Flash for reliability
    console.log(`[Gemini] Using model: ${modelName}, API key present: ${!!settings.geminiApiKey}`);
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:streamGenerateContent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': settings.geminiApiKey || ''
      },
      body: JSON.stringify({
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
        generationConfig: {
          temperature: 0.5,
          maxOutputTokens: getMaxTokensFromPromptOrSetting(mode, getSystemPrompt()) || settings.maxTokens || 2048,
          stopSequences: []
        }
      })
    })

    if (!response.ok) {
      // Read the error details from response body
      let errorMessage = `Gemini API Error (${response.status})`;
      try {
        const errorData = await response.text();
        const errorJson = JSON.parse(errorData);
        
        if (errorJson.error?.message) {
          errorMessage = errorJson.error.message;
        }
        
        // Provide helpful messages for common errors
        if (response.status === 400) {
          errorMessage = `Invalid request: ${errorMessage}. Please check your API key format.`;
        } else if (response.status === 401 || response.status === 403) {
          errorMessage = `Authentication failed. Please check your Gemini API key is valid and has proper permissions.`;
        } else if (response.status === 404) {
          errorMessage = `Model not found. The model "${modelName}" may not be available. Try selecting 'Gemini 2.0 Flash' in settings.`;
        } else if (response.status === 429) {
          errorMessage = `Rate limit exceeded. Please wait a moment and try again, or check your API quota at Google AI Studio.`;
        } else if (response.status >= 500) {
          errorMessage = `Gemini server error. Please try again later.`;
        }
      } catch (parseError) {
        // If we can't parse the error, use status code
        errorMessage = `Gemini API Error: ${response.status} ${response.statusText || 'Unknown error'}`;
      }
      
      throw new Error(errorMessage);
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('Response body is not readable')
    }

    const decoder = new TextDecoder()
    let buffer = ''
    let lastTextLength = 0  // Track cumulative text to avoid duplicates

    while (true) {
      const { done, value } = await reader.read()
      
      if (done) {
        // Try to parse any remaining buffer content
        if (buffer.trim()) {
          const text = extractTextFromGeminiResponse(buffer)
          if (text && text.length > lastTextLength) {
            yield { 
              type: 'chunk', 
              content: text.substring(lastTextLength),
              isFollowUp: request.isFollowUp,
              id: request.id
            }
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
      
      // Gemini streaming format: array of JSON objects like [{"candidates":...}, {"candidates":...}]
      // We need to extract text from each candidate object
      const text = extractTextFromGeminiResponse(buffer)
      
      if (text && text.length > lastTextLength) {
        // Only yield the new text (delta)
        const newText = text.substring(lastTextLength)
        lastTextLength = text.length
        
        yield { 
          type: 'chunk', 
          content: newText,
          isFollowUp: request.isFollowUp,
          id: request.id
        }
      }
    }
  } catch (error) {
    yield {
      type: 'error',
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
} 