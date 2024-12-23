import type { ProcessTextRequest } from "~types/messages"
import { SYSTEM_PROMPTS, USER_PROMPTS } from "../../utils/constants"

export const processGeminiText = async function*(request: ProcessTextRequest) {
  const { text, mode, settings } = request
  
  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:streamGenerateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': settings.geminiApiKey || ''
      },
      body: JSON.stringify({
        contents: [{
          role: "user",
          parts: [{
            text: mode === "translate"
              ? USER_PROMPTS.translate(
                  settings.translationSettings?.fromLanguage || "en",
                  settings.translationSettings?.toLanguage || "es"
                ) + "\n" + text
              : USER_PROMPTS[mode] + "\n" + text
          }]
        }],
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