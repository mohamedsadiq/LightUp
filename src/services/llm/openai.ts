import type { ProcessTextRequest } from "~types/messages"
import { SYSTEM_PROMPTS, USER_PROMPTS } from "../../utils/constants"

export const processOpenAIText = async function*(request: ProcessTextRequest) {
  const { text, mode, settings, isFollowUp } = request
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: SYSTEM_PROMPTS[mode]
          },
          {
            role: "user",
            content: isFollowUp
              ? `Context from previous conversation:\n${request.context || ''}\n\nFollow-up question:\n${text}`
              : mode === "translate"
                ? typeof USER_PROMPTS.translate === 'function'
                  ? USER_PROMPTS.translate(
                      settings.translationSettings?.fromLanguage || "en",
                      settings.translationSettings?.toLanguage || "es"
                    ) + "\n" + text
                  : text
                : typeof USER_PROMPTS[mode] === 'function'
                  ? USER_PROMPTS[mode](text)
                  : USER_PROMPTS[mode] + "\n" + text
          }
        ],
        max_tokens: settings.maxTokens || 2048,
        temperature: 0.5,
        stream: true
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API Error: ${response.statusText}`)
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
        if (line.includes('[DONE]')) {
          yield { type: 'done' }
          continue
        }
        
        try {
          const data = JSON.parse(line.replace(/^data: /, ''))
          if (data.choices?.[0]?.delta?.content) {
            yield { 
              type: 'chunk', 
              content: data.choices[0].delta.content,
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