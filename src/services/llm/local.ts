import type { ProcessTextRequest } from "~types/messages"

export const processLocalText = async (request: ProcessTextRequest) => {
  const { text, mode, settings } = request
  
  // Define mode-specific prompts and system messages
  const systemPrompts = {
    explain: "You are a clear and concise expert at explaining complex topics. Keep explanations under 1500 tokens.",
    summarize: "You are a skilled summarizer who captures key points concisely. Keep summaries under 1500 tokens.",
    analyze: "You are an analytical expert who identifies patterns and insights. Keep analyses under 1500 tokens."
  }

  const userPrompts = {
    explain: "Explain this text clearly and concisely:",
    summarize: "Provide a brief but comprehensive summary of this text:",
    analyze: "Analyze this text, focusing on key themes, patterns, and implications:"
  }

  try {
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
            content: systemPrompts[mode]
          },
          {
            role: "user",
            content: `${userPrompts[mode]}\n${text}\n\nRemember to complete all explanations.`
          }
        ],
        max_tokens: settings.maxTokens || 2048,
        temperature: 0.5
      }),
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`)
    }

    const data = await response.json()
    return data.choices[0].message.content
  } catch (error) {
    console.error("Local LLM Error:", error)
    throw error
  }
} 