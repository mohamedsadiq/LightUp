import type { LocalModel, LocalModelMetadata, LocalModelCategory } from "~types/settings"

// Comprehensive metadata for all local models
export const LOCAL_MODELS_METADATA: Record<LocalModel, LocalModelMetadata> = {
  // Llama 4 Series (Latest)
  "llama-4-70b": {
    category: "general",
    parameters: 70,
    vramRequired: "40GB+ VRAM",
    speed: "slow",
    quality: "excellent",
    contextWindow: 128000,
    privacy: "100% offline",
    recommendedFor: ["General tasks", "Complex reasoning", "Long documents"],
    hardwareTier: "ultra"
  },
  "llama-4-40b": {
    category: "general",
    parameters: 40,
    vramRequired: "24GB+ VRAM",
    speed: "medium",
    quality: "excellent",
    contextWindow: 128000,
    privacy: "100% offline",
    recommendedFor: ["General tasks", "Professional work", "Content creation"],
    hardwareTier: "high"
  },

  // Llama 3.3 Series
  "llama-3.3-70b": {
    category: "general",
    parameters: 70,
    vramRequired: "40GB+ VRAM",
    speed: "slow",
    quality: "excellent",
    contextWindow: 128000,
    privacy: "100% offline",
    recommendedFor: ["General tasks", "Complex reasoning", "Long documents"],
    hardwareTier: "ultra"
  },
  "llama-3.3-8b": {
    category: "general",
    parameters: 8,
    vramRequired: "8GB VRAM",
    speed: "fast",
    quality: "good",
    contextWindow: 128000,
    privacy: "100% offline",
    recommendedFor: ["Everyday tasks", "Quick responses", "Edge devices"],
    hardwareTier: "mid"
  },

  // Llama 3.2 Series (Compact)
  "llama-3.2-3b-instruct": {
    category: "compact",
    parameters: 3,
    vramRequired: "4GB VRAM",
    speed: "fast",
    quality: "good",
    contextWindow: 128000,
    privacy: "100% offline",
    recommendedFor: ["Mobile devices", "Quick tasks", "Low latency"],
    hardwareTier: "low"
  },
  "llama-3.2-1b": {
    category: "compact",
    parameters: 1,
    vramRequired: "2GB VRAM",
    speed: "fast",
    quality: "fair",
    contextWindow: 128000,
    privacy: "100% offline",
    recommendedFor: ["Ultra-compact devices", "Simple tasks", "Testing"],
    hardwareTier: "low"
  },

  // Llama 3.1 Series
  "llama-3.1-405b": {
    category: "general",
    parameters: 405,
    vramRequired: "200GB+ VRAM",
    speed: "slow",
    quality: "excellent",
    contextWindow: 128000,
    privacy: "100% offline",
    recommendedFor: ["Enterprise", "Research", "Maximum performance"],
    hardwareTier: "ultra"
  },
  "llama-3.1-70b": {
    category: "general",
    parameters: 70,
    vramRequired: "40GB+ VRAM",
    speed: "slow",
    quality: "excellent",
    contextWindow: 128000,
    privacy: "100% offline",
    recommendedFor: ["General tasks", "Complex reasoning", "Long documents"],
    hardwareTier: "ultra"
  },
  "llama-3.1-8b": {
    category: "general",
    parameters: 8,
    vramRequired: "8GB VRAM",
    speed: "fast",
    quality: "good",
    contextWindow: 128000,
    privacy: "100% offline",
    recommendedFor: ["Everyday tasks", "Quick responses", "Edge devices"],
    hardwareTier: "mid"
  },

  // Llama 2 Series (Legacy)
  "llama-2-70b-chat": {
    category: "general",
    parameters: 70,
    vramRequired: "40GB+ VRAM",
    speed: "slow",
    quality: "good",
    contextWindow: 4096,
    privacy: "100% offline",
    recommendedFor: ["Legacy support", "Compatibility"],
    hardwareTier: "ultra"
  },
  "llama-2-13b-chat": {
    category: "general",
    parameters: 13,
    vramRequired: "10GB VRAM",
    speed: "medium",
    quality: "good",
    contextWindow: 4096,
    privacy: "100% offline",
    recommendedFor: ["Legacy support", "Compatibility"],
    hardwareTier: "mid"
  },

  // DeepSeek R1 Series (Reasoning)
  "deepseek-r1": {
    category: "reasoning",
    parameters: 671,
    vramRequired: "400GB+ VRAM",
    speed: "slow",
    quality: "excellent",
    contextWindow: 64000,
    privacy: "100% offline",
    recommendedFor: ["Complex reasoning", "Math", "Research"],
    hardwareTier: "ultra"
  },
  "deepseek-r1-distill-llama-70b": {
    category: "reasoning",
    parameters: 70,
    vramRequired: "40GB+ VRAM",
    speed: "slow",
    quality: "excellent",
    contextWindow: 64000,
    privacy: "100% offline",
    recommendedFor: ["Reasoning tasks", "Problem solving"],
    hardwareTier: "ultra"
  },
  "deepseek-r1-distill-llama-8b": {
    category: "reasoning",
    parameters: 8,
    vramRequired: "8GB VRAM",
    speed: "fast",
    quality: "good",
    contextWindow: 64000,
    privacy: "100% offline",
    recommendedFor: ["Reasoning on edge devices", "Quick thinking"],
    hardwareTier: "mid"
  },
  "deepseek-r1-distill-qwen-32b": {
    category: "reasoning",
    parameters: 32,
    vramRequired: "20GB VRAM",
    speed: "medium",
    quality: "excellent",
    contextWindow: 64000,
    privacy: "100% offline",
    recommendedFor: ["Advanced reasoning", "Complex problems"],
    hardwareTier: "high"
  },
  "deepseek-r1-distill-qwen-14b": {
    category: "reasoning",
    parameters: 14,
    vramRequired: "10GB VRAM",
    speed: "medium",
    quality: "good",
    contextWindow: 64000,
    privacy: "100% offline",
    recommendedFor: ["Reasoning tasks", "Problem solving"],
    hardwareTier: "mid"
  },
  "deepseek-r1-distill-qwen-7b": {
    category: "reasoning",
    parameters: 7,
    vramRequired: "6GB VRAM",
    speed: "fast",
    quality: "good",
    contextWindow: 64000,
    privacy: "100% offline",
    recommendedFor: ["Quick reasoning", "Edge devices"],
    hardwareTier: "low"
  },
  "deepseek-r1-distill-qwen-1.5b": {
    category: "reasoning",
    parameters: 1.5,
    vramRequired: "2GB VRAM",
    speed: "fast",
    quality: "fair",
    contextWindow: 64000,
    privacy: "100% offline",
    recommendedFor: ["Ultra-compact reasoning", "Testing"],
    hardwareTier: "low"
  },

  // DeepSeek V3 Series
  "deepseek-v3.1": {
    category: "general",
    parameters: 685,
    vramRequired: "400GB+ VRAM",
    speed: "slow",
    quality: "excellent",
    contextWindow: 128000,
    privacy: "100% offline",
    recommendedFor: ["Enterprise", "Maximum performance"],
    hardwareTier: "ultra"
  },
  "deepseek-v3": {
    category: "general",
    parameters: 671,
    vramRequired: "400GB+ VRAM",
    speed: "slow",
    quality: "excellent",
    contextWindow: 128000,
    privacy: "100% offline",
    recommendedFor: ["Enterprise", "Maximum performance"],
    hardwareTier: "ultra"
  },
  "deepseek-v3-base": {
    category: "general",
    parameters: 671,
    vramRequired: "400GB+ VRAM",
    speed: "slow",
    quality: "excellent",
    contextWindow: 128000,
    privacy: "100% offline",
    recommendedFor: ["Fine-tuning base", "Research"],
    hardwareTier: "ultra"
  },

  // DeepSeek Coder Series
  "deepseek-coder-v2": {
    category: "coding",
    parameters: 16,
    vramRequired: "12GB VRAM",
    speed: "medium",
    quality: "excellent",
    contextWindow: 128000,
    privacy: "100% offline",
    recommendedFor: ["Programming", "Code generation", "Debugging"],
    hardwareTier: "mid"
  },
  "deepseek-coder-33b": {
    category: "coding",
    parameters: 33,
    vramRequired: "20GB VRAM",
    speed: "medium",
    quality: "excellent",
    contextWindow: 128000,
    privacy: "100% offline",
    recommendedFor: ["Advanced programming", "Large codebases"],
    hardwareTier: "high"
  },
  "deepseek-coder-6.7b": {
    category: "coding",
    parameters: 6.7,
    vramRequired: "6GB VRAM",
    speed: "fast",
    quality: "good",
    contextWindow: 128000,
    privacy: "100% offline",
    recommendedFor: ["Quick coding", "Edge devices"],
    hardwareTier: "low"
  },

  // Qwen 3 Series
  "qwen3-32b": {
    category: "general",
    parameters: 32,
    vramRequired: "20GB VRAM",
    speed: "medium",
    quality: "excellent",
    contextWindow: 32000,
    privacy: "100% offline",
    recommendedFor: ["General tasks", "Professional work"],
    hardwareTier: "high"
  },
  "qwen3-14b": {
    category: "general",
    parameters: 14,
    vramRequired: "10GB VRAM",
    speed: "fast",
    quality: "good",
    contextWindow: 32000,
    privacy: "100% offline",
    recommendedFor: ["Everyday tasks", "Quick responses"],
    hardwareTier: "mid"
  },
  "qwen3-coder": {
    category: "coding",
    parameters: 14,
    vramRequired: "10GB VRAM",
    speed: "fast",
    quality: "excellent",
    contextWindow: 32000,
    privacy: "100% offline",
    recommendedFor: ["Programming", "Code generation"],
    hardwareTier: "mid"
  },

  // Qwen 2.5 Series
  "qwen2.5-72b": {
    category: "general",
    parameters: 72,
    vramRequired: "40GB+ VRAM",
    speed: "slow",
    quality: "excellent",
    contextWindow: 128000,
    privacy: "100% offline",
    recommendedFor: ["General tasks", "Complex reasoning"],
    hardwareTier: "ultra"
  },
  "qwen2.5-32b": {
    category: "general",
    parameters: 32,
    vramRequired: "20GB VRAM",
    speed: "medium",
    quality: "excellent",
    contextWindow: 128000,
    privacy: "100% offline",
    recommendedFor: ["General tasks", "Professional work"],
    hardwareTier: "high"
  },
  "qwen2.5-14b": {
    category: "general",
    parameters: 14,
    vramRequired: "10GB VRAM",
    speed: "fast",
    quality: "good",
    contextWindow: 128000,
    privacy: "100% offline",
    recommendedFor: ["Everyday tasks", "Quick responses"],
    hardwareTier: "mid"
  },
  "qwen2.5-7b": {
    category: "general",
    parameters: 7,
    vramRequired: "6GB VRAM",
    speed: "fast",
    quality: "good",
    contextWindow: 128000,
    privacy: "100% offline",
    recommendedFor: ["Everyday tasks", "Edge devices"],
    hardwareTier: "low"
  },
  "qwen2.5-3b": {
    category: "compact",
    parameters: 3,
    vramRequired: "4GB VRAM",
    speed: "fast",
    quality: "good",
    contextWindow: 32000,
    privacy: "100% offline",
    recommendedFor: ["Mobile devices", "Quick tasks"],
    hardwareTier: "low"
  },
  "qwen2.5-coder-32b": {
    category: "coding",
    parameters: 32,
    vramRequired: "20GB VRAM",
    speed: "medium",
    quality: "excellent",
    contextWindow: 128000,
    privacy: "100% offline",
    recommendedFor: ["Advanced programming", "Large codebases"],
    hardwareTier: "high"
  },
  "qwen2.5-coder-7b": {
    category: "coding",
    parameters: 7,
    vramRequired: "6GB VRAM",
    speed: "fast",
    quality: "good",
    contextWindow: 128000,
    privacy: "100% offline",
    recommendedFor: ["Quick coding", "Edge devices"],
    hardwareTier: "low"
  },
  "qwen2.5-math-72b": {
    category: "reasoning",
    parameters: 72,
    vramRequired: "40GB+ VRAM",
    speed: "slow",
    quality: "excellent",
    contextWindow: 32000,
    privacy: "100% offline",
    recommendedFor: ["Mathematics", "Scientific computing"],
    hardwareTier: "ultra"
  },
  "qwen2.5-math-7b": {
    category: "reasoning",
    parameters: 7,
    vramRequired: "6GB VRAM",
    speed: "fast",
    quality: "good",
    contextWindow: 32000,
    privacy: "100% offline",
    recommendedFor: ["Quick math", "Edge devices"],
    hardwareTier: "low"
  },

  // Mistral Series
  "mistral-large-3": {
    category: "general",
    parameters: 123,
    vramRequired: "70GB+ VRAM",
    speed: "slow",
    quality: "excellent",
    contextWindow: 128000,
    privacy: "100% offline",
    recommendedFor: ["Enterprise", "Professional work"],
    hardwareTier: "ultra"
  },
  "mixtral-8x22b": {
    category: "general",
    parameters: 141,
    vramRequired: "80GB+ VRAM",
    speed: "slow",
    quality: "excellent",
    contextWindow: 64000,
    privacy: "100% offline",
    recommendedFor: ["Enterprise", "Complex tasks"],
    hardwareTier: "ultra"
  },
  "mixtral-8x7b-instruct": {
    category: "general",
    parameters: 47,
    vramRequired: "30GB VRAM",
    speed: "medium",
    quality: "excellent",
    contextWindow: 32000,
    privacy: "100% offline",
    recommendedFor: ["Professional work", "Content creation"],
    hardwareTier: "high"
  },
  "mistral-7b-instruct-v0.3": {
    category: "general",
    parameters: 7,
    vramRequired: "6GB VRAM",
    speed: "fast",
    quality: "good",
    contextWindow: 32000,
    privacy: "100% offline",
    recommendedFor: ["Everyday tasks", "Edge devices"],
    hardwareTier: "low"
  },
  "codestral-22b": {
    category: "coding",
    parameters: 22,
    vramRequired: "14GB VRAM",
    speed: "medium",
    quality: "excellent",
    contextWindow: 32000,
    privacy: "100% offline",
    recommendedFor: ["Programming", "Code generation"],
    hardwareTier: "mid"
  },

  // Phi Series
  "phi-3-mini-4k": {
    category: "compact",
    parameters: 3.8,
    vramRequired: "4GB VRAM",
    speed: "fast",
    quality: "good",
    contextWindow: 4000,
    privacy: "100% offline",
    recommendedFor: ["Mobile devices", "Quick tasks"],
    hardwareTier: "low"
  },
  "phi-3-mini-128k": {
    category: "compact",
    parameters: 3.8,
    vramRequired: "4GB VRAM",
    speed: "fast",
    quality: "good",
    contextWindow: 128000,
    privacy: "100% offline",
    recommendedFor: ["Mobile devices", "Long context"],
    hardwareTier: "low"
  },
  "phi-3-medium-128k": {
    category: "general",
    parameters: 14,
    vramRequired: "10GB VRAM",
    speed: "medium",
    quality: "good",
    contextWindow: 128000,
    privacy: "100% offline",
    recommendedFor: ["General tasks", "Long context"],
    hardwareTier: "mid"
  },
  "phi-4": {
    category: "general",
    parameters: 14,
    vramRequired: "10GB VRAM",
    speed: "medium",
    quality: "excellent",
    contextWindow: 32000,
    privacy: "100% offline",
    recommendedFor: ["General tasks", "Professional work"],
    hardwareTier: "mid"
  },
  "phi-4-mini": {
    category: "compact",
    parameters: 3.8,
    vramRequired: "4GB VRAM",
    speed: "fast",
    quality: "good",
    contextWindow: 32000,
    privacy: "100% offline",
    recommendedFor: ["Mobile devices", "Quick tasks"],
    hardwareTier: "low"
  },
  "phi-4-reasoning": {
    category: "reasoning",
    parameters: 14,
    vramRequired: "10GB VRAM",
    speed: "medium",
    quality: "excellent",
    contextWindow: 32000,
    privacy: "100% offline",
    recommendedFor: ["Reasoning tasks", "Problem solving"],
    hardwareTier: "mid"
  },

  // Gemma Series
  "gemma3-27b": {
    category: "general",
    parameters: 27,
    vramRequired: "18GB VRAM",
    speed: "medium",
    quality: "excellent",
    contextWindow: 128000,
    privacy: "100% offline",
    recommendedFor: ["General tasks", "Professional work"],
    hardwareTier: "high"
  },
  "gemma3-9b": {
    category: "general",
    parameters: 9,
    vramRequired: "8GB VRAM",
    speed: "fast",
    quality: "good",
    contextWindow: 128000,
    privacy: "100% offline",
    recommendedFor: ["Everyday tasks", "Edge devices"],
    hardwareTier: "mid"
  },
  "gemma3-4b": {
    category: "compact",
    parameters: 4,
    vramRequired: "4GB VRAM",
    speed: "fast",
    quality: "good",
    contextWindow: 128000,
    privacy: "100% offline",
    recommendedFor: ["Mobile devices", "Quick tasks"],
    hardwareTier: "low"
  },
  "gemma2-27b": {
    category: "general",
    parameters: 27,
    vramRequired: "18GB VRAM",
    speed: "medium",
    quality: "good",
    contextWindow: 128000,
    privacy: "100% offline",
    recommendedFor: ["General tasks", "Professional work"],
    hardwareTier: "high"
  },
  "gemma2-9b": {
    category: "general",
    parameters: 9,
    vramRequired: "8GB VRAM",
    speed: "fast",
    quality: "good",
    contextWindow: 128000,
    privacy: "100% offline",
    recommendedFor: ["Everyday tasks", "Edge devices"],
    hardwareTier: "mid"
  },

  // Other Models
  "neural-chat-7b-v3-1": {
    category: "general",
    parameters: 7,
    vramRequired: "6GB VRAM",
    speed: "fast",
    quality: "good",
    contextWindow: 16000,
    privacy: "100% offline",
    recommendedFor: ["Chat", "Conversational AI"],
    hardwareTier: "low"
  },
  "openchat-3.5": {
    category: "general",
    parameters: 7,
    vramRequired: "6GB VRAM",
    speed: "fast",
    quality: "good",
    contextWindow: 8000,
    privacy: "100% offline",
    recommendedFor: ["Chat", "Conversational AI"],
    hardwareTier: "low"
  },
  "openthinker": {
    category: "reasoning",
    parameters: 7,
    vramRequired: "6GB VRAM",
    speed: "fast",
    quality: "good",
    contextWindow: 32000,
    privacy: "100% offline",
    recommendedFor: ["Reasoning tasks", "Problem solving"],
    hardwareTier: "low"
  },
  "qwq": {
    category: "reasoning",
    parameters: 32,
    vramRequired: "20GB VRAM",
    speed: "medium",
    quality: "excellent",
    contextWindow: 32000,
    privacy: "100% offline",
    recommendedFor: ["Advanced reasoning", "Complex problems"],
    hardwareTier: "high"
  }
}

// Helper function to get model metadata
export const getLocalModelMetadata = (model: LocalModel): LocalModelMetadata => {
  return LOCAL_MODELS_METADATA[model]
}

// Helper function to get models by category
export const getModelsByCategory = (category: LocalModelCategory): LocalModel[] => {
  return Object.entries(LOCAL_MODELS_METADATA)
    .filter(([_, metadata]) => metadata.category === category)
    .map(([model]) => model as LocalModel)
}

// Helper function to get models by hardware tier
export const getModelsByHardwareTier = (tier: "low" | "mid" | "high" | "ultra"): LocalModel[] => {
  return Object.entries(LOCAL_MODELS_METADATA)
    .filter(([_, metadata]) => metadata.hardwareTier === tier)
    .map(([model]) => model as LocalModel)
}

// Helper function to get recommended models for use case
export const getRecommendedModels = (useCase: string): LocalModel[] => {
  return Object.entries(LOCAL_MODELS_METADATA)
    .filter(([_, metadata]) => 
      metadata.recommendedFor.some(rec => 
        rec.toLowerCase().includes(useCase.toLowerCase())
      )
    )
    .map(([model]) => model as LocalModel)
}
