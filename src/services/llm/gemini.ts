import type { ProcessTextRequest } from "~types/messages"
import { SYSTEM_PROMPTS, USER_PROMPTS, FOLLOW_UP_SYSTEM_PROMPTS } from "../../utils/constants"
import type { Settings } from "~types/settings"

export const processGeminiText = async function*(request: ProcessTextRequest) {
  const { text, mode, settings, isFollowUp } = request
  
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
  
  try {
    const modelName = settings.geminiModel || "gemini-1.5-pro"; // Default to 1.5 Pro if not specified
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
          maxOutputTokens: settings.maxTokens || 2048,
          stopSequences: []
        }
      })
    })

    if (!response.ok) {
      throw new Error(`Gemini API Error: ${response.statusText}`)
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
      
      // Optimize buffer handling for faster response
      if (buffer.length > 500) {
        // For large chunks, process immediately without waiting for line breaks
        yield { 
          type: 'chunk', 
          content: buffer,
          isFollowUp: request.isFollowUp,
          id: request.id
        }
        buffer = ''
        continue
      }
      
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      // Process multiple lines at once for faster response
      const chunksToProcess = []
      
      for (const line of lines) {
        if (line.trim() === '') continue
        
        try {
          const data = JSON.parse(line)
          if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
            chunksToProcess.push(data.candidates[0].content.parts[0].text)
          }
        } catch (e) {
          console.warn('Failed to parse line:', line)
        }
      }
      
      // Combine chunks and send in bulk for faster display
      if (chunksToProcess.length > 0) {
        yield { 
          type: 'chunk', 
          content: chunksToProcess.join(''),
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