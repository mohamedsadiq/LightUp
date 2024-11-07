import type { PlasmoMessaging } from "@plasmohq/messaging"

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
  try {
    console.log('Received text to explain:', req.body)

    // Verify server connection
    const modelResponse = await fetch('http://127.0.0.1:1234/v1/models')
    const modelData = await modelResponse.json()
    console.log('Available models:', modelData)

    // Make the completion request
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
            content: "You are a helpful assistant that explains text in detail."
          },
          {
            role: "user",
            content: `Please explain the following text in detail:\n${req.body}`
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
    console.log('API Response:', data)

    res.send({
      explanation: data.choices[0].message.content
    })
  } catch (error) {
    console.error('Error:', error)
    res.send({
      error: error.message
    })
  }
}

export default handler 