import type { ProcessTextRequest } from "~types/messages"
import { FeedbackProcessor } from "../feedback/feedbackProcessor"
import { SYSTEM_PROMPTS, USER_PROMPTS } from "../../utils/constants"
import { LANGUAGES } from "../../utils/constants"
export const processLocalText = async function*(request: ProcessTextRequest) {
  const { text, mode, settings } = request
  const feedbackProcessor = new FeedbackProcessor()
  
  try {
    const { positivePatterns, negativePatterns } = await feedbackProcessor.getFeedbackContext(text)
    
    const enhancedPrompt = `
      ${SYSTEM_PROMPTS[mode]}
      Based on user feedback:
      - Include patterns like: ${positivePatterns.slice(0, 3).join(', ')}
      - Avoid patterns like: ${negativePatterns.slice(0, 3).join(', ')}
      Keep responses under 1500 tokens.
    `

    const response = await fetch(`${settings.serverUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "llama-3.2-3b-instruct",
        messages: [
          {
            role: "system",
            content: enhancedPrompt
          },
          {
            role: "user",
            content: mode === "translate" 
              ? `Translate to ${LANGUAGES[settings.translationSettings?.toLanguage || "es"]}:\n\n${text}`
              : `${USER_PROMPTS[mode]}\n${text}`
          }
        ],
        max_tokens: settings.maxTokens || 2048,
        temperature: 0.5,
        stream: true
      }),
    })

    if (!response.ok) {
      throw new Error(`Local LLM API Error: ${response.statusText}`)
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
          yield { type: 'chunk', content: buffer }
        }
        yield { type: 'done' }
        break
      }

      buffer += decoder.decode(value, { stream: true })
      
      // Process complete lines from buffer
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.trim() === '') continue
        
        try {
          const data = JSON.parse(line.replace(/^data: /, ''))
          if (data.choices?.[0]?.delta?.content) {
            yield { type: 'chunk', content: data.choices[0].delta.content }
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