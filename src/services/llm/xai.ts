import type { ProcessTextRequest } from "~types/messages"
import { SYSTEM_PROMPTS, USER_PROMPTS } from "../../utils/constants"

export const processXAIText = async function*(request: ProcessTextRequest) {
  const { text, mode, context, isFollowUp, settings } = request
  
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
        return `Context from previous conversation:\n${context || ''}\n\nFollow-up question:\n${text}`;
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
        return `Translate the following text from ${settings.translationSettings?.fromLanguage || "en"} to ${settings.translationSettings?.toLanguage || "es"}:\n\n${text}`;
      }
      
      // For other modes
      if (settings.customPrompts?.userPrompts?.[mode]) {
        // Use custom user prompt if available
        return settings.customPrompts.userPrompts[mode].replace('${text}', text);
      }
      
      // Otherwise use default
      return `${typeof USER_PROMPTS[mode] === 'function' ? USER_PROMPTS[mode](text) : USER_PROMPTS[mode]}\n${text}`;
    };
    
    const messages = [
      {
        role: "system",
        content: getSystemPrompt()
      },
      {
        role: "user",
        content: getUserPrompt()
      }
    ];

    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.xaiApiKey}`
      },
      body: JSON.stringify({
        messages: messages,
        model: settings.grokModel || "grok-2", // Use selected model or default to grok-2
        stream: true,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      let errorMessage = `xAI API Error: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        console.error('xAI Error Response:', errorData);
        errorMessage = errorData.error?.message || errorData.detail || errorMessage;
      } catch (e) {
        console.warn('Could not parse error response:', e);
      }
      
      throw new Error(errorMessage);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Response body is not readable');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      try {
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
          // For large chunks, process immediately without waiting for line breaks
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
        let isDone = false;
        
        for (const line of lines) {
          if (line.trim() === '') continue;
          if (line.includes('[DONE]')) {
            isDone = true;
            continue;
          }
          
          try {
            const data = JSON.parse(line.replace(/^data: /, ''));
            if (data.choices?.[0]?.delta?.content) {
              chunksToProcess.push(data.choices[0].delta.content);
            }
          } catch (e) {
            console.warn('Failed to parse streaming response line:', line, e);
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
        
        // Handle the done signal if received
        if (isDone) {
          yield { 
            type: 'done',
            isFollowUp: request.isFollowUp,
            id: request.id
          };
        }
      } catch (streamError) {
        console.error('Stream processing error:', streamError);
        throw streamError;
      }
    }
  } catch (error) {
    console.error('xAI Processing Error:', error);
    yield {
      type: 'error',
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
} 