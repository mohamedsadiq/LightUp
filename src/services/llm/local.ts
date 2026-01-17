import type { ProcessTextRequest } from "~types/messages"
import { FeedbackProcessor } from "../feedback/feedbackProcessor"
import { SYSTEM_PROMPTS, USER_PROMPTS, FOLLOW_UP_SYSTEM_PROMPTS, getMaxTokensFromPromptOrSetting } from "../../utils/constants"
import { LANGUAGES } from "../../utils/constants"
import { getCurrentLocale } from "../../utils/i18n"

export const processLocalText = async function* (request: ProcessTextRequest) {
  const { text, mode, settings } = request
  const feedbackProcessor = new FeedbackProcessor()
  // Get the user's selected language for AI responses
  // Priority: 1) aiResponseLanguage setting (from website info selector)
  //          2) Extension UI language (from popup/options) as fallback
  const responseLanguage = settings.aiResponseLanguage || await getCurrentLocale()

  try {
    const { positivePatterns, negativePatterns } = await feedbackProcessor.getFeedbackContext(text)

    // Get the system prompt (custom or default)
    const getSystemPrompt = () => {
      // For follow-up questions, use enhanced context-aware prompts
      if (request.isFollowUp) {
        // If custom system prompt is available for follow-ups, use it WITHOUT language instruction
        if (settings.customPrompts?.systemPrompts?.[mode]) {
          return `${settings.customPrompts.systemPrompts[mode]}

FOLLOW-UP CONTEXT: You are continuing the conversation. The user is asking a follow-up question about the same content. Maintain your expertise and perspective while providing fresh insights.

Based on user feedback:
- Include patterns like: ${positivePatterns.slice(0, 3).join(', ')}
- Avoid patterns like: ${negativePatterns.slice(0, 3).join(', ')}
Keep responses under 1500 tokens.`;
        }
        // Otherwise use enhanced follow-up prompt with feedback context and language instruction
        const basePrompt = FOLLOW_UP_SYSTEM_PROMPTS[mode] || FOLLOW_UP_SYSTEM_PROMPTS.free;
        return `${basePrompt}

USER LANGUAGE: ${responseLanguage}

Based on user feedback:
- Include patterns like: ${positivePatterns.slice(0, 3).join(', ')}
- Avoid patterns like: ${negativePatterns.slice(0, 3).join(', ')}
Keep responses under 1500 tokens.`;
      }

      // If custom system prompt is available, use it WITHOUT language instruction
      const customSystemPrompt = settings.customPrompts?.systemPrompts?.[mode];
      if (customSystemPrompt) {
        // We still enhance with feedback context but NOT language instruction
        return `
          ${customSystemPrompt}

          Based on user feedback:
          - Include patterns like: ${positivePatterns.slice(0, 3).join(', ')}
          - Avoid patterns like: ${negativePatterns.slice(0, 3).join(', ')}
          Keep responses under 1500 tokens.
        `;
      }

      // Otherwise use default with feedback enhancement and language instruction
      return `
        ${SYSTEM_PROMPTS[mode]}
        USER LANGUAGE: ${responseLanguage}

        Based on user feedback:
        - Include patterns like: ${positivePatterns.slice(0, 3).join(', ')}
        - Avoid patterns like: ${negativePatterns.slice(0, 3).join(', ')}
        Keep responses under 1500 tokens.
      `;
    };

    // Get the user prompt (custom or default)
    const getUserPrompt = () => {
      // For follow-up questions
      if (request.isFollowUp) {
        // Include rich context for follow-ups with original content and conversation history
        const contextText = request.context || '';
        const originalContent = contextText.length > 400 ? contextText.substring(0, 400) + "..." : contextText;

        return `ORIGINAL CONTENT CONTEXT:
${originalContent}

FOLLOW-UP QUESTION: ${text}

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
            .replace('${text}', text);
        }

        // Otherwise use default
        return `Translate to ${LANGUAGES[settings.translationSettings?.toLanguage || "es"]}:\n\n${text}`;
      }

      // For other modes
      if (settings.customPrompts?.userPrompts?.[mode]) {
        // Use custom user prompt if available
        return settings.customPrompts.userPrompts[mode].replace('${text}', text);
      }

      // Otherwise use default
      return `${USER_PROMPTS[mode]}\n${text}`;
    };

    const response = await fetch(`${settings.serverUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: settings.localModel || "llama-2-70b-chat",
        messages: [
          {
            role: "system",
            content: getSystemPrompt()
          },
          {
            role: "user",
            content: getUserPrompt()
          }
        ],
        max_tokens: getMaxTokensFromPromptOrSetting(mode, getSystemPrompt()) || settings.maxTokens || 2048,
        temperature: 0.5,
        stream: true
      }),
    })

    if (!response.ok) {
      throw new Error(`Local LLM API Error: ${response.statusText}`)
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('Response body is not readable')
    }

    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()

      if (done) {
        if (buffer) {
          yield {
            type: 'chunk',
            content: buffer,
            isFollowUp: request.isFollowUp,
            id: request.id
          }
        }
        yield {
          type: 'done',
          isFollowUp: request.isFollowUp,
          id: request.id
        }
        break
      }

      buffer += decoder.decode(value, { stream: true })

      // Optimize buffer handling for faster response
      if (buffer.length > 500) {
        // For large chunks, process immediately without waiting for line breaks
        yield {
          type: 'chunk',
          content: buffer,
          isFollowUp: request.isFollowUp,
          id: request.id
        }
        buffer = ''
        continue
      }

      // Process complete lines from buffer
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      // Process multiple lines at once for faster response
      const chunksToProcess = []

      for (const line of lines) {
        if (line.trim() === '') continue

        try {
          const data = JSON.parse(line.replace(/^data: /, ''))
          if (data.choices?.[0]?.delta?.content) {
            chunksToProcess.push(data.choices[0].delta.content)
          }
        } catch (e) {
          console.warn('Failed to parse line:', line)
        }
      }

      // Combine chunks and send in bulk for faster display
      if (chunksToProcess.length > 0) {
        yield {
          type: 'chunk',
          content: chunksToProcess.join(''),
          isFollowUp: request.isFollowUp,
          id: request.id
        }
      }
    }
  } catch (error) {
    yield {
      type: 'error',
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
} 