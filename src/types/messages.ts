import type { Mode, ModelType, LocalModel } from "./settings"

export interface Entity {
    name: string;
    type: string;
    mentions: number;
    lastMentionedIndex: number;
    description?: string;
    relationships?: { [key: string]: string };
}

export interface ConversationContext {
    topic?: string;
    lastQuestion?: string;
    lastAnswer?: string;
    entities: Entity[];
    activeEntity: Entity | null;
    currentTopic: Entity | null;
    history: {
        role: "user" | "assistant";
        content: string;
        timestamp: number;
    }[];
}

export interface ProcessTextRequest {
    text: string;
    context?: string;
    conversationContext?: ConversationContext;
    mode: Mode;
    settings: {
        serverUrl: string;
        apiKey: string;
        geminiApiKey?: string;
        xaiApiKey?: string;
        openaiApiKey?: string;
        geminiModel?:
        | "gemini-2.0-flash"
        | "gemini-2.5-flash"
        | "gemini-2.5-flash-lite"
        | "gemini-2.5-pro"
        | "gemini-2.0-flash-lite"
        | "gemini-3-flash"
        | "gemini-3-pro-preview"
        | "gemini-3-pro";
        grokModel?:
        | "grok-4-1-fast-reasoning"
        | "grok-4-1-fast-non-reasoning"
        | "grok-4-fast-reasoning"
        | "grok-4-fast-non-reasoning"
        | "grok-4"
        | "grok-code-fast-1"
        | "grok-3"
        | "grok-3-mini"
        | "grok-3-fast"
        | "grok-3-mini-fast"
        | "grok-2-image-1212"
        | "grok-4-0709"
        | "grok-2-1212";
        openaiModel?:
        | "gpt-4o"
        | "gpt-4.1"
        | "gpt-5.2"
        | "gpt-4o-mini"
        | "o3-mini"
        | "o1"
        | "gpt-4-turbo";
        localModel?: LocalModel;
        maxTokens?: number;
        temperature?: number;
        stream?: boolean;
        translationSettings?: {
            fromLanguage: string;
            toLanguage: string;
        };
        aiResponseLanguage?: string;
        modelType: ModelType;
        customPrompts?: {
            systemPrompts: {
                [key in Mode]?: string;
            };
            userPrompts: {
                [key in Mode]?: string;
            };
        };
    };
    aborted?: boolean;
    isFollowUp?: boolean;
    id?: string;
    connectionId?: string;
}

export interface ProcessTextResponse {
    result?: string;
    error?: string;
    done?: boolean;
}

export interface StreamChunk {
    type: 'chunk' | 'error' | 'done' | 'aborted';
    content?: string;
    error?: string;
    isFollowUp?: boolean;
    id?: number;
} 