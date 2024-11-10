import type { PlasmoMessaging } from "@plasmohq/messaging"

// Function to verify server connection
async function verifyServerConnection(serverUrl: string): Promise<boolean> {
  try {
    console.log('Verifying server connection...');
    const response = await fetch(`${serverUrl}/v1/models`);
    const data = await response.json();
    console.log('Available models:', data);
    return true;
  } catch (error) {
    console.error('Server connection failed:', error);
    return false;
  }
}

// Handler for explain text messages
export async function handleExplainText(req: PlasmoMessaging.Request) {
  try {
    const settings = req.body.settings;
    
    // Validate settings
    if (!settings) {
      throw new Error("Extension not configured. Please visit the options page.");
    }

    if (settings.modelType === "local") {
      if (!settings.serverUrl) {
        throw new Error("Local LLM server URL not configured");
      }

      const isServerAvailable = await verifyServerConnection(settings.serverUrl);
      if (!isServerAvailable) {
        throw new Error("Cannot connect to Local LLM server");
      }

      const startTime = performance.now();
      console.log('Starting text processing with Local LLM...');

      console.time('API call');
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
              content: "You are a concise expert who explains texts clearly. Keep explanations under 1500 tokens. Always complete your thoughts."
            },
            {
              role: "user",
              content: `Analyze this text briefly but thoroughly. Focus on the most important aspects:\n${req.body.text}\n\nRemember to complete all explanations.`
            }
          ],
          max_tokens: req.body.maxTokens || 1536,
          temperature: 0.5,
          repeat_penalty: 1.1,
          presence_penalty: 0.1,
          stop: ["\n\n", "###", "<<<"],
          top_p: 0.9,
        }),
      });

    } else if (settings.modelType === "openai") {
      if (!settings.apiKey) {
        throw new Error("OpenAI API key not configured");
      }

      const startTime = performance.now();
      console.log('Starting text processing with OpenAI...');

      console.time('API call');
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
              content: `Analyze this text briefly but thoroughly. Focus on the most important aspects:\n${req.body.text}\n\nRemember to complete all explanations.`
            }
          ],
          max_tokens: req.body.maxTokens || 1536,
          temperature: 0.5,
        }),
      });

      console.timeEnd('API call');

      if (!response.ok) {
        throw new Error(`OpenAI API Error: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('API Response:', data);

      return {
        explanation: data.choices[0].message.content
      };
    } else {
      throw new Error("Invalid model type specified");
    }

    // Log request details
    console.log('Request payload size:', new Blob([JSON.stringify(req.body)]).size, 'bytes');
    
    // Log response details
    console.log('Response size:', new Blob([JSON.stringify(data)]).size, 'bytes');
    
    // Log total processing time
    console.log('Total processing time:', performance.now() - startTime, 'ms');

  } catch (error) {
    console.error('Error:', error);
    return {
      error: error.message
    };
  }
}

// Handle messages from popup and content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "PROCESS_TEXT") {
    // Handle the text processing based on mode
    const { text, mode, customInstruction } = message.payload
    // Add your API call logic here
  }
})

export {};
