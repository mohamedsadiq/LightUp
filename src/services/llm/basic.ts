import type { ProcessTextRequest } from "~types/messages"
import { SYSTEM_PROMPTS, USER_PROMPTS, FOLLOW_UP_SYSTEM_PROMPTS, getMaxTokensFromPromptOrSetting } from "../../utils/constants"
import { RateLimitService } from "../rateLimit"
import { getSelectedLocale } from "../../utils/i18n"

// The proxy endpoint URL for the basic version
const PROXY_URL = "https://www.boimaginations.com/api/v1/basic/generate";
const BASIC_GROK_MODEL = "grok-4-1-fast"; // Grok 4.1 Fast - fastest and cheapest xAI model as of late 2025
const BASIC_MAX_TOKENS = 260; // Allow moderately detailed responses while staying affordable
const CHUNK_SIZE = 120; // Reduced for faster visual feedback while still batching
const FLUSH_INTERVAL_MS = 50; // Slightly longer interval to batch more tokens
const FIRST_FLUSH_MIN_CHARS = 8; // Show first content faster (even a few words)
const CONTINUOUS_FLUSH_MIN_CHARS = 60; // Reduced for smoother streaming appearance

// Retry configuration
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const fetchWithRetry = async (url: string, options: RequestInit, retryCount = 0): Promise<Response> => {
  try {
    const response = await fetch(url, options);

    if (response.status === 503 && retryCount < MAX_RETRIES) {
      const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
      await sleep(delay);
      return fetchWithRetry(url, options, retryCount + 1);
    }

    return response;
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
      await sleep(delay);
      return fetchWithRetry(url, options, retryCount + 1);
    }
    throw error;
  }
};

export const processBasicText = async function* (request: ProcessTextRequest) {
  const { text, mode, settings, isFollowUp } = request
  // Content is already sanitized at extraction point - no need to sanitize again

  // Parallelize pre-request operations for faster startup
  const rateLimitService = new RateLimitService()

  // Run rate limit check and locale fetch in parallel to reduce latency
  const [actionsAvailable, responseLanguage] = await Promise.all([
    rateLimitService.checkActionAvailable(),
    settings.aiResponseLanguage ? Promise.resolve(settings.aiResponseLanguage) : getSelectedLocale()
  ]);

  try {
    if (!actionsAvailable) {
      throw new Error("Daily action limit reached. Please try again tomorrow. Or use your API key.");
    }

    // Use action without waiting - fire and forget to reduce latency
    rateLimitService.useAction().then(remaining => {
      console.log(`Actions remaining: ${remaining}`);
    }).catch(() => { /* ignore errors */ })

    // Get the system prompt (custom or default)
    const brevityHint = "Keep responses under 120 words. Use concise, natural paragraphs. Avoid fluff and be direct.";

    const getSystemPrompt = () => {
      // Language instruction to add to all system prompts (only for default prompts)
      const languageInstruction = responseLanguage !== "en"
        ? `\n\nIMPORTANT: Respond in ${responseLanguage} language. Adapt your response to be culturally appropriate for speakers of this language.`
        : "";

      // For follow-up questions, use enhanced context-aware prompts
      if (isFollowUp) {
        // If custom system prompt is available for follow-ups, use it WITHOUT language instruction
        if (settings.customPrompts?.systemPrompts?.[mode]) {
          return `${settings.customPrompts.systemPrompts[mode]}

${brevityHint}

FOLLOW-UP CONTEXT: You are continuing the conversation. The user is asking a follow-up question about the same content. Maintain your expertise and perspective while providing fresh insights.`;
        }
        // Otherwise use enhanced follow-up prompt with language instruction
        const basePrompt = FOLLOW_UP_SYSTEM_PROMPTS[mode] || FOLLOW_UP_SYSTEM_PROMPTS.free;
        return `${basePrompt}

${brevityHint}${languageInstruction}`;
      }

      // If custom system prompt is available, use it WITHOUT language instruction
      if (settings.customPrompts?.systemPrompts?.[mode]) {
        return `${settings.customPrompts.systemPrompts[mode]}

${brevityHint}`;
      }
      // Otherwise use default with language instruction
      return `${SYSTEM_PROMPTS[mode]}

${brevityHint}${languageInstruction}`;
    };

    const getUserPrompt = () => {
      if (isFollowUp) {
        // Include rich context for follow-ups with original content and conversation history
        const originalContent = (request.context || "").length > 400 
          ? (request.context || "").substring(0, 400) + "..." 
          : (request.context || "");

        return `ORIGINAL CONTENT CONTEXT:
${originalContent}

FOLLOW-UP QUESTION: ${text || ""}

Instructions: Build on your previous analysis/explanation of this content. If the question asks for "more" or "other" aspects (like "what else is strange/unusual/problematic"), provide genuinely new insights you haven't covered yet. Avoid repeating previous points unless directly relevant to the new question.`;
      }

      // For translate mode
      if (mode === "translate") {
        // Use custom user prompt if available
        if (settings.customPrompts?.userPrompts?.[mode]) {
          const customPrompt = settings.customPrompts.userPrompts[mode];
          return customPrompt
            .replace('${fromLanguage}', settings.translationSettings?.fromLanguage || "en")
            .replace('${toLanguage}', settings.translationSettings?.toLanguage || "es")
            .replace('${text}', text || "");
        }

        // Otherwise use default
        const translateFn = USER_PROMPTS.translate as (fromLang: string, toLang: string) => string
        return translateFn(
          settings.translationSettings?.fromLanguage || "en",
          settings.translationSettings?.toLanguage || "es"
        ) + "\n" + (text || "");
      }

      // For other modes
      if (settings.customPrompts?.userPrompts?.[mode]) {
        // Use custom user prompt if available
        return settings.customPrompts.userPrompts[mode].replace('${text}', text || "");
      }

      // Otherwise use default
      const prompt = USER_PROMPTS[mode];
      return typeof prompt === "function" ? prompt(text || "") : prompt + "\n" + (text || "");
    };

    const messages = [
      {
        role: "system" as const,
        content: getSystemPrompt()
      },
      {
        role: "user" as const,
        content: getUserPrompt()
      }
    ];

    const requestBody = {
      model: BASIC_GROK_MODEL,
      stream: true,
      temperature: 0.35,
      max_tokens: Math.min(
        BASIC_MAX_TOKENS,
        getMaxTokensFromPromptOrSetting(mode, getSystemPrompt()) || settings.maxTokens || BASIC_MAX_TOKENS
      ),
      messages,
      user: request.connectionId || "lightup-basic"
    };

    // Direct JSON.stringify - content is already sanitized, no post-processing needed
    const response = await fetchWithRetry(PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      if (response.status === 503) {
        throw new Error("Server is currently overloaded. Please try again in a few moments.");
      }
      const errorText = await response.text();
      throw new Error(`Basic API Error: ${response.statusText} - ${errorText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Response body is not readable');
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let totalContent = '';
// Buffer for batching outgoing chunks to avoid flooding the UI with tiny messages
let flushBuffer = '';
let lastFlushTime = Date.now();

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        // Flush any remaining buffered content plus leftover buffer from the stream parser
        const remainingContent = (flushBuffer + buffer.trim());
        if (remainingContent) {
          yield {
            type: 'chunk',
            content: remainingContent,
            isFollowUp: request.isFollowUp,
            id: request.id
          };
        }
        flushBuffer = '';
        yield {
          type: 'done',
          isFollowUp: request.isFollowUp,
          id: request.id,
          totalTokens: totalContent.split(' ').length
        };
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine || trimmedLine === 'data: [DONE]') continue;

        if (trimmedLine.startsWith('data: ')) {
          try {
            const jsonStr = trimmedLine.slice(6);
            const data = JSON.parse(jsonStr);
            const delta = data.choices?.[0]?.delta;
            let content = '';

            if (typeof delta?.content === 'string') {
              content = delta.content;
            } else if (typeof delta?.reasoning_content === 'string') {
              content = delta.reasoning_content;
            }

            if (content) {
              totalContent += content;
              flushBuffer += content;

              // Determine if we should flush now
              const isFirstFlushReady = totalContent.length === flushBuffer.length && flushBuffer.length >= FIRST_FLUSH_MIN_CHARS;
              const sizeThresholdReached = flushBuffer.length >= CHUNK_SIZE;
              const intervalElapsed = Date.now() - lastFlushTime >= FLUSH_INTERVAL_MS;

              if (isFirstFlushReady || sizeThresholdReached || intervalElapsed) {
                yield {
                  type: 'chunk',
                  content: flushBuffer,
                  isFollowUp: request.isFollowUp,
                  id: request.id
                };
                flushBuffer = '';
                lastFlushTime = Date.now();
              }
            }

            if (data.choices?.[0]?.finish_reason) {
              yield {
                type: 'done',
                isFollowUp: request.isFollowUp,
                id: request.id,
                finishReason: data.choices[0].finish_reason,
                totalTokens: data.usage?.total_tokens || totalContent.split(' ').length
              };
              return;
            }
          } catch (parseError) {
            // Silently skip unparseable lines
          }
        }
      }
    }
  } catch (error) {
    yield {
      type: 'error',
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
} 