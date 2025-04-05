import { SYSTEM_PROMPTS, USER_PROMPTS } from "../../utils/constants";
import { responseCacheService } from "../rateLimit";
import type { Settings } from "~types/settings";

// Common prefetching phrases and questions
const COMMON_PROMPTS = {
  "explain": [
    "What is this?",
    "Can you explain this?",
    "I don't understand this"
  ],
  "summarize": [
    "Can you summarize this?",
    "TLDR",
    "Give me a summary"
  ],
  "analyze": [
    "Analyze this",
    "What's important here?",
    "What are the key points?"
  ],
  "translate": [
    "Translate this",
    "How would you say this in Spanish?",
    "Convert this to French"
  ],
  "free": [
    "Hello",
    "How are you?",
    "What can you do?",
    "Help me with this",
    "Tell me about LightUp"
  ]
};

// Sample text to use for prefetching
const SAMPLE_TEXTS = {
  "explain": "The coefficient of determination, denoted R², is a key output of regression analysis. It is interpreted as the proportion of the variance in the dependent variable that is predictable from the independent variables.",
  "summarize": "Machine learning is a field of inquiry devoted to understanding and building methods that 'learn', that is, methods that leverage data to improve performance on some set of tasks. It is seen as a part of artificial intelligence.",
  "analyze": "The global climate is changing rapidly, primarily due to human activities such as burning fossil fuels and deforestation. These actions increase the concentration of heat-trapping gases in our atmosphere.",
  "translate": "The quick brown fox jumps over the lazy dog",
  "free": "Hello, I'd like to know more about how I can use LightUp to improve my browsing experience. What features does it offer?"
};

/**
 * This service prefetches common AI responses and stores them in the cache
 * to make the UI more responsive for common questions and patterns
 */
export class PrefetchService {
  private isBusy = false;
  private prefetchQueue: {mode: string, text: string}[] = [];
  
  /**
   * Start the prefetch process for common prompts in the background
   */
  public startPrefetching(settings: Settings): void {
    // Don't prefetch if already busy or if user has custom API keys
    if (this.isBusy || settings.apiKey || settings.xaiApiKey || settings.geminiApiKey) {
      return;
    }
    
    this.isBusy = true;
    
    // Add common prompts to the queue
    Object.entries(COMMON_PROMPTS).forEach(([mode, prompts]) => {
      prompts.forEach(prompt => {
        const text = mode === 'free' ? prompt : `${prompt}\n${SAMPLE_TEXTS[mode]}`;
        this.prefetchQueue.push({mode, text});
      });
    });
    
    // Start processing the queue in the background
    this.processQueue(settings);
  }
  
  /**
   * Process the prefetch queue without blocking the UI
   */
  private async processQueue(settings: Settings): Promise<void> {
    if (this.prefetchQueue.length === 0) {
      this.isBusy = false;
      return;
    }
    
    const item = this.prefetchQueue.shift();
    if (!item) {
      this.isBusy = false;
      return;
    }
    
    const { mode, text } = item;
    
    // Check if already in cache
    if (responseCacheService.getResponse(text, mode)) {
      // Skip this item and process next one after a short delay
      setTimeout(() => this.processQueue(settings), 50);
      return;
    }
    
    try {
      // Get the appropriate prompts
      const systemPrompt = settings.customPrompts?.systemPrompts?.[mode] || SYSTEM_PROMPTS[mode];
      
      let userPrompt: string;
      if (mode === "translate") {
        const translateFn = USER_PROMPTS.translate as (fromLang: string, toLang: string) => string;
        userPrompt = translateFn(
          settings.translationSettings?.fromLanguage || "en",
          settings.translationSettings?.toLanguage || "es"
        ) + "\n" + text;
      } else {
        userPrompt = typeof USER_PROMPTS[mode] === 'function' 
          ? USER_PROMPTS[mode](text) 
          : USER_PROMPTS[mode] + "\n" + text;
      }
      
      // Make the actual API call in the background
      const response = await fetch("https://www.boimaginations.com/api/v1/basic/generate", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{
                text: systemPrompt
              }]
            },
            {
              role: "user",
              parts: [{
                text: userPrompt
              }]
            }
          ],
          model: "gemini-2.0-flash-lite-preview-02-05",
          generationConfig: {
            temperature: 0.5,
            maxOutputTokens: settings.maxTokens || 1000,
            stopSequences: []
          }
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          // Extract the full text from all chunks
          const fullText = data.reduce((acc, chunk) => {
            if (chunk.candidates?.[0]?.content?.parts?.[0]?.text) {
              return acc + chunk.candidates[0].content.parts[0].text;
            }
            return acc;
          }, '');
          
          // Store in cache for future use
          responseCacheService.storeResponse(text, mode, fullText);
        }
      }
    } catch (error) {
      console.error('Prefetch error:', error);
      // Silently fail - prefetching is a background optimization
    }
    
    // Process next item with a delay to avoid overloading
    setTimeout(() => this.processQueue(settings), 2000);
  }
}

// Export a singleton instance
export const prefetchService = new PrefetchService(); 