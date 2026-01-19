import React, { type ReactNode } from "react"

import type { Settings, ModelType } from "~types/settings"
import {
  GeminiIcon,
  GrokIcon,
  OpenAIIcon,
  LocalIcon
} from "~components/icons"

import logoUrl from "../../../assets/icon.png"

export type OnboardingProviderOption = {
  id: ModelType
  title: string
  subtitle: string
  body: string
  badge?: string
  icon: ReactNode
}

export const ONBOARDING_TOTAL_STEPS = 4

export const getOnboardingProviderOptions = (
  theme: "light" | "dark"
): OnboardingProviderOption[] => [
  {
    id: "basic",
    title: "LightUp Basic",
    subtitle: "Fast Grok proxy • Free",
    body: "No API key needed. Includes tuned prompts and basic quota. Perfect to get started.",
    badge: "Free",
    icon: React.createElement("img", {
      src: logoUrl,
      alt: "LightUp",
      style: { width: "36px", height: "36px" }
    })
  },
  {
    id: "gemini",
    title: "Google Gemini",
    subtitle: "Long context + multimedia",
    body: "Use your Gemini key for long context and multimodal support.",
    icon: React.createElement(GeminiIcon)
  },
  {
    id: "grok",
    title: "xAI Grok",
    subtitle: "Web-native reasoning",
    body: "Use Grok reasoning with your xAI key for fast, web-native replies.",
    icon: React.createElement(GrokIcon)
  },
  {
    id: "openai",
    title: "OpenAI",
    subtitle: "Best overall quality",
    body: "Add your OpenAI key for GPT-4o, GPT-4.1, and reasoning models.",
    icon: React.createElement(OpenAIIcon, { theme, alt: "OpenAI" })
  },
  {
    id: "local",
    title: "Custom / Local",
    subtitle: "Self-host anything",
    body: "Point to your self-hosted or remote model server for full control.",
    icon: React.createElement(LocalIcon)
  }
]

export const ONBOARDING_STEP_COPY = [
  {
    title: "Choose your language & look",
    description: "Pick your language and theme so LightUp feels at home."
  },
  {
    title: "Choose your AI",
    description: "Select the provider to power your answers."
  },
  {
    title: "Essential controls",
    description: "Customize how LightUp appears and interacts with web pages."
  },
  {
    title: "Review & finish",
    description: "Confirm settings and start using LightUp."
  }
] as const

export const ONBOARDING_TOGGLES: {
  key: keyof Settings["customization"]
  label: string
  description: string
}[] = [
  {
    key: "showTextSelectionButton",
    label: "Selection bubble",
    description: "Show floating action button when you highlight text."
  },
  {
    key: "automaticActivation",
    label: "Auto-open LightUp",
    description: "Automatically open when you select text on any page."
  },
  {
    key: "contextAwareness",
    label: "Smart context",
    description: "Use page content to give more relevant answers."
  }
]
