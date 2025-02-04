import type { ProcessTextRequest } from "~types/messages"
import { SYSTEM_PROMPTS, USER_PROMPTS } from "../../utils/constants"

export const processGeminiText = async function*(request: ProcessTextRequest) {
  const { text, mode, settings } = request
  
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
    yield {
      type: 'error',
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
} 