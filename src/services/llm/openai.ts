import type { ProcessTextRequest } from "~types/messages"
import { SYSTEM_PROMPTS, USER_PROMPTS } from "../../utils/constants"

export const processOpenAIText = async (request: ProcessTextRequest) => {
  const { text, mode, settings } = request
  
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
            content: mode === "translate"
              ? USER_PROMPTS.translate(
                  settings.translationSettings?.fromLanguage || "en",
                  settings.translationSettings?.toLanguage || "es"
                ) + "\n" + text
              : USER_PROMPTS[mode] + "\n" + text
          }
        ],
        max_tokens: settings.maxTokens || 2048,
        temperature: 0.5,
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API Error: ${response.statusText}`)
    }

    const data = await response.json()
    return data.choices[0].message.content
  } catch (error) {
    console.error("OpenAI Error:", error)
    throw error
  }
} 