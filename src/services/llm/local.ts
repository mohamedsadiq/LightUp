import type { ProcessTextRequest } from "~types/messages"
import { FeedbackProcessor } from "../feedback/feedbackProcessor"
import { SYSTEM_PROMPTS, USER_PROMPTS } from "../../utils/constants"

export const processLocalText = async (request: ProcessTextRequest) => {
  const { text, mode, settings } = request
  const feedbackProcessor = new FeedbackProcessor()
  
  // Get feedback context
  const { positivePatterns, negativePatterns } = await feedbackProcessor.getFeedbackContext(text)
  
  // Create enhanced prompt using feedback patterns
  const enhancedPrompt = `
    ${SYSTEM_PROMPTS[mode]}
    Based on user feedback:
    - Include patterns like: ${positivePatterns.slice(0, 3).join(', ')}
    - Avoid patterns like: ${negativePatterns.slice(0, 3).join(', ')}
    Keep responses under 1500 tokens.
  `

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
            content: enhancedPrompt
          },
          {
            role: "user",
            content: `${USER_PROMPTS[mode]}\n${text}`
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