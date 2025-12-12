import type { Settings } from "~types/settings";
import type { EnhancedConversationContext } from "../conversation/ConversationMemoryManager";

/**
 * Chain-of-Thought Prompting System
 * Implements advanced reasoning patterns for enhanced AI responses
 */

export interface ReasoningStep {
  step: number;
  description: string;
  reasoning: string;
  conclusion: string;
}

export interface ChainOfThoughtConfig {
  enableReasoning: boolean;
  reasoningDepth: "simple" | "intermediate" | "complex";
  includeStepByStep: boolean;
  enableSelfReflection: boolean;
  includeAlternatives: boolean;
}

export class ChainOfThoughtPrompts {
  private config: ChainOfThoughtConfig;

  constructor(config?: Partial<ChainOfThoughtConfig>) {
    this.config = {
      enableReasoning: true,
      reasoningDepth: "intermediate",
      includeStepByStep: true,
      enableSelfReflection: true,
      includeAlternatives: false,
      ...config
    };
  }

  /**
   * Enhanced System Prompts with Chain-of-Thought Integration
   * IMPORTANT: User's custom prompts from settings take priority over defaults
   */
  buildEnhancedSystemPrompt(
    mode: string,
    context: EnhancedConversationContext,
    userQuery: string,
    settings: Settings
  ): string {
    // PRIORITY: Use user's custom system prompt if available, otherwise use default
    const userCustomPrompt = settings.customPrompts?.systemPrompts?.[mode as keyof typeof settings.customPrompts.systemPrompts];
    const basePrompt = userCustomPrompt || this.getBaseSystemPrompt(mode);
    
    // Only add reasoning framework if context exists (for follow-ups)
    const contextAwareness = context?.contextWindow?.length > 0 ? this.buildContextAwareness(context) : '';

    // Build the final prompt - keep it simple to respect user's prompt
    // If user has a custom prompt, use it more directly without heavy modifications
    if (userCustomPrompt) {
      // User has customized their prompt - respect it with minimal additions
      return contextAwareness ? `${basePrompt}\n\n${contextAwareness}` : basePrompt;
    }

    // Default behavior for non-customized prompts - provide general structure guidance
    const reasoningInstructions = this.buildReasoningInstructions(mode, userQuery, context);
    const outputFormat = this.buildOutputFormat(mode);

    return `${basePrompt}

${contextAwareness}

${reasoningInstructions}

${outputFormat}

Remember: Be concise and direct. Prioritize clarity over comprehensiveness.`;
  }

  /**
   * Multi-Shot Prompting with Examples
   */
  buildFewShotExamples(mode: string): string {
    const examples = this.getFewShotExamples(mode);
    if (examples.length === 0) return "";

    return `Here are examples of high-quality responses for this type of request:

${examples.map((example, index) => `
EXAMPLE ${index + 1}:
USER: ${example.user}
ASSISTANT: ${example.assistant}
`).join('\n')}

Now, please provide a similar high-quality response to the current request:`;
  }

  /**
   * Step-by-Step Reasoning Framework
   */
  private buildReasoningInstructions(
    mode: string,
    userQuery: string,
    context: EnhancedConversationContext
  ): string {
    let instructions = `REASONING FRAMEWORK:
Before providing your response, think through the following steps:`;

    // Add mode-specific reasoning steps
    const reasoningSteps = this.getModeSpecificReasoningSteps(mode, userQuery);
    instructions += reasoningSteps;

    // Add context-aware reasoning
    if (context.contextWindow.length > 0) {
      instructions += `

5. CONTEXT INTEGRATION:
   - Review our conversation history for relevant context
   - Identify connections to previous discussions
   - Ensure consistency with earlier responses
   - Build upon established knowledge`;
    }

    // Add self-reflection if enabled
    if (this.config.enableSelfReflection) {
      instructions += `

6. SELF-REFLECTION:
   - Consider potential alternative interpretations
   - Identify any assumptions you're making
   - Evaluate the completeness of your response
   - Check for potential biases or limitations`;
    }

    return instructions;
  }

  /**
   * Context-Aware Prompt Construction
   */
  private buildContextAwareness(context: EnhancedConversationContext): string {
    let contextPrompt = `CONTEXTUAL AWARENESS:`;

    // Add conversation summary if available
    if (context.summary) {
      contextPrompt += `
- Conversation Summary: ${context.summary.summary}
- Key Topics Discussed: ${context.summary.keyPoints.slice(0, 3).join(', ')}`;
    }

    // Add entity awareness
    if (context.entities.length > 0) {
      const keyEntities = context.entities
        .sort((a, b) => b.mentions - a.mentions)
        .slice(0, 5);
      
      contextPrompt += `
- Key Entities: ${keyEntities.map(e => `${e.name} (${e.type})`).join(', ')}`;
    }

    // Add user preferences
    if (context.userPreferences.responseStyle) {
      contextPrompt += `
- Preferred Response Style: ${context.userPreferences.responseStyle}`;
    }

    if (context.userPreferences.expertiseLevel) {
      contextPrompt += `
- User Expertise Level: ${context.userPreferences.expertiseLevel}`;
    }

    return contextPrompt;
  }

  /**
   * Mode-Specific Reasoning Steps
   */
  private getModeSpecificReasoningSteps(mode: string, userQuery: string): string {
    const stepTemplates = {
      analyze: `
1. ANALYSIS STRUCTURE:
   - Break down the content into key components
   - Identify main themes, patterns, or issues
   - Consider multiple perspectives or interpretations
   - Evaluate evidence and supporting details

2. CRITICAL THINKING:
   - What are the strengths and weaknesses?
   - What questions does this raise?
   - Are there any logical gaps or inconsistencies?
   - What additional context might be relevant?

3. SYNTHESIS:
   - How do the different elements connect?
   - What are the broader implications?
   - What conclusions can be drawn?

4. PRACTICAL APPLICATION:
   - How can this analysis be useful?
   - What actionable insights emerge?`,

      explain: `
1. UNDERSTANDING CHECK:
   - What exactly is being asked?
   - What level of detail is appropriate?
   - What background knowledge can I assume?

2. EXPLANATION STRUCTURE:
   - Start with the big picture or core concept
   - Break down complex ideas into simpler parts
   - Use analogies or examples where helpful
   - Address potential confusion points

3. CLARITY VERIFICATION:
   - Is my explanation clear and accessible?
   - Have I avoided unnecessary jargon?
   - Are my examples relevant and helpful?

4. COMPLETENESS CHECK:
   - Have I covered all important aspects?
   - Are there follow-up questions I should address?`,

      summarize: `
1. CONTENT ANALYSIS:
   - Identify the main topic and purpose
   - Extract key points and supporting details
   - Note any important conclusions or recommendations

2. PRIORITIZATION:
   - Which information is most crucial?
   - What can be condensed without losing meaning?
   - How should information be organized for clarity?

3. SYNTHESIS:
   - Create a coherent narrative from key points
   - Maintain the original intent and tone
   - Ensure logical flow between ideas

4. VALIDATION:
   - Does the summary accurately represent the original?
   - Is it appropriately concise yet comprehensive?`,

      translate: `
1. SOURCE ANALYSIS:
   - Understand the context and purpose of the text
   - Identify cultural references or idioms
   - Note the tone and style of the original

2. LINGUISTIC CONSIDERATIONS:
   - Consider direct vs. adaptive translation approaches
   - Identify potential translation challenges
   - Think about cultural adaptation needs

3. QUALITY ASSURANCE:
   - Ensure accuracy of meaning
   - Maintain appropriate tone and style
   - Check for natural flow in target language

4. CULTURAL SENSITIVITY:
   - Adapt cultural references appropriately
   - Consider target audience expectations`,

      free: `
1. QUERY UNDERSTANDING:
   - What is the user really asking for?
   - What type of response would be most helpful?
   - Are there any implicit needs or concerns?

2. KNOWLEDGE SYNTHESIS:
   - What relevant information do I have?
   - How can I best organize and present it?
   - What examples or analogies might help?

3. RESPONSE PLANNING:
   - What's the most logical structure for my response?
   - How can I make this engaging and useful?
   - What level of detail is appropriate?

4. VALUE ADDITION:
   - How can I go beyond just answering the question?
   - What additional insights might be valuable?`
    };

    return stepTemplates[mode as keyof typeof stepTemplates] || stepTemplates.free;
  }

  /**
   * Output Format Instructions
   */
  private buildOutputFormat(mode: string): string {
    const formatInstructions = {
      analyze: `RESPONSE FORMAT:
1. Provide a concise executive summary highlighting the most important findings.
2. Use bullet points or short paragraphs to present key insights, patterns, and implications.
3. Highlight strengths, weaknesses, and potential risks or opportunities.
4. End with actionable recommendations or next steps when applicable.
5. Keep the response focused; rely on the prompt for any explicit length guidance.`,

      explain: `RESPONSE FORMAT:
1. Start with a brief overview in 1-2 sentences.
2. Break the explanation into clear sections or bullet points.
3. Use plain language and define any technical terms.
4. Provide a real-world analogy or example if it improves clarity.
5. Keep the response focused; rely on the prompt for any explicit length guidance.`,

      summarize: `RESPONSE FORMAT:
1. Present 3-5 bullet points capturing the core ideas.
2. Keep each bullet concise and focused on a single concept.
3. Preserve key facts, numbers, or names that are essential to understanding.
4. Maintain the tone of the original content where relevant.
5. Keep the response focused; rely on the prompt for any explicit length guidance.`,

      translate: `RESPONSE FORMAT:
1. Provide a faithful translation that preserves tone and nuance.
2. Ensure terminology and naming conventions remain consistent.
3. Maintain paragraph breaks and formatting from the original text.
4. Note cultural references that may benefit from adaptation when appropriate.
5. Keep the response focused; rely on the prompt for any explicit length guidance.`,

      free: `RESPONSE FORMAT:
1. Address the user's query directly in the opening sentence.
2. Use concise paragraphs or bullet points for clarity.
3. Provide supporting details or reasoning when giving advice or explanations.
4. Offer follow-up suggestions or next steps when helpful.
5. Keep the response focused; rely on the prompt for any explicit length guidance.`
    } as const;

    return formatInstructions[mode as keyof typeof formatInstructions] || formatInstructions.free;
  }

  /**
   * Few-Shot Examples for Different Modes
   */
  private getFewShotExamples(mode: string): Array<{ user: string; assistant: string }> {
    const examples = {
      analyze: [
        {
          user: "Can you analyze this business proposal?",
          assistant: `I'll analyze this business proposal systematically:

**STRENGTHS:**
• Clear value proposition with specific target market
• Realistic financial projections with conservative growth estimates
• Strong management team with relevant experience

**AREAS FOR IMPROVEMENT:**
• Market competition analysis lacks depth
• Risk mitigation strategies need more detail
• Customer acquisition costs may be underestimated

**KEY INSIGHTS:**
The proposal shows promise but would benefit from more robust market research and competitive analysis. The financial model is conservative, which is positive for investor confidence.

**RECOMMENDATION:**
Address the competitive landscape and customer acquisition strategy before final presentation.`
        }
      ],

      explain: [
        {
          user: "How does machine learning work?",
          assistant: `Think of machine learning like teaching a child to recognize animals:

**THE BASIC CONCEPT:**
Just as a child learns to identify cats by seeing many examples, machine learning algorithms learn patterns from data.

**THE PROCESS:**
1. **Training**: Show the algorithm thousands of examples (photos labeled "cat" or "dog")
2. **Pattern Recognition**: It finds common features (cats have pointed ears, dogs vary more in size)
3. **Testing**: Present new photos to see if it can correctly identify animals
4. **Improvement**: Adjust based on mistakes to get better accuracy

**REAL-WORLD APPLICATION:**
This same principle powers recommendation systems (Netflix suggests movies based on your viewing history) and voice recognition (Siri learns to understand different accents).

The key insight: ML doesn't follow programmed rules—it discovers patterns in data to make predictions about new situations.`
        }
      ],

      summarize: [
        {
          user: "Summarize this 10-page research paper on climate change impacts.",
          assistant: `**CLIMATE CHANGE IMPACTS SUMMARY**

**Main Finding:** Global temperature rise of 1.1°C since pre-industrial times is causing widespread environmental and social disruptions.

**Key Impacts Identified:**
• **Environmental**: Accelerated ice sheet melting, extreme weather events increase by 40%
• **Economic**: $23 trillion in potential damages by 2100 under current trajectory  
• **Social**: 200 million climate refugees projected by 2050

**Critical Tipping Points:**
The research identifies 2°C warming as a critical threshold beyond which impacts become irreversible.

**Urgency:** The window for limiting warming to 1.5°C closes by 2030, requiring immediate global action.

**Bottom Line:** The paper presents compelling evidence that climate impacts are accelerating faster than previous models predicted, emphasizing the need for immediate mitigation strategies.`
        }
      ]
    };

    return examples[mode as keyof typeof examples] || [];
  }

  /**
   * Base system prompts with enhanced reasoning capabilities
   * Note: Word limits are NOT hardcoded here - they are controlled by buildOutputFormat
   * which respects the user's response length setting
   */
  private getBaseSystemPrompt(mode: string): string {
    const basePrompts = {
      analyze: `You are an analytical expert. Provide focused analysis highlighting patterns, strengths, weaknesses, and key insights. Use bullet points for clarity.`,

      explain: `You are an expert educator. Deliver clear explanations using short paragraphs or bullet points. Focus on the 'why' and 'how'. Avoid jargon.`,

      summarize: `You are a professional summarizer. Produce concise summaries using bullet points. Prioritize key facts and conclusions. Be brief.`,

      translate: `You are a professional linguist and cultural bridge-builder who provides accurate translations while preserving meaning, tone, and cultural context. You understand nuance and adapt content appropriately for target audiences.`,

      free: `You are a knowledgeable and thoughtful AI assistant who provides helpful, accurate, and well-reasoned responses. You think critically, consider multiple perspectives, and tailor your communication style to best serve the user's needs.`
    };

    return basePrompts[mode as keyof typeof basePrompts] || basePrompts.free;
  }

  /**
   * Self-Correction and Reflection Prompts
   */
  buildSelfCorrectionPrompt(initialResponse: string, userFeedback?: string): string {
    return `Please review your previous response and consider improvements:

PREVIOUS RESPONSE:
${initialResponse}

${userFeedback ? `USER FEEDBACK: ${userFeedback}` : ''}

SELF-REFLECTION QUESTIONS:
1. Is the response accurate and complete?
2. Could the explanation be clearer or more accessible?
3. Are there any important perspectives missing?
4. Would additional examples or details be helpful?
5. Is the tone and style appropriate for the user's needs?

Please provide an improved response that addresses any identified shortcomings.`;
  }

  /**
   * Follow-up Question Generation
   */
  generateFollowUpSuggestions(
    userQuery: string,
    assistantResponse: string,
    context: EnhancedConversationContext
  ): string[] {
    const suggestions: string[] = [];

    // Generate context-aware follow-up questions
    const queryWords = userQuery.toLowerCase().split(' ');
    
    if (queryWords.includes('how')) {
      suggestions.push("Can you provide a specific example of this?");
      suggestions.push("What are the most common challenges with this approach?");
    }

    if (queryWords.includes('why')) {
      suggestions.push("What are the underlying causes of this?");
      suggestions.push("How does this compare to alternative explanations?");
    }

    if (queryWords.includes('what')) {
      suggestions.push("How can I apply this practically?");
      suggestions.push("What related topics should I explore?");
    }

    // Add context-specific suggestions based on conversation history
    if (context.entities.length > 0) {
      const topEntity = context.entities.sort((a, b) => b.mentions - a.mentions)[0];
      suggestions.push(`Tell me more about ${topEntity.name}`);
    }

    return suggestions.slice(0, 3); // Return top 3 suggestions
  }
} 