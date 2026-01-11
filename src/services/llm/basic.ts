import type { ProcessTextRequest } from "~types/messages"
import { SYSTEM_PROMPTS, USER_PROMPTS, FOLLOW_UP_SYSTEM_PROMPTS, getMaxTokensFromPromptOrSetting } from "../../utils/constants"
import { RateLimitService } from "../rateLimit"
import { getSelectedLocale } from "../../utils/i18n"

// The proxy endpoint URL for the basic version
const PROXY_URL = "https://www.boimaginations.com/api/v1/basic/generate";
const BASIC_GROK_MODEL = "grok-4-1-fast"; // Grok 4.1 Fast - fastest and cheapest xAI model as of late 2025
const BASIC_MAX_TOKENS = 260; // Allow moderately detailed responses while staying affordable
const CHUNK_SIZE = 200;
const FLUSH_INTERVAL_MS = 30;
const FIRST_FLUSH_MIN_CHARS = 15;
const CONTINUOUS_FLUSH_MIN_CHARS = 90;

// Add debug logging (enabled for debugging the hex escape issue)
const logDebug = (message: string, data?: any) => {
  try {
    console.log(`[Basic Service] ${message}`, data ?? '');
  } catch (_) {
    // ignore logging errors
  }
};

const scrubJsonBody = (json: string, label: string) => {
  const matchesHex = [...json.matchAll(/\\x[0-9A-Fa-f]{0,2}/g)].map(m => ({ match: m[0], index: m.index }));
  const matchesSurrogate = [...json.matchAll(/\\u[dD][89aAbB][0-9a-fA-F]{2}/g)].map(m => ({ match: m[0], index: m.index }));
  const matchesBadUnicode = [...json.matchAll(/\\u(?![0-9A-Fa-f]{4})/g)].map(m => ({ match: m[0], index: m.index }));
  const matchesOther = [...json.matchAll(/\\[^"\\/bfnrtu]/g)].map(m => ({ match: m[0], index: m.index }));

  if (matchesHex.length || matchesSurrogate.length || matchesBadUnicode.length || matchesOther.length) {
    logDebug(`[scrubJsonBody] found escapes in ${label}`, { matchesHex, matchesSurrogate, matchesBadUnicode, matchesOther });
  }

  const scrubbed = json
    .replace(/\\x[0-9A-Fa-f]{0,2}/g, "")
    // Remove surrogate escapes (\uD800-\uDFFF) - these cause xAI parse errors
    .replace(/\\u[dD][89aAbB][0-9a-fA-F]{2}/g, "")
    .replace(/\\u(?![0-9A-Fa-f]{4})/g, "")
    .replace(/\\[^"\\/bfnrtu]/g, "");

  return scrubbed;
};

const logEscapeDiagnostics = (label: string, value: string) => {
  const flags: string[] = [];
  const badHex = value.match(/\\x[0-9a-fA-F]{0,2}/g) || [];
  const badSurrogate = value.match(/\\u[dD][89aAbB][0-9a-fA-F]{2}/g) || [];
  const badUnicode = value.match(/\\u(?![0-9a-fA-F]{4})/g) || [];
  const badEscapes = value.match(/\\[^"\\/bfnrtu]/g) || [];
  if (badHex.length) flags.push(`\\x sequences: ${badHex.join(' | ')}`);
  if (badSurrogate.length) flags.push(`surrogate escapes: ${badSurrogate.join(' | ')}`);
  if (badUnicode.length) flags.push(`malformed \\u: ${badUnicode.join(' | ')}`);
  if (badEscapes.length) flags.push(`other escapes: ${badEscapes.join(' | ')}`);
  if (/[\u0000-\u001F]/.test(value)) flags.push('contains control chars');
  // Check for lone surrogates in the actual string (not escaped)
  if (/[\uD800-\uDFFF]/.test(value)) flags.push('contains lone surrogates in string');

  logDebug(`Diagnostics for ${label}`, {
    length: value.length,
    sample: value.slice(0, 200),
    flags: flags.length ? flags : ['none'],
    full: value.slice(0, 600)
  });

  // Ensure visibility even if console collapses objects
  try {
    console.log(`[Basic Service] ${label} diagnostics JSON`, JSON.stringify({
      length: value.length,
      sample: value.slice(0, 200),
      flags: flags.length ? flags : ['none'],
      full: value.slice(0, 600)
    }, null, 2));
  } catch (_) {
    // ignore
  }
};

// Sanitize content to only allow JSON-safe characters
// This is aggressive but prevents ALL escape sequence issues with xAI
const sanitizeContent = (content: string): string => {
  if (!content) return "";

  // Convert to array of char codes and filter
  const result: string[] = [];
  for (let i = 0; i < content.length; i++) {
    const code = content.charCodeAt(i);

    // SKIP surrogate pairs (0xD800-0xDFFF) - these cause xAI JSON parse errors
    // Lone surrogates are invalid and paired surrogates (emojis) can cause issues
    if (code >= 0xD800 && code <= 0xDFFF) {
      continue; // Skip ALL surrogates
    }

    // Allow: space (32), printable ASCII (33-126), and common extended chars
    if (code === 32 || (code >= 33 && code <= 126)) {
      // For backslash (92), skip it entirely to prevent escape sequence issues
      if (code !== 92) {
        result.push(content[i]);
      }
    } else if (code === 9 || code === 10 || code === 13) {
      // Convert tabs and newlines to spaces
      result.push(' ');
    } else if (code >= 160 && code <= 255) {
      // Allow Latin-1 Supplement (accented chars etc) except control chars
      result.push(content[i]);
    } else if (code >= 0x0400 && code <= 0x04FF) {
      // Allow Cyrillic
      result.push(content[i]);
    } else if (code >= 0x0600 && code <= 0x06FF) {
      // Allow Arabic
      result.push(content[i]);
    } else if (code >= 0x4E00 && code <= 0x9FFF) {
      // Allow CJK Unified Ideographs (Chinese, Japanese, Korean)
      result.push(content[i]);
    } else if (code >= 0x3040 && code <= 0x30FF) {
      // Allow Hiragana and Katakana
      result.push(content[i]);
    } else if (code >= 0xAC00 && code <= 0xD7AF) {
      // Allow Hangul Syllables (Korean)
      result.push(content[i]);
    } else if (code >= 0x0080 && code < 0xD800) {
      // Allow other BMP characters BEFORE surrogate range
      // Excludes line/paragraph separators (0x2028, 0x2029) implicitly
      if (code !== 0x2028 && code !== 0x2029) {
        result.push(content[i]);
      }
    } else if (code > 0xDFFF && code < 0xFFFF) {
      // Allow BMP characters AFTER surrogate range
      result.push(content[i]);
    }
    // All other characters (control chars, surrogates, etc) are dropped
  }

  return result.join('')
    // Collapse multiple spaces
    .replace(/ {2,}/g, ' ')
    .trim();
};

// Sanitize the final JSON string to remove any escape sequences that xAI can't handle
const sanitizeJsonBody = (json: string): string => {
  return json
    // Remove \x hex escapes (e.g., \x1b, \xAB)
    .replace(/\\x[0-9a-fA-F]{0,2}/g, "")
    // Remove surrogate escapes (\uD800-\uDFFF) - these cause xAI parse errors
    .replace(/\\u[dD][89aAbB][0-9a-fA-F]{2}/g, "")
    // Remove malformed \u escapes (must be \uXXXX with exactly 4 hex digits)
    .replace(/\\u(?![0-9a-fA-F]{4})/g, "")
    // Remove other problematic escapes
    .replace(/\\[^"\\/bfnrtu]/g, "");
};

// Retry configuration
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const fetchWithRetry = async (url: string, options: RequestInit, retryCount = 0): Promise<Response> => {
  try {
    logDebug(`Making request to ${url}`);
    logDebug('Request options:', {
      ...options,
      body: options.body ? '[redacted]' : undefined
    });

    const response = await fetch(url, options);
    logDebug(`Response status: ${response.status}`);

    // Don't read response body here for logging - it can only be read once!
    // The body will be read later in the main function

    if (response.status === 503 && retryCount < MAX_RETRIES) {
      const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
      logDebug(`Server overloaded, retrying in ${delay}ms...`);
      await sleep(delay);
      return fetchWithRetry(url, options, retryCount + 1);
    }

    return response;
  } catch (error) {
    logDebug('Fetch error:', error);
    if (retryCount < MAX_RETRIES) {
      const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
      logDebug(`Request failed, retrying in ${delay}ms...`);
      await sleep(delay);
      return fetchWithRetry(url, options, retryCount + 1);
    }
    throw error;
  }
};

export const processBasicText = async function* (request: ProcessTextRequest) {
  const { text, mode, settings, isFollowUp } = request
  const sanitizedText = sanitizeContent(text || "");
  const sanitizedContext = sanitizeContent(request.context || "");

  // Parallelize pre-request operations for faster startup
  const rateLimitService = new RateLimitService()

  // Run rate limit check and locale fetch in parallel to reduce latency
  const [actionsAvailable, responseLanguage] = await Promise.all([
    rateLimitService.checkActionAvailable(),
    settings.aiResponseLanguage ? Promise.resolve(settings.aiResponseLanguage) : getSelectedLocale()
  ]);

  logDebug('Processing text with settings:', {
    mode,
    responseLanguage,
    hasText: Boolean(text),
    textLength: (text || '').length,
    contextLength: (request.context || '').length,
    modelType: settings?.modelType
  });

  try {
    if (!actionsAvailable) {
      throw new Error("Daily action limit reached. Please try again tomorrow. Or use your API key.");
    }

    // Use action without waiting - fire and forget to reduce latency
    rateLimitService.useAction().then(remaining => {
      logDebug(`Actions remaining: ${remaining}`);
    }).catch(() => { /* ignore errors */ })

    // Get the system prompt (custom or default)
    const brevityHint = "Keep responses under 120 words. Use concise, natural paragraphs. Avoid fluff and be direct.";

    const getSystemPrompt = () => {
      // Language instruction to add to all system prompts
      const languageInstruction = responseLanguage !== "en"
        ? `\n\nIMPORTANT: Respond in ${responseLanguage} language. Adapt your response to be culturally appropriate for speakers of this language.`
        : "";

      // For follow-up questions, use enhanced context-aware prompts
      if (isFollowUp) {
        // If custom system prompt is available for follow-ups, use it
        if (settings.customPrompts?.systemPrompts?.[mode]) {
          return `${settings.customPrompts.systemPrompts[mode]} 

${brevityHint}

FOLLOW-UP CONTEXT: You are continuing the conversation. The user is asking a follow-up question about the same content. Maintain your expertise and perspective while providing fresh insights.${languageInstruction}`;
        }
        // Otherwise use enhanced follow-up prompt
        const basePrompt = FOLLOW_UP_SYSTEM_PROMPTS[mode] || FOLLOW_UP_SYSTEM_PROMPTS.free;
        return `${basePrompt}

${brevityHint}${languageInstruction}`;
      }

      // If custom system prompt is available, use it
      if (settings.customPrompts?.systemPrompts?.[mode]) {
        return `${settings.customPrompts.systemPrompts[mode]}

${brevityHint}${languageInstruction}`;
      }
      // Otherwise use default
      return `${SYSTEM_PROMPTS[mode]}

${brevityHint}${languageInstruction}`;
    };

    const getUserPrompt = () => {
      if (isFollowUp) {
        // Include rich context for follow-ups with original content and conversation history
        const originalContent = sanitizedContext.length > 400 ? sanitizedContext.substring(0, 400) + "..." : sanitizedContext;

        return `ORIGINAL CONTENT CONTEXT:
${originalContent}

FOLLOW-UP QUESTION: ${sanitizedText}

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
            .replace('${text}', sanitizedText);
        }

        // Otherwise use default
        const translateFn = USER_PROMPTS.translate as (fromLang: string, toLang: string) => string
        return translateFn(
          settings.translationSettings?.fromLanguage || "en",
          settings.translationSettings?.toLanguage || "es"
        ) + "\n" + sanitizedText;
      }

      // For other modes
      if (settings.customPrompts?.userPrompts?.[mode]) {
        // Use custom user prompt if available
        return settings.customPrompts.userPrompts[mode].replace('${text}', sanitizedText);
      }

      // Otherwise use default
      const prompt = USER_PROMPTS[mode];
      return typeof prompt === "function" ? prompt(sanitizedText) : prompt + "\n" + sanitizedText;
    };

    const messages = [
      {
        role: "system" as const,
        content: sanitizeContent(getSystemPrompt())
      },
      {
        role: "user" as const,
        content: sanitizeContent(getUserPrompt())
      }
    ];

    // Diagnostics for escape issues
    logEscapeDiagnostics('system prompt', messages[0].content);
    logEscapeDiagnostics('user prompt', messages[1].content);

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

    // Serialize and sanitize request body - use scrubJsonBody which also logs what it finds
    const rawJson = JSON.stringify(requestBody);
    const serializedBody = scrubJsonBody(rawJson, 'request body');
    logEscapeDiagnostics('serialized body', serializedBody);

    logDebug('Request body:', {
      model: requestBody.model,
      stream: requestBody.stream,
      temperature: requestBody.temperature,
      max_tokens: requestBody.max_tokens,
      messagesCount: requestBody.messages.length,
      systemLength: requestBody.messages[0]?.content?.length,
      userLength: requestBody.messages[1]?.content?.length
    });

    const response = await fetchWithRetry(PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: serializedBody
    });

    logDebug('Response received:', { status: response.status, ok: response.ok });

    if (!response.ok) {
      if (response.status === 503) {
        throw new Error("Server is currently overloaded. Please try again in a few moments.");
      }
      const errorText = await response.text();
      logDebug('Error response:', errorText);
      throw new Error(`Basic API Error: ${response.statusText} - ${errorText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Response body is not readable');
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let totalContent = '';

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        if (buffer.trim()) {
          yield {
            type: 'chunk',
            content: buffer.trim(),
            isFollowUp: request.isFollowUp,
            id: request.id
          };
        }
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
              yield {
                type: 'chunk',
                content: content,
                isFollowUp: request.isFollowUp,
                id: request.id
              };
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
            logDebug('Failed to parse streaming response line:', { line: trimmedLine, error: parseError });
          }
        }
      }
    }
  } catch (error) {
    logDebug('Error in processBasicText:', error);
    yield {
      type: 'error',
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
} 