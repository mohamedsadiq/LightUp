import { Storage } from "@plasmohq/storage"
import { verifyServerConnection } from "~utils/storage"
import type { ProcessTextRequest, StreamChunk } from "~types/messages"
import { SYSTEM_PROMPTS, USER_PROMPTS } from "~utils/constants"
import { processGeminiText } from "~services/llm/gemini"
import { processXAIText } from "~services/llm/xai"

interface Settings {
  modelType: "local" | "openai" | "gemini" | "xai"
  serverUrl?: string
  translationSettings?: {
    fromLanguage: string
    toLanguage: string
  }
  apiKey?: string
  geminiApiKey?: string
  xaiApiKey?: string
  geminiModel?: string
  maxTokens?: number
}

let activeConnections = new Map<string, {
  controller: AbortController;
  timestamp: number;
}>();

// Clean up old connections periodically
setInterval(() => {
  const now = Date.now();
  for (const [id, connection] of activeConnections.entries()) {
    if (now - connection.timestamp > 1000 * 60 * 60) { // 1 hour timeout
      connection.controller.abort();
      activeConnections.delete(id);
    }
  }
}, 1000 * 60 * 5); // Check every 5 minutes

const isConfigurationValid = (settings: Settings): boolean => {
  if (!settings) {
    console.error('No settings provided');
    return false;
  }

  try {
    switch (settings.modelType) {
      case "local":
        return !!settings.serverUrl;
      case "openai":
        return !!settings.apiKey && settings.apiKey.startsWith('sk-');
      case "gemini":
        return !!settings.geminiApiKey;
      case "xai": {
        const xaiKey = settings.xaiApiKey || '';
        console.log('Validating xAI key:', {
          length: xaiKey.length,
          hasKey: !!xaiKey,
          key: xaiKey.substring(0, 10) + '...' // Log first 10 chars for debugging
        });
        
        // Accept any non-empty key for now since xAI token format might vary
        return xaiKey.length > 0;
      }
      default:
        return false;
    }
  } catch (error) {
    console.error('Configuration validation error:', error);
    return false;
  }
};

export async function handleProcessText(request: ProcessTextRequest, port: chrome.runtime.Port) {
  try {
    const connectionId = port.name.split('text-processing-')[1];
    const abortController = new AbortController();
    
    activeConnections.set(connectionId, {
      controller: abortController,
      timestamp: Date.now()
    });

    const { mode, text, context, isFollowUp, settings } = request;
    
    // Add more detailed validation logging
    console.log('Validating settings:', {
      modelType: settings?.modelType,
      hasXaiKey: !!settings?.xaiApiKey,
      keyLength: settings?.xaiApiKey?.length
    });

    if (!isConfigurationValid(settings)) {
      throw new Error(
        `${settings?.modelType?.toUpperCase() || 'AI model'} is not properly configured.\n` +
        'Please ensure you have:\n' +
        '1. Selected xAI as your model type\n' +
        '2. Entered your xAI API key\n' +
        '3. Saved your settings'
      );
    }

    const userMessage = isFollowUp
      ? `Previous context: "${context}"\n\nFollow-up question: ${text}\n\nPlease provide a direct answer to the follow-up question.`
      : mode === "translate" && settings?.translationSettings 
        ? `Translate the following text from ${settings.translationSettings.fromLanguage} to ${settings.translationSettings.toLanguage}:\n\n${text}`
        : request.pageContext 
          ? `Page context: "${request.pageContext}"\n\nUser selection: "${text}"\n\nPlease provide an answer that takes into account both the selected text and its surrounding context. ${typeof USER_PROMPTS[mode] === 'function' ? USER_PROMPTS[mode](text, context) : text}`
          : typeof USER_PROMPTS[mode] === 'function' 
            ? USER_PROMPTS[mode](text, context)
            : text;

    console.log('Processing request with context:', { 
      mode, 
      text, 
      hasContext: !!request.pageContext,
      contextLength: request.pageContext?.length,
      isFollowUp,
      modelType: settings?.modelType
    });

    const storage = new Storage();
    const globalSettings = await storage.get("settings") as Settings;
    
    const endpoint = globalSettings?.modelType === "local" 
      ? `/v1/chat/completions`
      : globalSettings?.modelType === "gemini"
        ? "/v1beta/models/gemini-pro:streamGenerateContent"
        : "/api/generate";

    console.log('Sending message to LLM:', userMessage);

    let headers = { 'Content-Type': 'application/json' };
    let requestBody;
    let url = settings.serverUrl;

    if (globalSettings?.modelType === "gemini") {
      headers['x-goog-api-key'] = settings.geminiApiKey || '';
      url = `https://generativelanguage.googleapis.com/v1beta/models/${globalSettings.geminiModel || "gemini-pro"}:generateContent`;
      requestBody = {
        contents: [{
          parts: [{
            text: userMessage
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: settings.maxTokens || 2048
        }
      };

      console.log('Using Gemini model:', globalSettings.geminiModel || "gemini-pro");

      console.log('Sending Gemini request:', { url, requestBody });

      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(requestBody),
        signal: abortController.signal
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Gemini API error:', errorText);
        throw new Error(`Server responded with ${response.status}: ${errorText}`);
      }

      // Handle non-streaming response for now
      const data = await response.json();
      console.log('Raw Gemini response:', data);

      if (data.candidates && data.candidates.length > 0) {
        const candidate = data.candidates[0];
        if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
          const text = candidate.content.parts[0].text;
          console.log('Extracted text:', text);
          
          // Split the text into smaller chunks for streaming-like behavior
          const words = text.split(' ');
          const chunkSize = 5; // Send 5 words at a time
          
          for (let i = 0; i < words.length; i += chunkSize) {
            const chunk = words.slice(i, i + chunkSize).join(' ');
            console.log('Sending chunk:', chunk);
            port.postMessage({
              type: 'chunk',
              content: chunk + ' ',
              isFollowUp: isFollowUp,
              id: request.id
            });
            // Add a small delay to simulate streaming
            await new Promise(resolve => setTimeout(resolve, 50));
          }
        } else {
          console.warn('No content in Gemini response:', data);
        }
      } else {
        console.warn('No candidates in Gemini response:', data);
      }

      port.postMessage({ 
        type: 'done',
        isFollowUp: isFollowUp,
        id: request.id
      });
      return;
    }

    if (settings.modelType === "xai") {
      console.log('Using xAI model with follow-up:', isFollowUp);
      let buffer = '';
      let markdownBuffer = '';
      let isInMarkdown = false;
      let lastSentWasHeading = false;

      const cleanAndSendText = (text: string, isMarkdown = false) => {
        if (!text.trim()) return;

        // Clean the text
        let cleanedText = text
          // Remove common introductory phrases
          .replace(/^(?:Explanation of the Text:?\s*|The text (?:describes|explains|discusses):?\s*)+/i, '')
          // Remove repeated colons and dots
          .replace(/[:.]\s*[:.]\s*/g, ': ')
          // Remove duplicate content
          .replace(/(.{20,}?)\s*\1/g, '$1')
          // Fix markdown formatting
          .replace(/\*\s*\*/g, '**')
          // Fix bullet points and dashes
          .replace(/(?:^|\n)\s*[-•]\s*/g, '\n• ')
          // Fix spacing around punctuation
          .replace(/\s*([.,!?:;])\s*/g, '$1 ')
          // Remove extra spaces
          .replace(/\s+/g, ' ')
          // Fix spacing after bullet points
          .replace(/•\s+/g, '• ')
          .trim();

        // Special handling for markdown headings
        if (isMarkdown && cleanedText.startsWith('**') && cleanedText.endsWith('**')) {
          // Remove redundant punctuation in headings
          cleanedText = cleanedText.replace(/\*\*(.*?)[:.]+\s*\*\*$/, '**$1**');
          
          if (lastSentWasHeading) {
            // Skip if we just sent a heading
            return;
          }
          lastSentWasHeading = true;
        } else {
          lastSentWasHeading = false;
        }

        // Only send if we have meaningful content
        if (cleanedText.length > 2) {
          // Don't add extra punctuation to headings or bullet points
          const needsPunctuation = !cleanedText.endsWith('.') && 
                                 !cleanedText.endsWith('!') && 
                                 !cleanedText.endsWith('?') &&
                                 !cleanedText.endsWith('**') &&
                                 !cleanedText.startsWith('• ');
          
          port.postMessage({
            type: 'chunk',
            content: cleanedText + (needsPunctuation ? '. ' : ' '),
            isFollowUp: isFollowUp,
            id: request.id
          });
        }
      };

      for await (const chunk of processXAIText(request)) {
        if (chunk.type === 'chunk') {
          const text = chunk.content;
          let currentIndex = 0;

          while (currentIndex < text.length) {
            // Handle markdown sections
            if (text.substr(currentIndex, 2) === '**') {
              if (!isInMarkdown) {
                // Start of markdown
                if (buffer) {
                  cleanAndSendText(buffer);
                  buffer = '';
                }
                isInMarkdown = true;
                markdownBuffer = '**';
                currentIndex += 2;
                continue;
              } else {
                // End of markdown
                markdownBuffer += '**';
                cleanAndSendText(markdownBuffer, true);
                markdownBuffer = '';
                isInMarkdown = false;
                currentIndex += 2;
                continue;
              }
            }

            if (isInMarkdown) {
              markdownBuffer += text[currentIndex];
            } else {
              buffer += text[currentIndex];
              
              // Check for sentence end
              if (['.', '!', '?'].includes(text[currentIndex]) && 
                  (currentIndex === text.length - 1 || /\s/.test(text[currentIndex + 1]))) {
                cleanAndSendText(buffer);
                buffer = '';
              }
            }
            currentIndex++;
          }
        } else {
          // Send any remaining text
          if (buffer) {
            cleanAndSendText(buffer);
          }
          if (markdownBuffer) {
            cleanAndSendText(markdownBuffer, true);
          }
          port.postMessage({
            ...chunk,
            isFollowUp: isFollowUp,
            id: request.id
          });
        }
      }
      return;
    }

    url = settings.serverUrl + endpoint;
    requestBody = {
      model: "llama-3.2-3b-instruct",
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPTS[mode]
        },
        {
          role: "user",
          content: userMessage
        }
      ],
      stream: true
    };

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
      signal: abortController.signal
    });

    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Response body is not readable');
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let isFirstChunk = true;

    while (true) {
      try {
        const { done, value } = await reader.read();
        
        if (done) {
          if (buffer) {
            port.postMessage({ 
              type: 'chunk', 
              content: buffer,
              isFollowUp: isFollowUp,
              id: request.id
            });
          }
          port.postMessage({ 
            type: 'done',
            isFollowUp: isFollowUp,
            id: request.id
          });
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim() === '') continue;
          
          try {
            if (globalSettings?.modelType === "gemini") {
              // Handle Gemini response format
              const data = JSON.parse(line);
              if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
                const content = data.candidates[0].content.parts[0].text;
                port.postMessage({ 
                  type: 'chunk', 
                  content: content,
                  isFollowUp: isFollowUp,
                  id: request.id
                });
              }
            } else {
              // Handle other models' response format
              const chunk = JSON.parse(line.replace(/^data: /, ''));
              if (chunk.choices?.[0]?.delta?.content) {
                const content = chunk.choices[0].delta.content;
                
                if (isFirstChunk) {
                  console.log('First chunk content:', content);
                  isFirstChunk = false;
                }

                port.postMessage({ 
                  type: 'chunk', 
                  content: content,
                  isFollowUp: isFollowUp,
                  id: request.id
                });
              }
            }
          } catch (e) {
            console.warn('Failed to parse streaming response:', e);
          }
        }
      } catch (streamError) {
        // Check if the error is due to an aborted stream
        if (streamError.message?.includes('aborted') || 
            streamError.name === 'AbortError' || 
            streamError.message?.includes('BodyStreamBuffer was aborted')) {
          console.log('Stream was intentionally aborted');
          port.postMessage({ 
            type: 'aborted',
            error: 'Request was cancelled'
          });
          return;
        }
        throw streamError; // Re-throw other errors
      }
    }

  } catch (error) {
    console.error('Processing error:', error);
    port.postMessage({ 
      type: 'error', 
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  } finally {
    const connectionId = port.name.split('text-processing-')[1];
    activeConnections.delete(connectionId);
  }
}

// Update message listener to use port-based communication
chrome.runtime.onConnect.addListener((port) => {
  console.log("Connection established", port.name);
  
  port.onMessage.addListener(async (msg) => {
    if (msg.type === "STOP_GENERATION") {
      const connectionId = port.name.split('text-processing-')[1];
      const connection = activeConnections.get(connectionId);
      
      if (connection) {
        connection.controller.abort();
        activeConnections.delete(connectionId);
      }
    }
    if (msg.type === "PROCESS_TEXT") {
      handleProcessText(msg.payload, port);
    }
  });

  port.onDisconnect.addListener(() => {
    const connectionId = port.name.split('text-processing-')[1];
    const connection = activeConnections.get(connectionId);
    
    if (connection) {
      connection.controller.abort();
      activeConnections.delete(connectionId);
    }
  });
}); 