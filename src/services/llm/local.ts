import type { ProcessTextRequest } from "~types/messages"
import { FeedbackProcessor } from "../feedback/feedbackProcessor"
import { SYSTEM_PROMPTS, USER_PROMPTS } from "../../utils/constants"
import { LANGUAGES } from "../../utils/constants"

export const processLocalText = async function*(request: ProcessTextRequest) {
  const { text, mode, settings } = request
  const feedbackProcessor = new FeedbackProcessor()
  
  try {
    const { positivePatterns, negativePatterns } = await feedbackProcessor.getFeedbackContext(text)
    
    // Get the system prompt (custom or default)
    const getSystemPrompt = () => {
      // If custom system prompt is available, use it
      const customSystemPrompt = settings.customPrompts?.systemPrompts?.[mode];
      if (customSystemPrompt) {
        // We still enhance with feedback context
        return `
          ${customSystemPrompt}
          Based on user feedback:
          - Include patterns like: ${positivePatterns.slice(0, 3).join(', ')}
          - Avoid patterns like: ${negativePatterns.slice(0, 3).join(', ')}
          Keep responses under 1500 tokens.
        `;
      }
      
      // Otherwise use default with feedback enhancement
      return `
        ${SYSTEM_PROMPTS[mode]}
        Based on user feedback:
        - Include patterns like: ${positivePatterns.slice(0, 3).join(', ')}
        - Avoid patterns like: ${negativePatterns.slice(0, 3).join(', ')}
        Keep responses under 1500 tokens.
      `;
    };

    // Get the user prompt (custom or default)
    const getUserPrompt = () => {
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
        return `Translate to ${LANGUAGES[settings.translationSettings?.toLanguage || "es"]}:\n\n${text}`;
      }
      
      // For other modes
      if (settings.customPrompts?.userPrompts?.[mode]) {
        // Use custom user prompt if available
        return settings.customPrompts.userPrompts[mode].replace('${text}', text);
      }
      
      // Otherwise use default
      return `${USER_PROMPTS[mode]}\n${text}`;
    };

    const response = await fetch(`${settings.serverUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: settings.localModel || "llama-2-70b-chat",
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
      
      // Process complete lines from buffer
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.trim() === '') continue
        
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