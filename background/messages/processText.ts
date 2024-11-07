import type { PlasmoMessaging } from "@plasmohq/messaging"

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

    const response = await fetch('http://127.0.0.1:1234/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "llama-3.2-3b-instruct",
        messages: [
          {
            role: "system",
            content: `You are a helpful assistant that can explain and summarize text.`
          },
          {
            role: "user",
            content: getPromptForMode(mode, text)
          }
        ],
        temperature: 0.7,
        max_tokens: 200
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