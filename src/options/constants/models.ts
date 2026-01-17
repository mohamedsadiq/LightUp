import type { GeminiModel, GrokModel, LocalModel } from "~types/settings"
import { getMessage } from "~utils/i18n"

export const GEMINI_MODELS: {
  value: GeminiModel
  label: string
  description: string
}[] = [
  {
    value: "gemini-3-pro",
    label: "Gemini 3 Pro",
    description: "Best multimodal understanding, agentic coding"
  },
  {
    value: "gemini-3-flash",
    label: "Gemini 3 Flash",
    description: "Fast multimodal model with frontier intelligence"
  },
  {
    value: "gemini-3-pro-preview",
    label: "Gemini 3 Pro (Preview)",
    description: "Preview model with enhanced reasoning"
  },
  {
    value: "gemini-3-flash-preview",
    label: "Gemini 3 Flash (Preview)",
    description: "Preview flash model with frontier performance"
  },
  {
    value: "gemini-3-pro-image-preview",
    label: "Gemini 3 Pro Image (Preview)",
    description: "Preview multimodal model with vision"
  },
  {
    value: "gemini-2.5-pro",
    label: "Gemini 2.5 Pro",
    description: "State-of-the-art thinking, long context"
  },
  {
    value: "gemini-2.5-flash",
    label: "Gemini 2.5 Flash",
    description: "Best price-performance, 1M context"
  },
  {
    value: "gemini-2.5-flash-lite",
    label: "Gemini 2.5 Flash Lite",
    description: "Most balanced, optimized for low latency"
  },
  {
    value: "gemini-2.0-flash",
    label: "Gemini 2.0 Flash",
    description: "Stable default with 1M context window (retiring Mar 2026)"
  },
  {
    value: "gemini-2.0-flash-lite",
    label: "Gemini 2.0 Flash Lite",
    description: "Previous-gen lite fallback (retiring Mar 2026)"
  }
]

export const GROK_MODELS: {
  value: GrokModel
  label: string
  description: string
  price: string
}[] = [
  {
    value: "grok-4-1-fast",
    label: "Grok 4.1 Fast",
    description:
      "Newest fast model (Nov 2025), 2M context, reasoning can be enabled/disabled",
    price: "Premium"
  },
  {
    value: "grok-4",
    label: "Grok 4",
    description: "Flagship Grok 4 (256K context)",
    price: "Premium"
  },
  {
    value: "grok-4-fast",
    label: "Grok 4 Fast",
    description: "Unified architecture with reasoning/non-reasoning modes",
    price: "Standard"
  },
  {
    value: "grok-3",
    label: "Grok 3",
    description: "Legacy Grok 3 (131K context)",
    price: "Legacy"
  },
  {
    value: "grok-2",
    label: "Grok 2",
    description: "Previous generation Grok 2",
    price: "Legacy"
  },
  {
    value: "grok-2-vision-1212",
    label: "Grok 2 Vision",
    description: "Vision model with image support (32K context)",
    price: "Per image"
  },
  {
    value: "grok-code-fast-1",
    label: "Grok Code Fast 1",
    description: "Code-focused fast model",
    price: "Standard"
  },
  {
    value: "grok-beta",
    label: "Grok Beta",
    description: "Beta access model (legacy)",
    price: "Beta"
  },
  {
    value: "grok-vision-beta",
    label: "Grok Vision Beta",
    description: "Vision Beta model (8K context)",
    price: "Beta"
  }
]

export const LOCAL_MODELS: {
  value: LocalModel
  label: string
  description: string
  size: string
}[] = [
  {
    value: "llama-2-70b-chat",
    label: getMessage("llama270bLabel"),
    description: getMessage("llama270bDesc"),
    size: getMessage("llama270bSize")
  },
  {
    value: "deepseek-v3",
    label: getMessage("deepseekV3Label"),
    description: getMessage("deepseekV3Desc"),
    size: getMessage("deepseekV3Size")
  },
  {
    value: "mixtral-8x7b-instruct",
    label: getMessage("mixtral8x7bLabel"),
    description: getMessage("mixtral8x7bDesc"),
    size: getMessage("mixtral8x7bSize")
  },
  {
    value: "llama-2-13b-chat",
    label: getMessage("llama213bLabel"),
    description: getMessage("llama213bDesc"),
    size: getMessage("llama213bSize")
  },
  {
    value: "mistral-7b-instruct-v0.3",
    label: getMessage("mistral7bLabel"),
    description: getMessage("mistral7bDesc"),
    size: getMessage("mistral7bSize")
  },
  {
    value: "neural-chat-7b-v3-1",
    label: getMessage("neuralChatV31Label"),
    description: getMessage("neuralChatV31Desc"),
    size: getMessage("neuralChatV31Size")
  },
  {
    value: "deepseek-v3-base",
    label: getMessage("deepseekV3BaseLabel"),
    description: getMessage("deepseekV3BaseDesc"),
    size: getMessage("deepseekV3BaseSize")
  },
  {
    value: "llama-3.2-3b-instruct",
    label: getMessage("llama32_3bLabel"),
    description: getMessage("llama32_3bDesc"),
    size: getMessage("llama32_3bSize")
  },
  {
    value: "phi-3-mini-4k",
    label: "Phi-3 Mini 4K",
    description: "Microsoft's lightweight model",
    size: "Tiny"
  },
  {
    value: "openchat-3.5",
    label: getMessage("openchat35Label"),
    description: getMessage("openchat35Desc"),
    size: getMessage("openchat35Size")
  }
]
