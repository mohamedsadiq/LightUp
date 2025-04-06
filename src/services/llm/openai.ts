import type { ProcessTextRequest } from "~types/messages"
import { SYSTEM_PROMPTS, USER_PROMPTS } from "../../utils/constants"

export const processOpenAIText = async function*(request: ProcessTextRequest) {
  const { text, mode, settings, isFollowUp } = request
  
  try {
    // Get the system prompt (custom or default)
    const getSystemPrompt = () => {
      // If custom system prompt is available, use it
      if (settings.customPrompts?.systemPrompts?.[mode]) {
        return settings.customPrompts.systemPrompts[mode];
      }
      // Otherwise use default
      return SYSTEM_PROMPTS[mode];
    };

    // Get the user prompt (custom or default)
    const getUserPrompt = () => {
      if (isFollowUp) {
        return `Context from previous conversation:\n${request.context || ''}\n\nFollow-up question:\n${text}`;
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
        return typeof USER_PROMPTS.translate === 'function'
          ? USER_PROMPTS.translate(
              settings.translationSettings?.fromLanguage || "en",
              settings.translationSettings?.toLanguage || "es"
            ) + "\n" + text
          : text;
      }
      
      // For other modes
      if (settings.customPrompts?.userPrompts?.[mode]) {
        // Use custom user prompt if available
        return settings.customPrompts.userPrompts[mode].replace('${text}', text);
      }
      
      // Otherwise use default
      return typeof USER_PROMPTS[mode] === 'function'
        ? USER_PROMPTS[mode](text)
        : USER_PROMPTS[mode] + "\n" + text;
    };
    
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
        if (line.includes('[DONE]')) {
          yield { type: 'done' }
          continue
        }
        
        try {
          const data = JSON.parse(line.replace(/^data: /, ''))
          if (data.choices?.[0]?.delta?.content) {
            chunksToProcess.push(data.choices[0].delta.content)
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