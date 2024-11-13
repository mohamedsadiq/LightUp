import type { ProcessTextRequest } from "~types/messages"

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
            content: "You are a concise expert who explains texts clearly. Keep explanations under 1500 tokens. Always complete your thoughts."
          },
          {
            role: "user",
            content: `Analyze this text briefly but thoroughly. Focus on the most important aspects:\n${text}\n\nRemember to complete all explanations.`
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