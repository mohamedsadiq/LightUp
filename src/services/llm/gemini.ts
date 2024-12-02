import type { ProcessTextRequest } from "~types/messages"
import { SYSTEM_PROMPTS, USER_PROMPTS, LANGUAGES } from "../../utils/constants"
import { GoogleGenerativeAI } from "@google/generative-ai"

export const processGeminiText = async function*(request: ProcessTextRequest) {
  const { text, mode, settings } = request
  
  try {
    const genAI = new GoogleGenerativeAI(settings.apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: settings.maxTokens || 2048,
      }
    });

    // Format the task-specific instruction
    const getTaskPrompt = () => {
      switch(mode) {
        case "explain":
          return `You are an expert explainer. Your task is to explain the following text clearly and comprehensively.
                 Break down complex concepts into simple terms while maintaining accuracy.
                 Format your response in clear sections using markdown.
                 Text to explain:\n${text}`;
        
        case "summarize":
          return `You are a professional summarizer. Create a concise but comprehensive summary of the following text.
                 Focus on the key points and main ideas. Use bullet points for clarity where appropriate.
                 Text to summarize:\n${text}`;
        
        case "analyze":
          return `You are an analytical expert. Perform a detailed analysis of the following text.
                 Consider: main themes, key arguments, tone, style, and implications.
                 Structure your analysis with clear headings and sections.
                 Text to analyze:\n${text}`;
        
        case "translate": {
          // Get translation settings with proper type checking and defaults
          const translationSettings = settings.translationSettings || {
            fromLanguage: Object.keys(LANGUAGES)[0], // "en" as first language
            toLanguage: Object.keys(LANGUAGES)[1]  // "es" as second language
          };

          // Validate that the languages exist in our LANGUAGES constant
          const fromLang = Object.keys(LANGUAGES).includes(translationSettings.fromLanguage) 
            ? translationSettings.fromLanguage 
            : Object.keys(LANGUAGES)[0];
            
          const toLang = Object.keys(LANGUAGES).includes(translationSettings.toLanguage)
            ? translationSettings.toLanguage
            : Object.keys(LANGUAGES)[1];

          return `You are a professional translator. Translate the following text from ${LANGUAGES[fromLang]} to ${LANGUAGES[toLang]}.
                 Maintain the original meaning, tone, and style while ensuring natural flow in the target language.
                 Text to translate:\n${text}`;
        }
        
        default:
          return `Explain the following text clearly and comprehensively:\n${text}`;
      }
    };

    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: SYSTEM_PROMPTS[mode] }],
        },
        {
          role: "model",
          parts: [{ text: "I understand and will follow these instructions carefully." }],
        }
      ],
      generationConfig: {
        stopSequences: ["Human:", "Assistant:"]
      }
    });

    const result = await chat.sendMessageStream(getTaskPrompt());

    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      if (chunkText) {
        yield { type: 'chunk', content: chunkText };
      }
    }

    yield { type: 'done' };

  } catch (error) {
    console.error("Gemini processing error:", error);
    yield {
      type: 'error',
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
} 