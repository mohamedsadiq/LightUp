import type { ProcessTextRequest } from "~types/messages"
import { SYSTEM_PROMPTS, USER_PROMPTS } from "../../utils/constants"

export const processXAIText = async function*(request: ProcessTextRequest) {
  const { text, mode, settings } = request
  
  try {
    // Using the correct xAI endpoint and format from the curl example
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.xaiApiKey}`
      },
      body: JSON.stringify({
        messages: [
          {
            role: "system",
            content: SYSTEM_PROMPTS[mode]
          },
          {
            role: "user",
            content: mode === "translate" 
              ? `Translate the following text from ${settings.translationSettings?.fromLanguage || "en"} to ${settings.translationSettings?.toLanguage || "es"}:\n\n${text}`
              : `${typeof USER_PROMPTS[mode] === 'function' ? USER_PROMPTS[mode](text) : USER_PROMPTS[mode]}\n${text}`
          }
        ],
        model: "grok-beta",  // Using the correct model name from the example
        stream: true,        // We want streaming for real-time responses
        temperature: 0.7     // Slightly higher than 0 for more creative responses
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
            yield { type: 'chunk', content: buffer };
          }
          yield { type: 'done' };
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim() === '') continue;
          if (line.includes('[DONE]')) {
            yield { type: 'done' };
            continue;
          }
          
          try {
            const data = JSON.parse(line.replace(/^data: /, ''));
            if (data.choices?.[0]?.delta?.content) {
              yield { 
                type: 'chunk', 
                content: data.choices[0].delta.content
              };
            }
          } catch (e) {
            console.warn('Failed to parse streaming response line:', line, e);
          }
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