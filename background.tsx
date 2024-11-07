import type { PlasmoMessaging } from "@plasmohq/messaging"

// Function to verify server connection
async function verifyServerConnection(): Promise<boolean> {
  try {
    console.log('Verifying server connection...');
    const response = await fetch('http://127.0.0.1:1234/v1/models');
    const data = await response.json();
    console.log('Available models:', data);
    return true;
  } catch (error) {
    console.error('Server connection failed:', error);
    return false;
  }
}

// Handler for explain text messages
export async function handleExplainText(
  req: PlasmoMessaging.Request<string>
): Promise<{ explanation?: string; error?: string }> {
  try {
    console.log('Received text to explain:', req.body);

    const isServerAvailable = await verifyServerConnection();
    if (!isServerAvailable) {
      throw new Error('Cannot connect to Llama server');
    }

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
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('API Response:', data);

    return {
      explanation: data.choices[0].message.content
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      error: error.message
    };
  }
}

export {};
