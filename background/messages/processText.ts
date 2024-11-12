import type { PlasmoMessaging } from "@plasmohq/messaging"
import { Storage } from "@plasmohq/storage"

const getPromptForMode = (mode: string, text: string) => {
  switch (mode) {
    case "explain": 
      return `Please explain the following text in detail:\n${text}`
    case "summarize":
      return `Please provide a concise summary of the following text:\n${text}`
    default:
      return `Please explain the following text:\n${text}`
  }
}

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
  try {
    const { text, mode } = req.body
    console.log('Processing text in mode:', mode)

    const storage = new Storage()
    const settings = await storage.get("settings") || {}
    const maxTokens = settings.maxTokens || 1000

    // Get relevant feedback history
    const allFeedbacks: Feedback[] = await storage.get("feedbacks") || [];
    const positiveFeedbacks = allFeedbacks.filter(f => f.feedback === 'like');
    
    // Use feedback to improve prompts
    const similarContexts = positiveFeedbacks
      .filter(f => f.context && f.context.includes(text.substring(0, 20)))
      .map(f => f.text)
      .slice(0, 3);

    const enhancedPrompt = {
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant that can explain and summarize text. 
                   Here are some examples of well-received explanations for similar contexts:
                   ${similarContexts.join('\n')}`
        },
        {
          role: "user",
          content: getPromptForMode(mode, text)
        }
      ]
    };

    const response = await fetch('http://127.0.0.1:1234/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "llama-3.2-3b-instruct",
        ...enhancedPrompt,
        temperature: 0.7,
        max_tokens: maxTokens
      }),
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`)
    }

    const data = await response.json()
    res.send({
      result: data.choices[0].message.content
    })
  } catch (error) {
    console.error('Error:', error)
    res.send({
      error: error.message
    })
  }
}

export default handler 