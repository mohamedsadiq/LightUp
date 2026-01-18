// Animation imports removed
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { Storage } from "@plasmohq/storage"

import ErrorMessage from "~components/common/ErrorMessage"
import LanguageSelector from "~components/LanguageSelector"
import { useStandaloneNotification } from "~components/notifications/Notification"
import OnboardingWizard from "~components/onboarding/OnboardingWizard"
import {
  AutoSaveStatus,
  EnhancedSaveButton,
  LoadingSpinner,
  UnsavedChangesIndicator
} from "~components/options/NotificationComponents"
import SavedSuccessIndicator from "~components/SavedSuccessIndicator"
import { useLocale } from "~hooks/useLocale"
import { useRateLimit } from "~hooks/useRateLimit"
import {
  apiKeyValidator,
  type ApiKeyValidationResult
} from "~services/validation/ApiKeyValidator"
import type {
  GeminiModel,
  GrokModel,
  LocalModel,
  Mode,
  ModelType,
  OpenAIModel,
  Settings,
  LocalModelMetadata
} from "~types/settings"
import { getMessage, SUPPORTED_LANGUAGES } from "~utils/i18n"
import { LOCAL_MODELS_METADATA } from "~config/localModels"

import "~utils/themePreload"
import { rememberTheme } from "~utils/themePreload"
import { SYSTEM_PROMPTS, USER_PROMPTS } from "../utils/constants"
// Note: SavedSuccessIndicator is now imported from components

// Import the options-specific CSS file for fonts only
import "./options-style.css"

// 2. Add useLocaleStore import after existing imports
import { useLocaleStore } from "~hooks/useLocaleStore"

import logoUrl from "../../assets/icon.png"

import {
  getOnboardingProviderOptions,
  ONBOARDING_STEP_COPY,
  ONBOARDING_TOGGLES,
  ONBOARDING_TOTAL_STEPS
} from "./constants/onboarding"
import { GEMINI_MODELS, GROK_MODELS, LOCAL_MODELS } from "./constants/models"
import { theme } from "./styles/theme"
import {
  ActionButton,
  ApiKeyInput,
  BadgeContainer,
  BetaBadge,
  Button,
  CardContainer,
  CardHeader,
  CardIcon,
  CardTitle,
  CloseButton,
  ColorButton,
  ContentArea,
  ContentWrapper,
  Description,
  FontSizeButton,
  FormDescription,
  FormGroup,
  FormInput,
  FormLabel,
  FormRow,
  FormTextarea,
  Header,
  HeaderLogoWrapper,
  HeaderTitle,
  Label,
  LayoutButton,
  LogoImage,
  ModelCheckBadge,
  ModelContentContainer,
  ModelDescription,
  ModelMetadata,
  ModelOptionCard,
  ModelTitle,
  OptionsContainer,
  ProviderBody,
  ProviderCard,
  ProviderCheckBadge,
  ProviderContent,
  ProviderGrid,
  ProviderIconWrapper,
  ProviderSubtitle,
  ProviderTitle,
  SaveButton,
  SearchInput,
  Section,
  SectionContainer,
  SectionDivider,
  SectionHeader,
  SectionTitle,
  Sidebar,
  SidebarDivider,
  SidebarIcon,
  SidebarItem,
  StyledPromptDisplay,
  SubContainer,
  ThemeButton,
  ThemeIcon,
  ValidationIcon,
  ValidationStatus,
  VersionBadgeContainer,
  VersionNumber
} from "./styles/styled"

// Import Radix UI components
import { Toggle } from "~components/ui/radix/Switch"
import { Divider } from "~components/ui/radix/Separator"
import { SelectDropdown } from "~components/ui/radix/Select"
import { RadioGroupComponent } from "~components/ui/radix/RadioGroup"

// Reusable component for required field labels
const RequiredLabel = () => (
  <span
    style={{
      color: theme.destructive,
      fontSize: "12px",
      marginLeft: "8px"
    }}>
    {getMessage("requiredFieldLabel")}
  </span>
)

const copyToClipboard = (text) => {
  navigator.clipboard.writeText(text).then(
    () => {
      alert(getMessage("addressCopiedToClipboard"))
    },
    (err) => {
      console.error("Could not copy text: ", err)
    }
  )
}

// Animation variants removed

const RateLimitDisplay = ({ rateLimitRemaining, rateLimitReset }) => {
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  }

  return (
    <div className="lu-flex lu-items-center lu-justify-between lu-text-xs lu-text-gray-500 lu-mt-2">
      <span>
        {getMessage("rateLimitRemaining")} {rateLimitRemaining}
      </span>
      <span>
        {getMessage("resetIn")} {formatTime(rateLimitReset)}
      </span>
    </div>
  )
}

// SettingsCard component using styled components
const SettingsCard = ({
  id = undefined,
  title,
  icon,
  children,
  className = ""
}) => (
  <CardContainer id={id} className={className}>
    <CardHeader>
      {icon && <CardIcon>{icon}</CardIcon>}
      <CardTitle>{title}</CardTitle>
    </CardHeader>
    {children}
  </CardContainer>
)

const Badge = ({ children, variant = "default", className = "" }) => {
  return (
    <BadgeContainer variant={variant} className={className}>
      {children}
    </BadgeContainer>
  )
}

// ModelOption component using styled components
const ModelOption = ({
  model,
  selected,
  onChange,
  showPrice = false,
  showSize = false
}) => (
  <ModelOptionCard
    selected={selected}
    onClick={onChange}
    type="button"
  >
    {selected && (
      <ModelCheckBadge aria-label="Selected model">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg">
          <path
            d="M20 6L9 17L4 12"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </ModelCheckBadge>
    )}
    <ModelContentContainer>
      <ModelTitle selected={selected}>{model.label}</ModelTitle>
      <ModelDescription>{model.description}</ModelDescription>
      {showPrice && model.price && (
        <ModelMetadata>
          {getMessage("price")} {model.price}
        </ModelMetadata>
      )}
      {showSize && model.size && (
        <ModelMetadata>
          {getMessage("size")} {model.size}
        </ModelMetadata>
      )}
    </ModelContentContainer>
  </ModelOptionCard>
)

const Logo = () => (
  <HeaderLogoWrapper>
    <LogoImage src={logoUrl} alt="LightUp Logo" />
    <HeaderTitle>LightUp</HeaderTitle>
  </HeaderLogoWrapper>
)

// Auto-save hook with debouncing
const useAutoSave = (
  settings: Settings,
  storage: Storage,
  notifyError: (message: string) => void
) => {
  const [autoSaveStatus, setAutoSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle")
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastSavedRef = useRef<string>("")

  const autoSave = async (
    immediateSettings?: Settings,
    updateInitialSettings?: (settings: Settings) => void
  ) => {
    const settingsToSave = immediateSettings || settings
    const settingsString = JSON.stringify(settingsToSave)

    // Skip if settings haven't changed
    if (settingsString === lastSavedRef.current) {
      return
    }

    try {
      setAutoSaveStatus("saving")
      await storage.set("settings", settingsToSave)
      lastSavedRef.current = settingsString
      setAutoSaveStatus("saved")

      // Update initial settings to mark as saved (this fixes the unsaved changes conflict)
      if (updateInitialSettings) {
        updateInitialSettings(settingsToSave)
      }

      // Notify all tabs about the settings change
      if (typeof chrome !== "undefined" && chrome.tabs) {
        chrome.tabs.query({}, (tabs) => {
          tabs.forEach((tab) => {
            if (tab.id) {
              chrome.tabs
                .sendMessage(tab.id, {
                  type: "SETTINGS_UPDATED",
                  settings: settingsToSave
                })
                .catch(() => {
                  // Ignore errors for tabs without content script
                })
            }
          })
        })
      }

      setTimeout(() => {
        setAutoSaveStatus("idle")
      }, 2000)
    } catch (error) {
      console.error("Auto-save failed:", error)
      setAutoSaveStatus("error")
      notifyError(getMessage("autoSaveFailedTitle"))
    }
  }

  const debouncedAutoSave = (
    immediateSettings?: Settings,
    updateInitialSettings?: (settings: Settings) => void
  ) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      autoSave(immediateSettings, updateInitialSettings)
    }, 10000) // Auto-save after 10 seconds of inactivity
  }

  return { autoSaveStatus, debouncedAutoSave, autoSave, timeoutRef }
}

function IndexOptions() {
  const storage = useRef(new Storage()).current
  const { locale, changeLocale } = useLocale()
  // Subscribe to messages to re-render when translations load/change
  const messages = useLocaleStore((state) => state.messages)

  // Localized model option definitions – rebuilt whenever locale/messages change
  const GEMINI_MODELS: {
    value: GeminiModel
    label: string
    description: string
  }[] = useMemo(
    () => [
      {
        value: "gemini-2.0-flash" as GeminiModel,
        label: "Gemini 2.0 Flash",
        description: "Stable default with 1M context window"
      },
      {
        value: "gemini-2.5-flash" as GeminiModel,
        label: "Gemini 2.5 Flash",
        description: "Latest price-performance balance (stable)"
      },
      {
        value: "gemini-2.5-flash-lite" as GeminiModel,
        label: "Gemini 2.5 Flash Lite",
        description: "Cost-efficient 2.5 flash-lite tier"
      },
      {
        value: "gemini-2.5-pro" as GeminiModel,
        label: "Gemini 2.5 Pro",
        description: "Advanced reasoning with long context"
      },
      {
        value: "gemini-3-pro-preview" as GeminiModel,
        label: "Gemini 3 Pro (Preview)",
        description: "Preview access – subject to change"
      },
      {
        value: "gemini-2.0-flash-lite" as GeminiModel,
        label: "Gemini 2.0 Flash Lite",
        description: "Previous-gen lite fallback"
      }
    ],
    [locale, messages]
  )

  const GROK_MODELS = useMemo(
    () => [
      {
        value: "grok-4-1-fast" as GrokModel,
        label: "Grok 4.1 Fast",
        description: "Newest fast model (Nov 2025), 2M context, reasoning can be enabled/disabled",
        price: "Premium"
      },
      {
        value: "grok-4" as GrokModel,
        label: "Grok 4",
        description: "Flagship Grok 4 (256K context)",
        price: "Premium"
      },
      {
        value: "grok-4-fast" as GrokModel,
        label: "Grok 4 Fast",
        description: "Unified architecture with reasoning/non-reasoning modes",
        price: "Standard"
      },
      {
        value: "grok-3" as GrokModel,
        label: "Grok 3",
        description: "Legacy Grok 3 (131K context)",
        price: "Legacy"
      },
      {
        value: "grok-2" as GrokModel,
        label: "Grok 2",
        description: "Previous generation Grok 2",
        price: "Legacy"
      },
      {
        value: "grok-2-vision-1212" as GrokModel,
        label: "Grok 2 Vision",
        description: "Vision model with image support (32K context)",
        price: "Per image"
      },
      {
        value: "grok-code-fast-1" as GrokModel,
        label: "Grok Code Fast 1",
        description: "Code-focused fast model",
        price: "Standard"
      },
      {
        value: "grok-beta" as GrokModel,
        label: "Grok Beta",
        description: "Beta access model (legacy)",
        price: "Beta"
      },
      {
        value: "grok-vision-beta" as GrokModel,
        label: "Grok Vision Beta",
        description: "Vision Beta model (8K context)",
        price: "Beta"
      }
    ],
    [locale, messages]
  )

  // OpenAI model options
  const OPENAI_MODELS: {
    value: OpenAIModel
    label: string
    description: string
  }[] = useMemo(
    () => [
      {
        value: "gpt-5.2" as OpenAIModel,
        label: "GPT-5.2",
        description: "Most advanced frontier model for professional work"
      },
      {
        value: "gpt-5.2-pro" as OpenAIModel,
        label: "GPT-5.2 Pro",
        description: "GPT-5.2 with reasoning effort support (medium, high, xhigh)"
      },
      {
        value: "gpt-5.1" as OpenAIModel,
        label: "GPT-5.1",
        description: "Advanced GPT-5.1 model"
      },
      {
        value: "gpt-5" as OpenAIModel,
        label: "GPT-5",
        description: "Latest flagship model"
      },
      {
        value: "gpt-5-mini" as OpenAIModel,
        label: "GPT-5 Mini",
        description: "Compact GPT-5 variant"
      },
      {
        value: "gpt-5-nano" as OpenAIModel,
        label: "GPT-5 Nano",
        description: "Ultra-lightweight GPT-5"
      },
      {
        value: "gpt-4o" as OpenAIModel,
        label: "GPT-4o",
        description: "Flagship multimodal model, best overall"
      },
      {
        value: "gpt-4.1" as OpenAIModel,
        label: "GPT-4.1",
        description: "Smartest non-reasoning model with 1M context"
      },
      {
        value: "gpt-4.1-mini" as OpenAIModel,
        label: "GPT-4.1 Mini",
        description: "Smaller, faster version of GPT-4.1"
      },
      {
        value: "gpt-4.1-nano" as OpenAIModel,
        label: "GPT-4.1 Nano",
        description: "Fastest, most cost-efficient version of GPT-4.1"
      },
      {
        value: "gpt-4o-mini" as OpenAIModel,
        label: "GPT-4o Mini",
        description: "Fast and cost-efficient"
      },
      {
        value: "o4-mini" as OpenAIModel,
        label: "o4 Mini",
        description: "Efficient reasoning model"
      },
      {
        value: "o3" as OpenAIModel,
        label: "o3",
        description: "Advanced reasoning model"
      },
      {
        value: "o3-mini" as OpenAIModel,
        label: "o3 Mini",
        description: "Compact reasoning model"
      },
      {
        value: "o1" as OpenAIModel,
        label: "o1",
        description: "Deep reasoning for complex problems"
      }
    ],
    [locale, messages]
  )

  const LOCAL_MODELS = useMemo(
    () => [
      {
        value: "llama-4-70b" as LocalModel,
        label: "Llama 4 70B",
        description: "Meta's latest open-source model - Excellent for complex tasks",
        size: "Extra Large",
        category: "general",
        privacy: "100% offline",
        vram: "40GB+ VRAM",
        speed: "slow",
        quality: "excellent"
      },
      {
        value: "llama-4-40b" as LocalModel,
        label: "Llama 4 40B",
        description: "Meta's latest open-source model - Professional grade",
        size: "Large",
        category: "general",
        privacy: "100% offline",
        vram: "24GB+ VRAM",
        speed: "medium",
        quality: "excellent"
      },
      {
        value: "llama-3.3-70b" as LocalModel,
        label: "Llama 3.3 70B",
        description: "Improved reasoning with 128K context window",
        size: "Large",
        category: "general",
        privacy: "100% offline",
        vram: "40GB+ VRAM",
        speed: "slow",
        quality: "excellent"
      },
      {
        value: "llama-3.3-8b" as LocalModel,
        label: "Llama 3.3 8B",
        description: "Efficient model for edge devices with 128K context",
        size: "Small",
        category: "general",
        privacy: "100% offline",
        vram: "8GB VRAM",
        speed: "fast",
        quality: "good"
      },
      {
        value: "llama-3.1-405b" as LocalModel,
        label: "Llama 3.1 405B",
        description: "Largest open-source model - Enterprise grade",
        size: "Extra Large",
        category: "general",
        privacy: "100% offline",
        vram: "200GB+ VRAM",
        speed: "slow",
        quality: "excellent"
      },
      {
        value: "llama-3.1-70b" as LocalModel,
        label: "Llama 3.1 70B",
        description: "High-performance model with 128K context",
        size: "Large",
        category: "general",
        privacy: "100% offline",
        vram: "40GB+ VRAM",
        speed: "slow",
        quality: "excellent"
      },
      {
        value: "llama-3.1-8b" as LocalModel,
        label: "Llama 3.1 8B",
        description: "Balanced performance and efficiency with 128K context",
        size: "Small",
        category: "general",
        privacy: "100% offline",
        vram: "8GB VRAM",
        speed: "fast",
        quality: "good"
      },
      {
        value: "llama-3.2-3b-instruct" as LocalModel,
        label: "Llama 3.2 3B",
        description: "Small model optimized for mobile/edge devices",
        size: "Tiny",
        category: "compact",
        privacy: "100% offline",
        vram: "4GB VRAM",
        speed: "fast",
        quality: "good"
      },
      {
        value: "llama-3.2-1b" as LocalModel,
        label: "Llama 3.2 1B",
        description: "Ultra-lightweight for resource-constrained devices",
        size: "Tiny",
        category: "compact",
        privacy: "100% offline",
        vram: "2GB VRAM",
        speed: "fast",
        quality: "fair"
      },
      {
        value: "llama-2-70b-chat" as LocalModel,
        label: "Llama 2 70B",
        description: "Legacy Llama 2 model - For compatibility",
        size: "Large",
        category: "general",
        privacy: "100% offline",
        vram: "40GB+ VRAM",
        speed: "slow",
        quality: "good"
      },
      {
        value: "llama-2-13b-chat" as LocalModel,
        label: "Llama 2 13B",
        description: "Legacy Llama 2 model - For compatibility",
        size: "Medium",
        category: "general",
        privacy: "100% offline",
        vram: "10GB VRAM",
        speed: "medium",
        quality: "good"
      },
      {
        value: "deepseek-r1" as LocalModel,
        label: "DeepSeek R1",
        description: "Top reasoning model of 2025 - Complex problem solving",
        size: "Extra Large",
        category: "reasoning",
        privacy: "100% offline",
        vram: "400GB+ VRAM",
        speed: "slow",
        quality: "excellent"
      },
      {
        value: "deepseek-r1-distill-llama-70b" as LocalModel,
        label: "DeepSeek R1 Distill Llama 70B",
        description: "Distilled reasoning model based on Llama",
        size: "Large",
        category: "reasoning",
        privacy: "100% offline",
        vram: "40GB+ VRAM",
        speed: "slow",
        quality: "excellent"
      },
      {
        value: "deepseek-r1-distill-llama-8b" as LocalModel,
        label: "DeepSeek R1 Distill Llama 8B",
        description: "Efficient distilled reasoning model",
        size: "Small",
        category: "reasoning",
        privacy: "100% offline",
        vram: "8GB VRAM",
        speed: "fast",
        quality: "good"
      },
      {
        value: "deepseek-r1-distill-qwen-32b" as LocalModel,
        label: "DeepSeek R1 Distill Qwen 32B",
        description: "Distilled reasoning model based on Qwen",
        size: "Medium",
        category: "reasoning",
        privacy: "100% offline",
        vram: "20GB VRAM",
        speed: "medium",
        quality: "excellent"
      },
      {
        value: "deepseek-r1-distill-qwen-14b" as LocalModel,
        label: "DeepSeek R1 Distill Qwen 14B",
        description: "Balanced distilled reasoning model",
        size: "Medium",
        category: "reasoning",
        privacy: "100% offline",
        vram: "10GB VRAM",
        speed: "medium",
        quality: "good"
      },
      {
        value: "deepseek-r1-distill-qwen-7b" as LocalModel,
        label: "DeepSeek R1 Distill Qwen 7B",
        description: "Efficient distilled reasoning model",
        size: "Small",
        category: "reasoning",
        privacy: "100% offline",
        vram: "6GB VRAM",
        speed: "fast",
        quality: "good"
      },
      {
        value: "deepseek-r1-distill-qwen-1.5b" as LocalModel,
        label: "DeepSeek R1 Distill Qwen 1.5B",
        description: "Lightweight distilled reasoning model",
        size: "Tiny",
        category: "reasoning",
        privacy: "100% offline",
        vram: "2GB VRAM",
        speed: "fast",
        quality: "fair"
      },
      {
        value: "deepseek-v3.1" as LocalModel,
        label: "DeepSeek V3.1",
        description: "Latest DeepSeek model with enhanced reasoning (128K context)",
        size: "Extra Large",
        category: "general",
        privacy: "100% offline",
        vram: "400GB+ VRAM",
        speed: "slow",
        quality: "excellent"
      },
      {
        value: "deepseek-v3" as LocalModel,
        label: "DeepSeek V3",
        description: "General-purpose DeepSeek model (128K context)",
        size: "Extra Large",
        category: "general",
        privacy: "100% offline",
        vram: "400GB+ VRAM",
        speed: "slow",
        quality: "excellent"
      },
      {
        value: "deepseek-v3-base" as LocalModel,
        label: "DeepSeek V3 Base",
        description: "Base DeepSeek V3 model for fine-tuning",
        size: "Extra Large",
        category: "general",
        privacy: "100% offline",
        vram: "400GB+ VRAM",
        speed: "slow",
        quality: "excellent"
      },
      {
        value: "deepseek-coder-v2" as LocalModel,
        label: "DeepSeek Coder V2",
        description: "Code-focused DeepSeek model (87 languages)",
        size: "Medium",
        category: "coding",
        privacy: "100% offline",
        vram: "12GB VRAM",
        speed: "medium",
        quality: "excellent"
      },
      {
        value: "deepseek-coder-33b" as LocalModel,
        label: "DeepSeek Coder 33B",
        description: "Code generation model (33B parameters)",
        size: "Medium",
        category: "coding",
        privacy: "100% offline",
        vram: "20GB VRAM",
        speed: "medium",
        quality: "excellent"
      },
      {
        value: "deepseek-coder-6.7b" as LocalModel,
        label: "DeepSeek Coder 6.7B",
        description: "Efficient code generation model",
        size: "Small",
        category: "coding",
        privacy: "100% offline",
        vram: "6GB VRAM",
        speed: "fast",
        quality: "good"
      },
      {
        value: "qwen3-32b" as LocalModel,
        label: "Qwen 3 32B",
        description: "Alibaba's latest Qwen 3 model",
        size: "Medium",
        category: "general",
        privacy: "100% offline",
        vram: "20GB VRAM",
        speed: "medium",
        quality: "excellent"
      },
      {
        value: "qwen3-14b" as LocalModel,
        label: "Qwen 3 14B",
        description: "Alibaba's Qwen 3 model",
        size: "Medium",
        category: "general",
        privacy: "100% offline",
        vram: "10GB VRAM",
        speed: "fast",
        quality: "good"
      },
      {
        value: "qwen3-coder" as LocalModel,
        label: "Qwen 3 Coder",
        description: "Code-focused Qwen 3 model",
        size: "Medium",
        category: "coding",
        privacy: "100% offline",
        vram: "10GB VRAM",
        speed: "fast",
        quality: "excellent"
      },
      {
        value: "qwen2.5-72b" as LocalModel,
        label: "Qwen 2.5 72B",
        description: "High-performance Qwen 2.5 model",
        size: "Large",
        category: "general",
        privacy: "100% offline",
        vram: "40GB+ VRAM",
        speed: "slow",
        quality: "excellent"
      },
      {
        value: "qwen2.5-32b" as LocalModel,
        label: "Qwen 2.5 32B",
        description: "Balanced Qwen 2.5 model",
        size: "Medium",
        category: "general",
        privacy: "100% offline",
        vram: "20GB VRAM",
        speed: "medium",
        quality: "excellent"
      },
      {
        value: "qwen2.5-14b" as LocalModel,
        label: "Qwen 2.5 14B",
        description: "Efficient Qwen 2.5 model",
        size: "Medium",
        category: "general",
        privacy: "100% offline",
        vram: "10GB VRAM",
        speed: "fast",
        quality: "good"
      },
      {
        value: "qwen2.5-7b" as LocalModel,
        label: "Qwen 2.5 7B",
        description: "Compact Qwen 2.5 model",
        size: "Small",
        category: "general",
        privacy: "100% offline",
        vram: "6GB VRAM",
        speed: "fast",
        quality: "good"
      },
      {
        value: "qwen2.5-3b" as LocalModel,
        label: "Qwen 2.5 3B",
        description: "Lightweight Qwen 2.5 model",
        size: "Tiny",
        category: "compact",
        privacy: "100% offline",
        vram: "4GB VRAM",
        speed: "fast",
        quality: "good"
      },
      {
        value: "qwen2.5-coder-32b" as LocalModel,
        label: "Qwen 2.5 Coder 32B",
        description: "Code-focused Qwen model",
        size: "Medium",
        category: "coding",
        privacy: "100% offline",
        vram: "20GB VRAM",
        speed: "medium",
        quality: "excellent"
      },
      {
        value: "qwen2.5-coder-7b" as LocalModel,
        label: "Qwen 2.5 Coder 7B",
        description: "Efficient code generation model",
        size: "Small",
        category: "coding",
        privacy: "100% offline",
        vram: "6GB VRAM",
        speed: "fast",
        quality: "good"
      },
      {
        value: "qwen2.5-math-72b" as LocalModel,
        label: "Qwen 2.5 Math 72B",
        description: "Mathematics-focused model",
        size: "Large",
        category: "reasoning",
        privacy: "100% offline",
        vram: "40GB+ VRAM",
        speed: "slow",
        quality: "excellent"
      },
      {
        value: "qwen2.5-math-7b" as LocalModel,
        label: "Qwen 2.5 Math 7B",
        description: "Efficient mathematics model",
        size: "Small",
        category: "reasoning",
        privacy: "100% offline",
        vram: "6GB VRAM",
        speed: "fast",
        quality: "good"
      },
      {
        value: "mistral-large-3" as LocalModel,
        label: "Mistral Large 3",
        description: "Mistral's latest flagship model",
        size: "Extra Large",
        category: "general",
        privacy: "100% offline",
        vram: "70GB+ VRAM",
        speed: "slow",
        quality: "excellent"
      },
      {
        value: "mixtral-8x22b" as LocalModel,
        label: "Mixtral 8x22B",
        description: "MoE model with 8 experts",
        size: "Extra Large",
        category: "general",
        privacy: "100% offline",
        vram: "80GB+ VRAM",
        speed: "slow",
        quality: "excellent"
      },
      {
        value: "mixtral-8x7b-instruct" as LocalModel,
        label: "Mixtral 8x7B",
        description: "MoE model with 8 experts",
        size: "Large",
        category: "general",
        privacy: "100% offline",
        vram: "30GB VRAM",
        speed: "medium",
        quality: "excellent"
      },
      {
        value: "mistral-7b-instruct-v0.3" as LocalModel,
        label: "Mistral 7B v0.3",
        description: "Updated Mistral 7B model",
        size: "Small",
        category: "general",
        privacy: "100% offline",
        vram: "6GB VRAM",
        speed: "fast",
        quality: "good"
      },
      {
        value: "codestral-22b" as LocalModel,
        label: "Codestral 22B",
        description: "Code-focused Mistral model",
        size: "Medium",
        category: "coding",
        privacy: "100% offline",
        vram: "14GB VRAM",
        speed: "medium",
        quality: "excellent"
      },
      {
        value: "phi-3-mini-4k" as LocalModel,
        label: "Phi-3 Mini 4K",
        description: "Microsoft's lightweight model (4K context)",
        size: "Tiny",
        category: "compact",
        privacy: "100% offline",
        vram: "4GB VRAM",
        speed: "fast",
        quality: "good"
      },
      {
        value: "phi-3-mini-128k" as LocalModel,
        label: "Phi-3 Mini 128K",
        description: "Microsoft's lightweight model (128K context)",
        size: "Tiny",
        category: "compact",
        privacy: "100% offline",
        vram: "4GB VRAM",
        speed: "fast",
        quality: "good"
      },
      {
        value: "phi-3-medium-128k" as LocalModel,
        label: "Phi-3 Medium 128K",
        description: "Microsoft's medium model with long context",
        size: "Medium",
        category: "general",
        privacy: "100% offline",
        vram: "10GB VRAM",
        speed: "medium",
        quality: "good"
      },
      {
        value: "phi-4" as LocalModel,
        label: "Phi-4",
        description: "Microsoft's latest Phi model",
        size: "Medium",
        category: "general",
        privacy: "100% offline",
        vram: "10GB VRAM",
        speed: "medium",
        quality: "excellent"
      },
      {
        value: "phi-4-mini" as LocalModel,
        label: "Phi-4 Mini",
        description: "Microsoft's compact Phi-4 model",
        size: "Tiny",
        category: "compact",
        privacy: "100% offline",
        vram: "4GB VRAM",
        speed: "fast",
        quality: "good"
      },
      {
        value: "phi-4-reasoning" as LocalModel,
        label: "Phi-4 Reasoning",
        description: "Phi-4 with enhanced reasoning",
        size: "Medium",
        category: "reasoning",
        privacy: "100% offline",
        vram: "10GB VRAM",
        speed: "medium",
        quality: "excellent"
      },
      {
        value: "gemma3-27b" as LocalModel,
        label: "Gemma 3 27B",
        description: "Google's Gemma 3 model",
        size: "Large",
        category: "general",
        privacy: "100% offline",
        vram: "18GB VRAM",
        speed: "medium",
        quality: "excellent"
      },
      {
        value: "gemma3-9b" as LocalModel,
        label: "Gemma 3 9B",
        description: "Google's Gemma 3 model",
        size: "Small",
        category: "general",
        privacy: "100% offline",
        vram: "8GB VRAM",
        speed: "fast",
        quality: "good"
      },
      {
        value: "gemma3-4b" as LocalModel,
        label: "Gemma 3 4B",
        description: "Google's compact Gemma 3 model",
        size: "Tiny",
        category: "compact",
        privacy: "100% offline",
        vram: "4GB VRAM",
        speed: "fast",
        quality: "good"
      },
      {
        value: "gemma2-27b" as LocalModel,
        label: "Gemma 2 27B",
        description: "Google's Gemma 2 model",
        size: "Large",
        category: "general",
        privacy: "100% offline",
        vram: "18GB VRAM",
        speed: "medium",
        quality: "good"
      },
      {
        value: "gemma2-9b" as LocalModel,
        label: "Gemma 2 9B",
        description: "Google's Gemma 2 model",
        size: "Small",
        category: "general",
        privacy: "100% offline",
        vram: "8GB VRAM",
        speed: "fast",
        quality: "good"
      },
      {
        value: "neural-chat-7b-v3-1" as LocalModel,
        label: "Neural Chat 7B v3.1",
        description: "Neural chat model",
        size: "Small",
        category: "general",
        privacy: "100% offline",
        vram: "6GB VRAM",
        speed: "fast",
        quality: "good"
      },
      {
        value: "openchat-3.5" as LocalModel,
        label: "OpenChat 3.5",
        description: "Open-source chat model",
        size: "Small",
        category: "general",
        privacy: "100% offline",
        vram: "6GB VRAM",
        speed: "fast",
        quality: "good"
      },
      {
        value: "openthinker" as LocalModel,
        label: "OpenThinker",
        description: "Open reasoning model",
        size: "Small",
        category: "reasoning",
        privacy: "100% offline",
        vram: "6GB VRAM",
        speed: "fast",
        quality: "good"
      },
      {
        value: "qwq" as LocalModel,
        label: "QwQ",
        description: "Qwen reasoning model",
        size: "Medium",
        category: "reasoning",
        privacy: "100% offline",
        vram: "20GB VRAM",
        speed: "medium",
        quality: "excellent"
      }
    ],
    [locale, messages]
  )

  const [settings, setSettings] = useState<Settings>({
    modelType: "basic",
    maxTokens: 2048,
    apiKey: "",
    geminiApiKey: "",
    xaiApiKey: "",
    geminiModel: "gemini-2.0-flash",
    grokModel: "grok-4-1-fast",
    openaiModel: "gpt-4o",
    localModel: "llama-2-70b-chat",
    basicModel: "grok-4-1-fast",
    customization: {
      showSelectedText: false,
      theme: "light",
      radicallyFocus: false,
      fontSize: "16px",
      highlightColor: "default",
      popupAnimation: "scale",
      persistHighlight: false,
      layoutMode: "floating",
      activationMode: "manual",
      enablePDFSupport: false,
      showTextSelectionButton: true
    },
    customPrompts: {
      systemPrompts: {},
      userPrompts: {}
    }
  })

  const [error, setError] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [initialSettings, setInitialSettings] = useState<Settings | null>(null)
  const [onboardingStep, setOnboardingStep] = useState(1)
  const [isOnboardingActive, setIsOnboardingActive] = useState(false)
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false)
  const [isOnboardingLoading, setIsOnboardingLoading] = useState(true)
  const [isCompletingOnboarding, setIsCompletingOnboarding] = useState(false)

  // API Key validation states
  const [apiKeyValidation, setApiKeyValidation] = useState<{
    gemini?: ApiKeyValidationResult
    xai?: ApiKeyValidationResult
    openai?: ApiKeyValidationResult
  }>({})
  const [validatingApiKeys, setValidatingApiKeys] = useState<{
    gemini?: boolean
    xai?: boolean
    openai?: boolean
  }>({})

  // Enhanced notification system
  const {
    success: notifySuccess,
    error: notifyError,
    notify,
    NotificationOutlet
  } = useStandaloneNotification()

  // Auto-save functionality
  const { autoSaveStatus, debouncedAutoSave, autoSave, timeoutRef } =
    useAutoSave(settings, storage, notifyError)

  // Calculate effective theme for use throughout the component
  const effectiveTheme = useMemo((): "light" | "dark" => {
    const themeSetting = settings?.customization?.theme || "dark"
    if (themeSetting === "system") {
      return window.matchMedia?.("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light"
    }
    return themeSetting as "light" | "dark"
  }, [settings?.customization?.theme])

  const [activePromptMode, setActivePromptMode] = useState<Mode>("explain")
  const [isEditingSystemPrompt, setIsEditingSystemPrompt] = useState(false)
  const [isEditingUserPrompt, setIsEditingUserPrompt] = useState(false)
  const [editedSystemPrompt, setEditedSystemPrompt] = useState("")
  const [editedUserPrompt, setEditedUserPrompt] = useState("")

  const [modelSearchQuery, setModelSearchQuery] = useState("")

  const onboardingSelectedLanguage = useMemo(
    () =>
      SUPPORTED_LANGUAGES.find((language) => language.code === locale) ??
      SUPPORTED_LANGUAGES[0],
    [locale]
  )

  const onboardingSelectedProvider = useMemo(
    () =>
      getOnboardingProviderOptions(effectiveTheme).find(
        (option) => option.id === settings.modelType
      ),
    [settings.modelType, effectiveTheme]
  )

  const filteredGeminiModels = useMemo(
    () =>
      GEMINI_MODELS.filter(
        (model) =>
          model.label.toLowerCase().includes(modelSearchQuery.toLowerCase()) ||
          model.description.toLowerCase().includes(modelSearchQuery.toLowerCase())
      ),
    [GEMINI_MODELS, modelSearchQuery]
  )

  const filteredOpenAIModels = useMemo(
    () =>
      OPENAI_MODELS.filter(
        (model) =>
          model.label.toLowerCase().includes(modelSearchQuery.toLowerCase()) ||
          model.description.toLowerCase().includes(modelSearchQuery.toLowerCase())
      ),
    [OPENAI_MODELS, modelSearchQuery]
  )

  const filteredGrokModels = useMemo(
    () =>
      GROK_MODELS.filter(
        (model) =>
          model.label.toLowerCase().includes(modelSearchQuery.toLowerCase()) ||
          model.description.toLowerCase().includes(modelSearchQuery.toLowerCase())
      ),
    [GROK_MODELS, modelSearchQuery]
  )

  const filteredLocalModels = useMemo(
    () =>
      LOCAL_MODELS.filter(
        (model) =>
          model.label.toLowerCase().includes(modelSearchQuery.toLowerCase()) ||
          model.description.toLowerCase().includes(modelSearchQuery.toLowerCase())
      ),
    [LOCAL_MODELS, modelSearchQuery]
  )

  // Load settings from storage when component mounts
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedSettings = (await storage.get("settings")) as
          | Settings
          | undefined
        if (savedSettings) {
          const loadedSettings = {
            ...savedSettings,
            customization: {
              showSelectedText:
                savedSettings.customization?.showSelectedText ?? true,
              theme: savedSettings.customization?.theme ?? "light",
              radicallyFocus:
                savedSettings.customization?.radicallyFocus ?? false,
              fontSize: savedSettings.customization?.fontSize ?? "medium",
              highlightColor:
                savedSettings.customization?.highlightColor ?? "default",
              popupAnimation:
                savedSettings.customization?.popupAnimation ?? "fade",
              persistHighlight:
                savedSettings.customization?.persistHighlight ?? false,
              layoutMode: savedSettings.customization?.layoutMode ?? "sidebar",
              quickView: savedSettings.customization?.quickView ?? true,
              automaticActivation:
                savedSettings.customization?.automaticActivation ?? false,
              contextAwareness:
                savedSettings.customization?.contextAwareness ?? false,
              activationMode:
                savedSettings.customization?.activationMode ?? "manual",
              enablePDFSupport:
                savedSettings.customization?.enablePDFSupport ?? false,
              showTextSelectionButton:
                savedSettings.customization?.showTextSelectionButton ?? true,
              showWebsiteInfo:
                savedSettings.customization?.showWebsiteInfo ?? false,
              sidebarPinned: savedSettings.customization?.sidebarPinned ?? false
            }
          }
          setSettings(loadedSettings)
          setInitialSettings(loadedSettings)
        }
      } catch (err) {
        console.error("Error loading settings:", err)
        setError("Failed to load settings")
        notifyError(getMessage("loadingFailedTitle"))
      }
    }

    loadSettings()
  }, [])

  useEffect(() => {
    const loadOnboardingState = async () => {
      try {
        const [completedFlag, storedStep] = await Promise.all([
          storage.get<boolean>("onboardingComplete"),
          storage.get<number>("onboardingProgress")
        ])

        if (completedFlag) {
          setHasCompletedOnboarding(true)
          setIsOnboardingActive(false)
        } else {
          setIsOnboardingActive(true)
          setOnboardingStep(storedStep && storedStep >= 1 ? storedStep : 1)
        }
      } catch (err) {
        console.error("Error loading onboarding state:", err)
      } finally {
        setIsOnboardingLoading(false)
      }
    }

    loadOnboardingState()
  }, [storage])

  // Onboarding navigation callbacks
  const persistOnboardingStep = useCallback(
    async (step: number) => {
      setOnboardingStep(step)
      await storage.set("onboardingProgress", step)
    },
    [storage]
  )

  const handleOnboardingNext = useCallback(async () => {
    if (onboardingStep >= ONBOARDING_TOTAL_STEPS) return
    const nextStep = Math.min(onboardingStep + 1, ONBOARDING_TOTAL_STEPS)
    await persistOnboardingStep(nextStep)
  }, [onboardingStep, persistOnboardingStep])

  const handleOnboardingBack = useCallback(async () => {
    if (onboardingStep <= 1) return
    const previousStep = Math.max(onboardingStep - 1, 1)
    await persistOnboardingStep(previousStep)
  }, [onboardingStep, persistOnboardingStep])

  const handleSkipOnboarding = useCallback(async () => {
    await storage.set("onboardingComplete", true)
    await storage.remove("onboardingProgress")
    setIsOnboardingActive(false)
    setHasCompletedOnboarding(true)
  }, [storage])

  const handleCompleteOnboarding = useCallback(async () => {
    if (isCompletingOnboarding) return
    setIsCompletingOnboarding(true)
    try {
      await storage.set("settings", settings)
      await storage.set("onboardingComplete", true)
      await storage.remove("onboardingProgress")
      setIsOnboardingActive(false)
      setHasCompletedOnboarding(true)
      notifySuccess(getMessage("onboardingCompleteToast") || "Setup complete!")
      
      // Redirect to LightUp home page
      chrome.tabs.create({ url: "https://www.boimaginations.com/lightup" })
    } catch (error) {
      console.error("Error completing onboarding:", error)
      notifyError(getMessage("onboardingCompleteError") || "Setup failed")
    } finally {
      setIsCompletingOnboarding(false)
    }
  }, [isCompletingOnboarding, notifyError, notifySuccess, settings, storage])

  // Theme handling - set data-theme attribute based on settings
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", effectiveTheme)

    // Listen for system theme changes if in system mode
    if (settings?.customization?.theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
      const handleChange = (e: MediaQueryListEvent) => {
        document.documentElement.setAttribute(
          "data-theme",
          e.matches ? "dark" : "light"
        )
      }
      mediaQuery.addEventListener("change", handleChange)
      return () => mediaQuery.removeEventListener("change", handleChange)
    }
    rememberTheme(settings?.customization?.theme || "dark")
  }, [settings?.customization?.theme, effectiveTheme])

  // Track unsaved changes
  useEffect(() => {
    if (initialSettings) {
      const hasChanges =
        JSON.stringify(settings) !== JSON.stringify(initialSettings)
      setHasUnsavedChanges(hasChanges)

      // Check if we should auto-save based on what changed
      const shouldAutoSave = () => {
        // If no changes, don't save
        if (!hasChanges) return false

        // Check if only model-related settings changed
        const modelSettingsChanged =
          settings.modelType !== initialSettings.modelType ||
          settings.geminiModel !== initialSettings.geminiModel ||
          settings.grokModel !== initialSettings.grokModel ||
          settings.localModel !== initialSettings.localModel ||
          settings.geminiApiKey !== initialSettings.geminiApiKey ||
          settings.xaiApiKey !== initialSettings.xaiApiKey ||
          settings.serverUrl !== initialSettings.serverUrl

        // If non-model settings changed, always auto-save
        if (!modelSettingsChanged) return true

        // If model settings changed, check if configuration is complete
        if (settings.modelType === "gemini") {
          return (
            settings.geminiApiKey && settings.geminiApiKey.trim().length > 0
          )
        } else if (settings.modelType === "grok") {
          return settings.xaiApiKey && settings.xaiApiKey.trim().length > 0
        } else if (settings.modelType === "local") {
          return settings.serverUrl && settings.serverUrl.trim().length > 0
        }
        return true // For 'basic' model type, always allow auto-save
      }

      // Trigger auto-save based on the logic above
      if (shouldAutoSave()) {
        debouncedAutoSave(settings, setInitialSettings)
      }
    }
  }, [settings, initialSettings, debouncedAutoSave])

  // Auto-select models when API keys are provided but no model is selected
  useEffect(() => {
    let needsUpdate = false
    const updatedSettings = { ...settings }

    // Auto-select Gemini model if API key exists but no model selected
    if (
      settings.modelType === "gemini" &&
      settings.geminiApiKey &&
      !settings.geminiModel
    ) {
      updatedSettings.geminiModel = GEMINI_MODELS[0].value
      needsUpdate = true

      notify(getMessage("modelAutoSelectedTitle"))
    }

    // Auto-select Grok model if API key exists but no model selected
    if (
      settings.modelType === "grok" &&
      settings.xaiApiKey &&
      !settings.grokModel
    ) {
      updatedSettings.grokModel = GROK_MODELS[0].value
      needsUpdate = true

      notify(getMessage("modelAutoSelectedTitle"))
    }

    // Auto-select Local model if server URL exists but no model selected
    if (
      settings.modelType === "local" &&
      settings.serverUrl &&
      !settings.localModel
    ) {
      updatedSettings.localModel = LOCAL_MODELS[0].value
      needsUpdate = true

      notify(getMessage("modelAutoSelectedTitle"))
    }

    if (needsUpdate) {
      setSettings(updatedSettings)
      // Auto-save when we make model selections due to API key being provided
      setTimeout(() => handleSave(), 100)
    }
  }, [
    settings.modelType,
    settings.geminiApiKey,
    settings.xaiApiKey,
    settings.serverUrl,
    settings.geminiModel,
    settings.grokModel,
    settings.localModel,
    notify
  ])

  useEffect(() => {
    // const scrollToElement = (id: string) => {
    //   setTimeout(() => {
    //     const element = document.getElementById(id);
    //     if (element) {
    //       element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    //     }
    //   }, 300);
    // };
    // if (window.location.hash) {
    //   const id = window.location.hash.substring(1);
    //   scrollToElement(id);
    // }
    // const handleHashChange = () => {
    //   if (window.location.hash) {
    //     const id = window.location.hash.substring(1);
    //     scrollToElement(id);
    //   }
    // };
    // window.addEventListener('hashchange', handleHashChange);
    // return () => {
    //   window.removeEventListener('hashchange', handleHashChange);
    // };
  }, [])

  // Enhanced save function with better notifications
  const handleSave = async () => {
    try {
      setIsSaving(true)

      const updatedSettings = { ...settings }

      // DEBUG: Log settings being saved
      console.log(
        "[Options] Saving settings:",
        JSON.stringify(
          {
            modelType: updatedSettings.modelType,
            geminiApiKey: updatedSettings.geminiApiKey
              ? `${updatedSettings.geminiApiKey.substring(0, 10)}...`
              : "EMPTY",
            geminiModel: updatedSettings.geminiModel,
            apiKey: updatedSettings.apiKey ? "PRESENT" : "EMPTY",
            xaiApiKey: updatedSettings.xaiApiKey ? "PRESENT" : "EMPTY"
          },
          null,
          2
        )
      )

      await storage.set("settings", updatedSettings)

      // Update initial settings to reflect saved state
      setInitialSettings(updatedSettings)
      setHasUnsavedChanges(false)

      // Clear any existing errors since save was successful
      setError("")

      // Notify all tabs about the settings change
      if (typeof chrome !== "undefined" && chrome.tabs) {
        chrome.tabs.query({}, (tabs) => {
          tabs.forEach((tab) => {
            if (tab.id) {
              chrome.tabs
                .sendMessage(tab.id, {
                  type: "SETTINGS_UPDATED",
                  settings: updatedSettings
                })
                .catch(() => {
                  // Ignore errors for tabs without content script
                })
            }
          })
        })
      }

      setIsSaving(false)
      setSaveSuccess(true)

      setTimeout(() => {
        setSaveSuccess(false)
      }, 3000)
    } catch (err) {
      console.error("Failed to save settings:", err)
      setError("Failed to save settings")
      setIsSaving(false)

      // Show error notification
      notifyError(getMessage("saveFailedTitle"))
    }
  }

  const handleServerUrlChange = (e) => {
    let url = e.target.value
    if (url && !url.startsWith("http://") && !url.startsWith("https://")) {
      url = `http://${url}`
    }
    setSettings((prev) => ({
      ...prev,
      serverUrl: url
    }))
  }

  const colorOptions = [
    {
      value: "default",
      label: "Default (System)",
      color: "lu-bg-gradient-to-r lu-from-blue-500 lu-to-green-500"
    },
    { value: "yellow", label: "Yellow", color: "lu-bg-[#fff8bc]" },
    { value: "orange", label: "Orange", color: "lu-bg-[#FFBF5A]" },
    { value: "blue", label: "Blue", color: "lu-bg-[#93C5FD]" },
    { value: "green", label: "Green", color: "lu-bg-[#86EFAC]" },
    { value: "purple", label: "Purple", color: "lu-bg-[#C4B5FD]" },
    { value: "pink", label: "Pink", color: "lu-bg-[#FDA4AF]" }
  ]

  const handleImmediateSettingUpdate = async (key: string, value: any) => {
    try {
      const newSettings = {
        ...settings,
        customization: {
          ...settings.customization,
          [key]: value
        }
      }

      // Update local state
      setSettings(newSettings)

      // Use auto-save for immediate updates
      debouncedAutoSave(newSettings)

      // Dispatch event for other components in the same window
      window.dispatchEvent(
        new CustomEvent("settingsUpdated", {
          detail: { settings: newSettings }
        })
      )

      // Notify all tabs about the settings change for real-time updates
      if (typeof chrome !== "undefined" && chrome.tabs) {
        chrome.tabs.query({}, (tabs) => {
          tabs.forEach((tab) => {
            if (tab.id) {
              chrome.tabs
                .sendMessage(tab.id, {
                  type: "SETTINGS_UPDATED",
                  settings: newSettings,
                  updatedKey: key
                })
                .catch((err) => {
                  // Ignore errors for tabs that don't have the content script running
                  console.log(`Could not send message to tab ${tab.id}:`, err)
                })
            }
          })
        })
      }
    } catch (error) {
      console.error("Error updating setting:", error)
    }
  }

  // Function to update multiple settings at once
  const handleMultipleSettingsUpdate = async (
    settingsUpdates: Record<string, any>
  ) => {
    try {
      const newSettings = {
        ...settings,
        customization: {
          ...settings.customization,
          ...settingsUpdates
        }
      }

      // Update local state
      setSettings(newSettings)

      // Save to storage
      await storage.set("settings", newSettings)

      // Dispatch event for other components in the same window
      window.dispatchEvent(
        new CustomEvent("settingsUpdated", {
          detail: { settings: newSettings }
        })
      )

      // Notify all tabs about the settings change for real-time updates
      if (typeof chrome !== "undefined" && chrome.tabs) {
        chrome.tabs.query({}, (tabs) => {
          tabs.forEach((tab) => {
            if (tab.id) {
              chrome.tabs
                .sendMessage(tab.id, {
                  type: "SETTINGS_UPDATED",
                  settings: newSettings,
                  updatedKeys: Object.keys(settingsUpdates)
                })
                .catch((err) => {
                  // Ignore errors for tabs that don't have the content script running
                  console.log(`Could not send message to tab ${tab.id}:`, err)
                })
            }
          })
        })
      }
    } catch (error) {
      console.error("Error updating multiple settings:", error)
    }
  }

  // API Key validation functions
  const validateApiKey = useCallback(
    async (apiKey: string, provider: "gemini" | "xai" | "openai") => {
      if (!apiKey || !apiKey.trim()) {
        setApiKeyValidation((prev) => ({
          ...prev,
          [provider]: undefined
        }))
        return
      }

      setValidatingApiKeys((prev) => ({ ...prev, [provider]: true }))

      try {
        const result = await apiKeyValidator.validateWithApi(
          apiKey.trim(),
          provider
        )

        setApiKeyValidation((prev) => ({
          ...prev,
          [provider]: result
        }))

        // Show validation result in toast and clear any general errors
        if (result.isValid) {
          // Clear any existing error messages since API key is valid
          setError("")
          notifySuccess(
            `${provider.charAt(0).toUpperCase() + provider.slice(1)} API key valid`
          )
        } else {
          notifyError(result.error || "Invalid API key")
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Validation failed"
        setApiKeyValidation((prev) => ({
          ...prev,
          [provider]: {
            isValid: false,
            error: errorMessage,
            timestamp: Date.now()
          }
        }))

        notifyError(errorMessage)
      } finally {
        setValidatingApiKeys((prev) => ({ ...prev, [provider]: false }))
      }
    },
    [notifySuccess, notifyError]
  )

  // Debounced validation to avoid excessive API calls
  const debouncedValidateApiKey = useCallback(
    (() => {
      const timeouts: { [key: string]: NodeJS.Timeout } = {}

      return (apiKey: string, provider: "gemini" | "xai" | "openai") => {
        // Clear existing timeout for this provider
        if (timeouts[provider]) {
          clearTimeout(timeouts[provider])
        }

        // Set new timeout
        timeouts[provider] = setTimeout(() => {
          validateApiKey(apiKey, provider)
        }, 1000) // Wait 1 second after user stops typing
      }
    })(),
    [validateApiKey]
  )

  const [activeTab, setActiveTab] = useState("general")

  // Save immediately when user navigates away from a section
  const previousActiveTab = useRef(activeTab)
  useEffect(() => {
    const hasTabChanged = previousActiveTab.current !== activeTab

    if (hasTabChanged && hasUnsavedChanges && initialSettings) {
      // Cancel any pending debounced save
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      // Save immediately when navigating between sections
      autoSave(settings, setInitialSettings)

      notifySuccess(getMessage("settingsSavedTitle"))
    }

    previousActiveTab.current = activeTab
  }, [
    activeTab,
    hasUnsavedChanges,
    initialSettings,
    settings,
    autoSave,
    notifySuccess
  ])

  return (
    <OptionsContainer>
      {/* Onboarding Wizard - shown on first run */}
      {isOnboardingActive && !isOnboardingLoading && (
        <OnboardingWizard
          step={onboardingStep}
          totalSteps={ONBOARDING_TOTAL_STEPS}
          settings={settings}
          locale={locale}
          onUpdateSettings={(updates) =>
            setSettings((prev) => ({ ...prev, ...updates }))
          }
          onUpdateCustomization={(key, value) => {
            setSettings((prev) => ({
              ...prev,
              customization: {
                ...prev.customization,
                [key]: value
              }
            }))
          }}
          onUpdateLocale={changeLocale}
          onNext={handleOnboardingNext}
          onBack={handleOnboardingBack}
          onSkip={handleSkipOnboarding}
          onComplete={handleCompleteOnboarding}
          isLoading={isOnboardingLoading}
          isCompleting={isCompletingOnboarding}
          supportedLanguages={SUPPORTED_LANGUAGES}
          providerOptions={getOnboardingProviderOptions(effectiveTheme)}
          toggleOptions={ONBOARDING_TOGGLES}
          stepCopy={[...ONBOARDING_STEP_COPY]}
        />
      )}

      <Header>
        <Logo />
        <VersionBadgeContainer>
          <BetaBadge>{getMessage("betaBadgeLabel")}</BetaBadge>
          <VersionNumber>v0.1.18</VersionNumber>
        </VersionBadgeContainer>
        {/* <CloseButton onClick={() => window.close()}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </CloseButton> */}
      </Header>
      <ContentWrapper>
        <Sidebar>
          <SidebarItem
            active={activeTab === "general"}
            onClick={() => setActiveTab("general")}>
            <SidebarIcon>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className="size-6">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
                />
              </svg>
            </SidebarIcon>
            {getMessage("generalTabLabel")}
          </SidebarItem>
          <SidebarItem
            active={activeTab === "model"}
            onClick={() => setActiveTab("model")}>
            <SidebarIcon>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className="size-6">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 0 0 2.25-2.25V6.75a2.25 2.25 0 0 0-2.25-2.25H6.75A2.25 2.25 0 0 0 4.5 6.75v10.5a2.25 2.25 0 0 0 2.25 2.25Zm.75-12h9v9h-9v-9Z"
                />
              </svg>
            </SidebarIcon>
            {getMessage("modelSettingsTabLabel")}
          </SidebarItem>
          <SidebarItem
            active={activeTab === "prompts"}
            onClick={() => setActiveTab("prompts")}>
            <SidebarIcon>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
                />
              </svg>
            </SidebarIcon>
            {getMessage("promptTemplatesTabLabel")}
          </SidebarItem>
          <SidebarItem
            active={activeTab === "customization"}
            onClick={() => setActiveTab("customization")}>
            <SidebarIcon>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.128Zm0 0a15.998 15.998 0 0 0 3.388-1.62m-5.043-.025a15.994 15.994 0 0 1 1.622-3.395m3.42 3.42a15.995 15.995 0 0 0 4.764-4.648l3.876-5.814a1.151 1.151 0 0 0-1.597-1.597L14.146 6.32a15.996 15.996 0 0 0-4.649 4.763m3.42 3.42a6.776 6.776 0 0 0-3.42-3.42"
                />
              </svg>
            </SidebarIcon>
            {getMessage("appearanceTabLabel")}
          </SidebarItem>

          <SidebarItem
            active={activeTab === "about"}
            onClick={() => setActiveTab("about")}>
            <SidebarIcon>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
                />
              </svg>
            </SidebarIcon>
            {getMessage("aboutTabLabel")}
          </SidebarItem>
        </Sidebar>
        <ContentArea>
          {activeTab === "general" && (
            <div key="general">
              <SettingsCard
                title={getMessage("generalSettingsTitle")}
                icon={null}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(1, minmax(0, 1fr))",
                    gap: "24px"
                  }}>
                  <SectionContainer>
                    {/* <SectionHeader>Display Options</SectionHeader> */}

                    <FormRow>
                      <div>
                        <Label>{getMessage("showSelectedTextLabel")}</Label>
                        <Description>
                          {getMessage("showSelectedTextDescription")}
                        </Description>
                      </div>
                      <Toggle
                        checked={settings.customization?.showSelectedText}
                        onCheckedChange={(checked) =>
                          handleImmediateSettingUpdate(
                            "showSelectedText",
                            checked
                          )
                        }
                        aria-label={getMessage("showSelectedTextLabel")}
                      />
                    </FormRow>

                    <SectionDivider />

                    <FormRow>
                      <div>
                        <Label>{getMessage("showWebsiteInfoLabel")}</Label>
                        <Description>
                          {getMessage("showWebsiteInfoDescription")}
                        </Description>
                      </div>
                      <Toggle
                        checked={
                          settings.customization?.showWebsiteInfo !== false
                        }
                        onCheckedChange={(checked) =>
                          handleImmediateSettingUpdate(
                            "showWebsiteInfo",
                            checked
                          )
                        }
                        aria-label={getMessage("showWebsiteInfoLabel")}
                      />
                    </FormRow>

                    <SectionDivider />

                    <FormRow>
                      <div>
                        <Label>{getMessage("keepHighlightedTextLabel")}</Label>
                        <Description>
                          {getMessage("keepHighlightedTextDescription")}
                        </Description>
                      </div>
                      <Toggle
                        checked={settings.customization?.persistHighlight}
                        onCheckedChange={(checked) =>
                          handleImmediateSettingUpdate(
                            "persistHighlight",
                            checked
                          )
                        }
                        aria-label={getMessage("keepHighlightedTextLabel")}
                      />
                    </FormRow>

                    <SectionDivider />

                    <FormRow>
                      <div>
                        <Label>{getMessage("autoOpenLightUpLabel")}</Label>
                        <Description>
                          {getMessage("autoOpenLightUpDescription")}
                        </Description>
                      </div>
                      <Toggle
                        checked={settings.customization?.automaticActivation}
                        onCheckedChange={(checked) => {
                          // Update both settings to ensure consistency in a single operation
                          const newValue = checked
                          handleMultipleSettingsUpdate({
                            automaticActivation: newValue,
                            activationMode: newValue ? "automatic" : "manual"
                          })
                        }}
                        aria-label={getMessage("autoOpenLightUpLabel")}
                      />
                    </FormRow>

                    <SectionDivider />

                    <FormRow>
                      <div>
                        <Label>{getMessage("contextAwarenessLabel")}</Label>
                        <Description>
                          {getMessage("contextAwarenessDescription")}
                        </Description>
                      </div>
                      <Toggle
                        checked={settings.customization?.contextAwareness}
                        onCheckedChange={(checked) =>
                          handleImmediateSettingUpdate(
                            "contextAwareness",
                            checked
                          )
                        }
                        aria-label={getMessage("contextAwarenessLabel")}
                      />
                    </FormRow>

                    <SectionDivider />

                    <FormRow>
                      <div>
                        <Label>{getMessage("showInstantAIButtonLabel")}</Label>
                        <Description>
                          {getMessage("showInstantAIButtonDesc")}
                        </Description>
                      </div>
                      <Toggle
                        checked={settings.customization?.quickView}
                        onCheckedChange={(checked) =>
                          handleImmediateSettingUpdate(
                            "quickView",
                            checked
                          )
                        }
                        aria-label={getMessage("showInstantAIButtonLabel")}
                      />
                    </FormRow>

                    <SectionDivider />

                    <FormRow>
                      <div>
                        <Label>{getMessage("showActionButtonLabel")}</Label>
                        <Description>
                          {getMessage("showActionButtonDesc")}
                        </Description>
                      </div>
                      <Toggle
                        checked={
                          settings.customization?.showTextSelectionButton !==
                          false
                        }
                        onCheckedChange={(checked) =>
                          handleImmediateSettingUpdate(
                            "showTextSelectionButton",
                            checked
                          )
                        }
                        aria-label={getMessage("showActionButtonLabel")}
                      />
                    </FormRow>
                    <SectionDivider />
                    <div style={{ marginTop: "0", marginBottom: "16px" }}>
                      <Label>{getMessage("layoutModeLabel")}</Label>
                      <Description>{getMessage("layoutModeDesc")}</Description>

                      <div
                        style={{
                          display: "flex",
                          gap: "12px",
                          marginTop: "16px"
                        }}>
                        <LayoutButton
                          selected={
                            settings.customization?.layoutMode === "floating"
                          }
                          onClick={() =>
                            handleImmediateSettingUpdate(
                              "layoutMode",
                              "floating"
                            )
                          }>
                          <div className="layout-icon">
                            <svg
                              width="24"
                              height="24"
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg">
                              <rect
                                x="4"
                                y="4"
                                width="16"
                                height="16"
                                rx="2"
                                stroke="currentColor"
                                strokeWidth="2"
                              />
                              <circle
                                cx="12"
                                cy="12"
                                r="1"
                                stroke="currentColor"
                                strokeWidth="2"
                              />
                              <circle
                                cx="12"
                                cy="8"
                                r="1"
                                stroke="currentColor"
                                strokeWidth="2"
                              />
                              <circle
                                cx="12"
                                cy="16"
                                r="1"
                                stroke="currentColor"
                                strokeWidth="2"
                              />
                            </svg>
                          </div>
                          <div className="layout-label">
                            {getMessage("layoutOptionFloatingLabel")}
                          </div>
                        </LayoutButton>

                        <LayoutButton
                          selected={
                            settings.customization?.layoutMode === "sidebar"
                          }
                          onClick={() =>
                            handleImmediateSettingUpdate(
                              "layoutMode",
                              "sidebar"
                            )
                          }>
                          <div className="layout-icon">
                            <svg
                              width="24"
                              height="24"
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg">
                              <rect
                                x="3"
                                y="3"
                                width="18"
                                height="18"
                                rx="2"
                                stroke="currentColor"
                                strokeWidth="2"
                              />
                              <line
                                x1="15"
                                y1="3"
                                x2="15"
                                y2="21"
                                stroke="currentColor"
                                strokeWidth="2"
                              />
                            </svg>
                          </div>
                          <div className="layout-label">
                            {getMessage("layoutOptionSidebarLabel")}
                          </div>
                        </LayoutButton>

                        <LayoutButton
                          selected={
                            settings.customization?.layoutMode === "centered"
                          }
                          onClick={() =>
                            handleImmediateSettingUpdate(
                              "layoutMode",
                              "centered"
                            )
                          }>
                          <div className="layout-icon">
                            <svg
                              width="24"
                              height="24"
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg">
                              <rect
                                x="2"
                                y="4"
                                width="20"
                                height="16"
                                rx="2"
                                stroke="currentColor"
                                strokeWidth="2"
                              />
                              <rect
                                x="6"
                                y="8"
                                width="12"
                                height="8"
                                rx="1"
                                stroke="currentColor"
                                strokeWidth="2"
                              />
                            </svg>
                          </div>
                          <div className="layout-label">
                            {getMessage("layoutOptionCenteredLabel")}
                          </div>
                        </LayoutButton>
                      </div>
                    </div>
                  </SectionContainer>
                </div>
              </SettingsCard>
            </div>
          )}

          {activeTab === "model" && (
            <div key="model">
              <SettingsCard
                title={getMessage("modelSettingsTitle")}
                icon={null}>
                <SectionContainer>
                  <SectionHeader>
                    {getMessage("aiEngineSelectionHeader")}
                  </SectionHeader>
                  <SubContainer>
                    <FormGroup>
                      <FormLabel>
                        {getMessage("chooseModelTypeLabel")}
                      </FormLabel>
                      <FormDescription>
                        {getMessage("chooseModelTypeDescription")}
                      </FormDescription>
                      <ProviderGrid>
                        {getOnboardingProviderOptions(effectiveTheme).map((provider) => (
                          <ProviderCard
                            key={provider.id}
                            selected={settings.modelType === provider.id}
                            onClick={() => {
                              const newModelType = provider.id
                              setSettings((prev) => {
                                const newSettings = {
                                  ...prev,
                                  modelType: newModelType
                                }

                                // Auto-select first model for Gemini if none selected
                                if (
                                  newModelType === "gemini" &&
                                  !prev.geminiModel
                                ) {
                                  newSettings.geminiModel = GEMINI_MODELS[0].value
                                }
                                // Auto-select first model for Grok if none selected
                                else if (
                                  newModelType === "grok" &&
                                  !prev.grokModel
                                ) {
                                  newSettings.grokModel = GROK_MODELS[0].value
                                }
                                // Auto-select first model for OpenAI if none selected
                                else if (
                                  newModelType === "openai" &&
                                  !prev.openaiModel
                                ) {
                                  newSettings.openaiModel = OPENAI_MODELS[0].value
                                }
                                // Auto-select first model for Local if none selected
                                else if (
                                  newModelType === "local" &&
                                  !prev.localModel
                                ) {
                                  newSettings.localModel = LOCAL_MODELS[0].value
                                }

                                return newSettings
                              })
                            }}
                          >
                            {settings.modelType === provider.id && (
                              <ProviderCheckBadge aria-label="Selected provider">
                                <svg
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg">
                                  <path
                                    d="M20 6L9 17L4 12"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              </ProviderCheckBadge>
                            )}
                            <ProviderIconWrapper>
                              {provider.icon}
                            </ProviderIconWrapper>
                            <ProviderContent>
                              <ProviderTitle selected={settings.modelType === provider.id}>
                                {provider.title}
                              </ProviderTitle>
                              <ProviderSubtitle>
                                {provider.subtitle}
                              </ProviderSubtitle>
                              <ProviderBody>
                                {provider.body}
                              </ProviderBody>
                            </ProviderContent>
                          </ProviderCard>
                        ))}
                      </ProviderGrid>
                    </FormGroup>
                  </SubContainer>
                </SectionContainer>

                {settings.modelType === "basic" && (
                  <SectionContainer>
                    <div
                      style={{
                        background:
                          "linear-gradient(135deg, rgba(255, 193, 7, 0.1) 0%, rgba(255, 152, 0, 0.1) 100%)",
                        border: "1px solid rgba(255, 193, 7, 0.3)",
                        borderRadius: "8px",
                        padding: "16px",
                        marginTop: "12px"
                      }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "12px"
                        }}>
                        <div
                          style={{
                            fontSize: "20px",
                            flexShrink: 0,
                            marginTop: "2px"
                          }}>
                          ⚠️
                        </div>
                        <div>
                          <h4
                            style={{
                              color: theme.validation.warning,
                              fontSize: "14px",
                              fontWeight: "600",
                              margin: "0 0 8px 0",
                              textTransform: "uppercase",
                              letterSpacing: "0.5px"
                            }}>
                            {getMessage("dataPrivacyNoticeTitle")}
                          </h4>
                          <p
                            style={{
                              color: theme.foreground,
                              fontSize: "13px",
                              lineHeight: "1.5",
                              margin: "0 0 8px 0"
                            }}>
                            {getMessage("basicTierPrivacyWarningPrimary")}
                          </p>
                          <p
                            style={{
                              color: theme.secondaryText,
                              fontSize: "12px",
                              lineHeight: "1.4",
                              margin: "0"
                            }}>
                            {getMessage("basicTierPrivacyWarningSecondary")}
                          </p>
                        </div>
                      </div>
                    </div>
                  </SectionContainer>
                )}

                {settings.modelType === "gemini" && (
                  <SectionContainer>
                    <SectionHeader>
                      {getMessage("geminiConfigurationHeader")}
                    </SectionHeader>
                    <SubContainer>
                      <FormGroup>
                        <FormLabel htmlFor="geminiApiKey">
                          {getMessage("geminiApiKeyLabel")}
                          {!settings.geminiApiKey && <RequiredLabel />}
                        </FormLabel>
                        <ApiKeyInput
                          type="password"
                          id="geminiApiKey"
                          value={settings.geminiApiKey}
                          onChange={(e) => {
                            const newApiKey = e.target.value
                            setSettings((prev) => ({
                              ...prev,
                              geminiApiKey: newApiKey
                            }))

                            // Trigger validation
                            if (newApiKey.trim()) {
                              debouncedValidateApiKey(newApiKey, "gemini")
                              setTimeout(() => handleSave(), 100)
                            } else {
                              // Clear validation when empty
                              setApiKeyValidation((prev) => ({
                                ...prev,
                                gemini: undefined
                              }))
                            }
                          }}
                          onBlur={handleSave}
                          placeholder={getMessage("geminiApiKeyPlaceholder")}
                          hasValidation={!!apiKeyValidation.gemini}
                          isValid={apiKeyValidation.gemini?.isValid}
                        />

                        {/* Validation Status */}
                        {(validatingApiKeys.gemini ||
                          apiKeyValidation.gemini) && (
                          <ValidationStatus
                            isValidating={validatingApiKeys.gemini}
                            isValid={apiKeyValidation.gemini?.isValid}>
                            <ValidationIcon
                              isValidating={validatingApiKeys.gemini}
                              isValid={apiKeyValidation.gemini?.isValid}>
                              {validatingApiKeys.gemini ? (
                                <svg
                                  width="14"
                                  height="14"
                                  viewBox="0 0 24 24"
                                  fill="currentColor">
                                  <path d="M12,4a8,8,0,0,1,7.89,6.7A1.53,1.53,0,0,0,21.38,12h0a1.5,1.5,0,0,0,1.48-1.75,11,11,0,0,0-21.72,0A1.5,1.5,0,0,0,2.62,12h0a1.53,1.53,0,0,0,1.49-1.3A8,8,0,0,1,12,4Z" />
                                </svg>
                              ) : apiKeyValidation.gemini?.isValid === true ? (
                                <svg
                                  width="14"
                                  height="14"
                                  viewBox="0 0 24 24"
                                  fill="currentColor">
                                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                                </svg>
                              ) : apiKeyValidation.gemini?.isValid === false ? (
                                <svg
                                  width="14"
                                  height="14"
                                  viewBox="0 0 24 24"
                                  fill="currentColor">
                                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                                </svg>
                              ) : null}
                            </ValidationIcon>

                            {validatingApiKeys.gemini
                              ? "Validating..."
                              : apiKeyValidation.gemini?.isValid === true
                                ? "Valid"
                                : apiKeyValidation.gemini?.error
                                  ? apiKeyValidation.gemini.error
                                  : null}
                          </ValidationStatus>
                        )}

                        <FormDescription>
                          {getMessage(
                            "geminiApiKeyDescription",
                            '<a href="https://ai.google.dev/" target="_blank" rel="noopener noreferrer" style="color: var(--popup-primary); text-decoration: none;">Google AI Studio</a>'
                          )}
                        </FormDescription>
                      </FormGroup>
                    </SubContainer>

                    <SubContainer>
                      <FormGroup>
                        <FormLabel>{getMessage("geminiModelLabel")}</FormLabel>
                        <FormDescription>
                          {getMessage("geminiModelDescription")}
                        </FormDescription>
                        <SearchInput
                          type="text"
                          placeholder="Search models..."
                          value={modelSearchQuery}
                          onChange={(e) => setModelSearchQuery(e.target.value)}
                        />
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(1, minmax(0, 1fr))",
                            gap: "12px"
                          }}>
                          {filteredGeminiModels.map((model) => (
                            <ModelOption
                              key={model.value}
                              model={model}
                              selected={settings.geminiModel === model.value}
                              onChange={() => {
                                setSettings((prev) => ({
                                  ...prev,
                                  geminiModel: model.value
                                }))
                                // Auto-save only if API key exists
                                if (settings.geminiApiKey) {
                                  setTimeout(() => handleSave(), 100)
                                }
                              }}
                            />
                          ))}
                          {filteredGeminiModels.length === 0 && (
                            <div
                              style={{
                                padding: "20px",
                                textAlign: "center",
                                color: theme.secondaryText,
                                fontSize: "14px"
                              }}>
                              No models found matching "{modelSearchQuery}"
                            </div>
                          )}
                        </div>
                      </FormGroup>
                    </SubContainer>
                  </SectionContainer>
                )}

                {settings.modelType === "openai" && (
                  <SectionContainer>
                    <SectionHeader>OpenAI Configuration</SectionHeader>
                    <SubContainer>
                      <FormGroup>
                        <FormLabel htmlFor="openaiApiKey">
                          OpenAI API Key
                          {!settings.apiKey && <RequiredLabel />}
                        </FormLabel>
                        <ApiKeyInput
                          type="password"
                          id="openaiApiKey"
                          value={settings.apiKey}
                          onChange={(e) => {
                            const newApiKey = e.target.value
                            setSettings((prev) => ({
                              ...prev,
                              apiKey: newApiKey
                            }))

                            // Trigger validation
                            if (newApiKey.trim()) {
                              debouncedValidateApiKey(newApiKey, "openai")
                              setTimeout(() => handleSave(), 100)
                            } else {
                              // Clear validation when empty
                              setApiKeyValidation((prev) => ({
                                ...prev,
                                openai: undefined
                              }))
                            }
                          }}
                          onBlur={handleSave}
                          placeholder="sk-..."
                          hasValidation={!!apiKeyValidation.openai}
                          isValid={apiKeyValidation.openai?.isValid}
                        />

                        {/* Validation Status */}
                        {(validatingApiKeys.openai ||
                          apiKeyValidation.openai) && (
                          <ValidationStatus
                            isValidating={validatingApiKeys.openai}
                            isValid={apiKeyValidation.openai?.isValid}>
                            <ValidationIcon
                              isValidating={validatingApiKeys.openai}
                              isValid={apiKeyValidation.openai?.isValid}>
                              {validatingApiKeys.openai ? (
                                <svg
                                  width="14"
                                  height="14"
                                  viewBox="0 0 24 24"
                                  fill="currentColor">
                                  <path d="M12,4a8,8,0,0,1,7.89,6.7A1.53,1.53,0,0,0,21.38,12h0a1.5,1.5,0,0,0,1.48-1.75,11,11,0,0,0-21.72,0A1.5,1.5,0,0,0,2.62,12h0a1.53,1.53,0,0,0,1.49-1.3A8,8,0,0,1,12,4Z" />
                                </svg>
                              ) : apiKeyValidation.openai?.isValid === true ? (
                                <svg
                                  width="14"
                                  height="14"
                                  viewBox="0 0 24 24"
                                  fill="currentColor">
                                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                                </svg>
                              ) : apiKeyValidation.openai?.isValid === false ? (
                                <svg
                                  width="14"
                                  height="14"
                                  viewBox="0 0 24 24"
                                  fill="currentColor">
                                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                                </svg>
                              ) : null}
                            </ValidationIcon>

                            {validatingApiKeys.openai
                              ? "Validating..."
                              : apiKeyValidation.openai?.isValid === true
                                ? "Valid"
                                : apiKeyValidation.openai?.error
                                  ? apiKeyValidation.openai.error
                                  : null}
                          </ValidationStatus>
                        )}

                        <FormDescription>
                          Get your API key from{" "}
                          <a
                            href="https://platform.openai.com/api-keys"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              color: "var(--popup-primary)",
                              textDecoration: "none"
                            }}>
                            OpenAI Platform
                          </a>
                        </FormDescription>
                      </FormGroup>
                    </SubContainer>

                    <SubContainer>
                      <FormGroup>
                        <FormLabel>OpenAI Model</FormLabel>
                        <FormDescription>
                          Select the OpenAI model to use
                        </FormDescription>
                        <SearchInput
                          type="text"
                          placeholder="Search models..."
                          value={modelSearchQuery}
                          onChange={(e) => setModelSearchQuery(e.target.value)}
                        />
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(1, minmax(0, 1fr))",
                            gap: "12px"
                          }}>
                          {filteredOpenAIModels.map((model) => (
                            <ModelOption
                              key={model.value}
                              model={model}
                              selected={settings.openaiModel === model.value}
                              onChange={() => {
                                setSettings((prev) => ({
                                  ...prev,
                                  openaiModel: model.value
                                }))
                                // Auto-save only if API key exists
                                if (settings.apiKey) {
                                  setTimeout(() => handleSave(), 100)
                                }
                              }}
                            />
                          ))}
                          {filteredOpenAIModels.length === 0 && (
                            <div
                              style={{
                                padding: "20px",
                                textAlign: "center",
                                color: theme.secondaryText,
                                fontSize: "14px"
                              }}>
                              No models found matching "{modelSearchQuery}"
                            </div>
                          )}
                        </div>
                      </FormGroup>
                    </SubContainer>
                  </SectionContainer>
                )}

                {settings.modelType === "grok" && (
                  <SectionContainer>
                    <SectionHeader>
                      {getMessage("grokConfigurationHeader")}
                    </SectionHeader>
                    <SubContainer>
                      <FormGroup>
                        <FormLabel htmlFor="xaiApiKey">
                          {getMessage("xaiApiKeyLabel")}
                          {!settings.xaiApiKey && <RequiredLabel />}
                        </FormLabel>
                        <ApiKeyInput
                          type="password"
                          id="xaiApiKey"
                          value={settings.xaiApiKey}
                          onChange={(e) => {
                            const newApiKey = e.target.value
                            setSettings((prev) => ({
                              ...prev,
                              xaiApiKey: newApiKey
                            }))

                            // Trigger validation
                            if (newApiKey.trim()) {
                              debouncedValidateApiKey(newApiKey, "xai")
                              setTimeout(() => handleSave(), 100)
                            } else {
                              // Clear validation when empty
                              setApiKeyValidation((prev) => ({
                                ...prev,
                                xai: undefined
                              }))
                            }
                          }}
                          onBlur={handleSave}
                          placeholder={getMessage("xaiApiKeyPlaceholder")}
                          hasValidation={!!apiKeyValidation.xai}
                          isValid={apiKeyValidation.xai?.isValid}
                        />

                        {/* Validation Status */}
                        {(validatingApiKeys.xai || apiKeyValidation.xai) && (
                          <ValidationStatus
                            isValidating={validatingApiKeys.xai}
                            isValid={apiKeyValidation.xai?.isValid}>
                            <ValidationIcon
                              isValidating={validatingApiKeys.xai}
                              isValid={apiKeyValidation.xai?.isValid}>
                              {validatingApiKeys.xai ? (
                                <svg
                                  width="14"
                                  height="14"
                                  viewBox="0 0 24 24"
                                  fill="currentColor">
                                  <path d="M12,4a8,8,0,0,1,7.89,6.7A1.53,1.53,0,0,0,21.38,12h0a1.5,1.5,0,0,0,1.48-1.75,11,11,0,0,0-21.72,0A1.5,1.5,0,0,0,2.62,12h0a1.53,1.53,0,0,0,1.49-1.3A8,8,0,0,1,12,4Z" />
                                </svg>
                              ) : apiKeyValidation.xai?.isValid === true ? (
                                <svg
                                  width="14"
                                  height="14"
                                  viewBox="0 0 24 24"
                                  fill="currentColor">
                                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                                </svg>
                              ) : apiKeyValidation.xai?.isValid === false ? (
                                <svg
                                  width="14"
                                  height="14"
                                  viewBox="0 0 24 24"
                                  fill="currentColor">
                                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                                </svg>
                              ) : null}
                            </ValidationIcon>

                            {validatingApiKeys.xai
                              ? "Validating..."
                              : apiKeyValidation.xai?.isValid === true
                                ? "Valid"
                                : apiKeyValidation.xai?.error
                                  ? apiKeyValidation.xai.error
                                  : null}
                          </ValidationStatus>
                        )}

                        <FormDescription>
                          {getMessage(
                            "xaiApiKeyDescription",
                            '<a href="https://x.ai/api" target="_blank" rel="noopener noreferrer" style="color: var(--popup-primary); text-decoration: none;">x.ai</a>'
                          )}
                        </FormDescription>
                      </FormGroup>
                    </SubContainer>

                    <SubContainer>
                      <FormGroup>
                        <FormLabel>{getMessage("grokModelLabel")}</FormLabel>
                        <FormDescription>
                          {getMessage("grokModelDescription")}
                        </FormDescription>
                        <SearchInput
                          type="text"
                          placeholder="Search models..."
                          value={modelSearchQuery}
                          onChange={(e) => setModelSearchQuery(e.target.value)}
                        />
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(1, minmax(0, 1fr))",
                            gap: "12px"
                          }}>
                          {filteredGrokModels.map((model) => (
                            <ModelOption
                              key={model.value}
                              model={model}
                              selected={settings.grokModel === model.value}
                              onChange={() => {
                                setSettings((prev) => ({
                                  ...prev,
                                  grokModel: model.value
                                }))
                                // Auto-save only if API key exists
                                if (settings.xaiApiKey) {
                                  setTimeout(() => handleSave(), 100)
                                }
                              }}
                              showPrice={true}
                            />
                          ))}
                          {filteredGrokModels.length === 0 && (
                            <div
                              style={{
                                padding: "20px",
                                textAlign: "center",
                                color: theme.secondaryText,
                                fontSize: "14px"
                              }}>
                              No models found matching "{modelSearchQuery}"
                            </div>
                          )}
                        </div>
                      </FormGroup>
                    </SubContainer>
                  </SectionContainer>
                )}

                {settings.modelType === "local" && (
                  <SectionContainer>
                    <SectionHeader>
                      {getMessage("ollamaConfigurationHeader")}
                    </SectionHeader>
                    <SubContainer>
                      <FormGroup>
                        <FormLabel htmlFor="serverUrl">
                          {getMessage("ollamaServerUrlLabel")}
                          {!settings.serverUrl && <RequiredLabel />}
                        </FormLabel>
                        <FormInput
                          type="text"
                          id="serverUrl"
                          value={settings.serverUrl}
                          onChange={handleServerUrlChange}
                          onBlur={handleSave}
                          placeholder={getMessage("ollamaServerUrlPlaceholder")}
                          style={{
                            borderColor: !settings.serverUrl
                              ? theme.destructive
                              : undefined
                          }}
                        />
                        <FormDescription>
                          {getMessage(
                            "ollamaServerUrlDescription",
                            "<code style={{ backgroundColor: 'var(--popup-btn-default)', padding: '2px 4px', borderRadius: '4px' }}>http://localhost:11434</code>"
                          )}
                        </FormDescription>
                      </FormGroup>
                    </SubContainer>

                    <SubContainer>
                      <FormGroup>
                        <FormLabel>{getMessage("localModelLabel")}</FormLabel>
                        <FormDescription>
                          {getMessage("localModelDescription")}
                        </FormDescription>
                        <SearchInput
                          type="text"
                          placeholder="Search models..."
                          value={modelSearchQuery}
                          onChange={(e) => setModelSearchQuery(e.target.value)}
                        />
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(1, minmax(0, 1fr))",
                            gap: "12px"
                          }}>
                          {filteredLocalModels.map((model) => (
                            <ModelOption
                              key={model.value}
                              model={model}
                              selected={settings.localModel === model.value}
                              onChange={() => {
                                setSettings((prev) => ({
                                  ...prev,
                                  localModel: model.value
                                }))
                                // Auto-save only if server URL exists
                                if (settings.serverUrl) {
                                  setTimeout(() => handleSave(), 100)
                                }
                              }}
                              showSize={true}
                            />
                          ))}
                          {filteredLocalModels.length === 0 && (
                            <div
                              style={{
                                padding: "20px",
                                textAlign: "center",
                                color: theme.secondaryText,
                                fontSize: "14px"
                              }}>
                              No models found matching "{modelSearchQuery}"
                            </div>
                          )}
                        </div>
                      </FormGroup>
                    </SubContainer>
                  </SectionContainer>
                )}

                <SectionDivider style={{ marginBottom: "30px" }} />

                <SectionContainer>
                  <SectionHeader>
                    {getMessage("responseSettingsHeader")}
                  </SectionHeader>
                  <SubContainer>
                    <FormGroup>
                      <FormLabel htmlFor="maxTokens">
                        {getMessage("maxTokensLabel")}
                      </FormLabel>
                      <FormDescription>
                        {getMessage("maxTokensDescription")}
                      </FormDescription>
                      <FormInput
                        type="number"
                        id="maxTokens"
                        value={settings.maxTokens}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            maxTokens: parseInt(e.target.value)
                          }))
                        }
                        onBlur={handleSave}
                        min="1"
                        max="4096"
                      />
                    </FormGroup>
                  </SubContainer>
                </SectionContainer>

                {/* Auto-saves when settings change - main save button at the bottom of the options page */}
              </SettingsCard>
            </div>
          )}

          {activeTab === "prompts" && (
            <div key="prompts">
              <SettingsCard
                title={getMessage("promptTemplatesTitle")}
                icon={null}>
                <div style={{ marginBottom: "16px" }}>
                  <FormDescription>
                    {getMessage("promptTemplatesDescription")}
                  </FormDescription>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(1, minmax(0, 1fr))",
                    gap: "24px"
                  }}>
                  <SectionContainer>
                    <SectionHeader>
                      {getMessage("promptModeHeader")}
                    </SectionHeader>
                    <FormDescription>
                      {getMessage("promptModeDescription")}
                    </FormDescription>

                    <SectionDivider />

                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "12px",
                        marginTop: "16px"
                      }}>
                      <ActionButton
                        selected={activePromptMode === "explain"}
                        onClick={() => setActivePromptMode("explain")}>
                        <div style={{ fontSize: "20px", marginBottom: "4px" }}>
                          <svg
                            width="24"
                            height="24"
                            viewBox="0 0 89 99"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg">
                            <path
                              d="M2.55007 23.009C0.994225 23.8875 0.0273438 25.5563 0.0273438 27.3624V71.2893C0.0273438 73.1053 0.994225 74.7642 2.55007 75.6427C10.3882 80.0649 34.2363 93.503 41.8389 97.7877C42.5849 98.2049 43.4045 98.416 44.2291 98.416C45.034 98.416 45.8389 98.2147 46.5702 97.8123C54.1727 93.6159 77.9325 80.5213 85.805 76.1777C87.3903 75.309 88.3719 73.6304 88.3719 71.8046V27.3624C88.3719 25.5563 87.405 23.8875 85.8443 23.009C78.0159 18.5967 54.2169 5.18303 46.5849 0.883599C45.8438 0.466416 45.0193 0.255371 44.1996 0.255371C43.3751 0.255371 42.5554 0.466416 41.8143 0.883599C34.1823 5.18303 10.3784 18.5967 2.55007 23.009ZM81.0098 33.3895V70.3224L47.8806 88.5901V51.397L81.0098 33.3895ZM11.0017 26.7931L44.1996 8.07877L77.5791 26.8962L44.1996 45.1344L11.0017 26.7931Z"
                              fill="currentColor"
                            />
                          </svg>
                        </div>
                        <div style={{ fontWeight: "500" }}>
                          {getMessage("explainButtonText")}
                        </div>
                        {activePromptMode === "explain" && (
                          <div
                            style={{
                              position: "absolute",
                              top: "5px",
                              right: "5px",
                              color: theme.accent
                            }}>
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg">
                              <path
                                d="M20 6L9 17L4 12"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </div>
                        )}
                      </ActionButton>

                      <ActionButton
                        selected={activePromptMode === "summarize"}
                        onClick={() => setActivePromptMode("summarize")}>
                        <div style={{ fontSize: "20px", marginBottom: "4px" }}>
                          <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg">
                            <path
                              d="M4 4h16v16H4V4z"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <path
                              d="M4 8h16M8 4v16"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </div>
                        <div style={{ fontWeight: "500" }}>
                          {getMessage("summarizeButtonText")}
                        </div>
                        {activePromptMode === "summarize" && (
                          <div
                            style={{
                              position: "absolute",
                              top: "5px",
                              right: "5px",
                              color: theme.accent
                            }}>
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg">
                              <path
                                d="M20 6L9 17L4 12"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </div>
                        )}
                      </ActionButton>

                      <ActionButton
                        selected={activePromptMode === "analyze"}
                        onClick={() => setActivePromptMode("analyze")}>
                        <div style={{ fontSize: "20px", marginBottom: "4px" }}>
                          <svg
                            width="24"
                            height="24"
                            viewBox="0 0 96 96"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg">
                            <path
                              d="M35.9064 0.109375C16.194 0.109375 0.136719 16.1667 0.136719 35.8791C0.136719 55.5914 16.194 71.6487 35.9064 71.6487C44.44 71.6487 52.2816 68.6328 58.4391 63.6205L83.5695 95.1014C83.5695 95.1014 89.0738 95.9195 92.4913 92.358C95.9325 88.7694 95.1254 83.5488 95.1254 83.5488L63.6478 58.4117C68.6602 52.2543 71.6761 44.4127 71.6761 35.8791C71.6761 16.1667 55.6188 0.109375 35.9064 0.109375ZM35.9064 7.26397C51.7528 7.26397 64.5215 20.0327 64.5215 35.8791C64.5215 51.7254 51.7528 64.4941 35.9064 64.4941C20.06 64.4941 7.29132 51.7254 7.29132 35.8791C7.29132 20.0327 20.06 7.26397 35.9064 7.26397Z"
                              fill="currentColor"
                            />
                          </svg>
                        </div>
                        <div style={{ fontWeight: "500" }}>
                          {getMessage("analyzeButtonText")}
                        </div>
                        {activePromptMode === "analyze" && (
                          <div
                            style={{
                              position: "absolute",
                              top: "5px",
                              right: "5px",
                              color: theme.accent
                            }}>
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg">
                              <path
                                d="M20 6L9 17L4 12"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </div>
                        )}
                      </ActionButton>

                      <ActionButton
                        selected={activePromptMode === "translate"}
                        onClick={() => setActivePromptMode("translate")}>
                        <div style={{ fontSize: "20px", marginBottom: "4px" }}>
                          <svg
                            width="24"
                            height="24"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth="1.5"
                            stroke="currentColor">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="m10.5 21 5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 0 1 6-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 0 1-3.827-5.802"
                            />
                          </svg>
                        </div>
                        <div style={{ fontWeight: "500" }}>
                          {getMessage("translateButtonText")}
                        </div>
                        {activePromptMode === "translate" && (
                          <div
                            style={{
                              position: "absolute",
                              top: "5px",
                              right: "5px",
                              color: theme.accent
                            }}>
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg">
                              <path
                                d="M20 6L9 17L4 12"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </div>
                        )}
                      </ActionButton>

                      <ActionButton
                        selected={activePromptMode === "challenge"}
                        onClick={() => setActivePromptMode("challenge")}>
                        <div style={{ fontSize: "20px", marginBottom: "4px" }}>
                          <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg">
                            <path
                              d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </div>
                        <div style={{ fontWeight: "500" }}>
                          {getMessage("challengeButtonText") || "Challenge"}
                        </div>
                        {activePromptMode === "challenge" && (
                          <div
                            style={{
                              position: "absolute",
                              top: "5px",
                              right: "5px",
                              color: theme.accent
                            }}>
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg">
                              <path
                                d="M20 6L9 17L4 12"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </div>
                        )}
                      </ActionButton>
                    </div>
                  </SectionContainer>

                  <SectionContainer>
                    <SectionHeader>
                      {getMessage("promptDetailsHeader")}
                    </SectionHeader>
                    <FormDescription>
                      {getMessage("promptDetailsDescription")}
                    </FormDescription>

                    <SectionDivider />

                    <div style={{ marginTop: "16px" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: "8px"
                        }}>
                        <Label>{getMessage("systemPromptLabel")}</Label>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px"
                          }}>
                          {saveSuccess && <SavedSuccessIndicator />}
                          <Button
                            variant="primary"
                            onClick={() => {
                              if (isEditingSystemPrompt) {
                                // Save the edited prompt if it's not a function-based prompt
                                if (
                                  typeof SYSTEM_PROMPTS[activePromptMode] !==
                                  "function"
                                ) {
                                  // Update the system prompts in settings
                                  const updatedSettings = {
                                    ...settings,
                                    customPrompts: {
                                      ...settings.customPrompts,
                                      systemPrompts: {
                                        ...settings.customPrompts
                                          ?.systemPrompts,
                                        [activePromptMode]: editedSystemPrompt
                                      }
                                    }
                                  }

                                  // Update state and storage
                                  setSettings(updatedSettings)
                                  storage.set("settings", updatedSettings)

                                  // Show success feedback
                                  setSaveSuccess(true)
                                  setTimeout(() => setSaveSuccess(false), 2000)
                                }
                                setIsEditingSystemPrompt(false)
                              } else {
                                // Get the current prompt - use custom if available, otherwise default
                                const currentPrompt =
                                  settings.customPrompts?.systemPrompts?.[
                                    activePromptMode
                                  ] ||
                                  (typeof SYSTEM_PROMPTS[activePromptMode] !==
                                  "function"
                                    ? (SYSTEM_PROMPTS[
                                        activePromptMode
                                      ] as string)
                                    : "Cannot edit function-based prompts")

                                setEditedSystemPrompt(currentPrompt)
                                setIsEditingSystemPrompt(true)
                              }
                            }}>
                            {isEditingSystemPrompt
                              ? getMessage("saveButtonText")
                              : getMessage("editButtonText")}
                          </Button>
                        </div>
                      </div>
                      <Description style={{ marginBottom: "12px" }}>
                        {getMessage("systemPromptDescription")}
                      </Description>

                      {isEditingSystemPrompt ? (
                        <FormTextarea
                          value={editedSystemPrompt}
                          onChange={(e) =>
                            setEditedSystemPrompt(e.target.value)
                          }
                          rows={6}
                          style={{
                            backgroundColor: theme.input.background,
                            color: theme.foreground,
                            border: `1px solid ${theme.border}`,
                            borderRadius: "8px",

                            fontFamily: "monospace",
                            fontSize: "14px",
                            width: "100%",
                            resize: "vertical",
                            padding: "19px",
                            lineHeight: "28px"
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            backgroundColor: theme.subcontainer.background,

                            borderRadius: "8px",
                            border: `1px solid ${theme.border}`,
                            color: theme.foreground,
                            fontSize: "14px",
                            fontFamily: "monospace",
                            whiteSpace: "pre-wrap",
                            maxHeight: "120px",
                            overflowY: "auto",
                            padding: "19px",
                            lineHeight: "28px"
                          }}>
                          {typeof SYSTEM_PROMPTS[activePromptMode] ===
                          "function"
                            ? getMessage("functionPromptPlaceholder")
                            : settings.customPrompts?.systemPrompts?.[
                                activePromptMode
                              ] || SYSTEM_PROMPTS[activePromptMode]}
                        </div>
                      )}
                    </div>

                    <div style={{ marginTop: "24px" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: "8px"
                        }}>
                        <Label>{getMessage("userPromptLabel")}</Label>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px"
                          }}>
                          {saveSuccess && <SavedSuccessIndicator />}
                          <Button
                            variant="primary"
                            onClick={() => {
                              if (isEditingUserPrompt) {
                                // Save the edited prompt if it's not a function-based prompt
                                if (
                                  typeof USER_PROMPTS[activePromptMode] !==
                                  "function"
                                ) {
                                  // Update the user prompts in settings
                                  const updatedSettings = {
                                    ...settings,
                                    customPrompts: {
                                      ...settings.customPrompts,
                                      userPrompts: {
                                        ...settings.customPrompts?.userPrompts,
                                        [activePromptMode]: editedUserPrompt
                                      }
                                    }
                                  }

                                  // Update state and storage
                                  setSettings(updatedSettings)
                                  storage.set("settings", updatedSettings)

                                  // Show success feedback
                                  setSaveSuccess(true)
                                  setTimeout(() => setSaveSuccess(false), 2000)
                                }
                                setIsEditingUserPrompt(false)
                              } else {
                                // Get the current prompt - use custom if available, otherwise default
                                const currentPrompt =
                                  settings.customPrompts?.userPrompts?.[
                                    activePromptMode
                                  ] ||
                                  (typeof USER_PROMPTS[activePromptMode] !==
                                  "function"
                                    ? (USER_PROMPTS[activePromptMode] as string)
                                    : getMessage("cannotEditFunctionPrompt"))

                                setEditedUserPrompt(currentPrompt)
                                setIsEditingUserPrompt(true)
                              }
                            }}>
                            {isEditingUserPrompt
                              ? getMessage("saveButtonText")
                              : getMessage("editButtonText")}
                          </Button>
                        </div>
                      </div>
                      <Description style={{ marginBottom: "12px" }}>
                        {getMessage("userPromptDescription")}
                      </Description>

                      {isEditingUserPrompt ? (
                        <FormTextarea
                          value={editedUserPrompt}
                          onChange={(e) => setEditedUserPrompt(e.target.value)}
                          rows={6}
                          style={{
                            backgroundColor: theme.input.background,
                            color: theme.foreground,
                            border: `1px solid ${theme.border}`,
                            borderRadius: "8px",

                            fontFamily: "monospace",
                            fontSize: "14px",
                            width: "100%",
                            resize: "vertical",
                            padding: "19px",
                            lineHeight: "28px"
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            backgroundColor: theme.subcontainer.background,

                            borderRadius: "8px",
                            border: `1px solid ${theme.border}`,
                            color: theme.foreground,
                            fontSize: "14px",
                            fontFamily: "monospace",
                            whiteSpace: "pre-wrap",
                            maxHeight: "120px",
                            overflowY: "auto",
                            padding: "19px",
                            lineHeight: "28px"
                          }}>
                          {(() => {
                            const promptValue =
                              settings.customPrompts?.userPrompts?.[
                                activePromptMode
                              ]
                            if (promptValue) return promptValue
                            const defaultPrompt = USER_PROMPTS[activePromptMode]
                            return typeof defaultPrompt === "string"
                              ? defaultPrompt
                              : getMessage("dynamicTemplatePlaceholder")
                          })()}
                        </div>
                      )}
                    </div>

                    {/* Reset Template Section */}
                    <div
                      style={{
                        marginTop: "32px",
                        padding: "16px",
                        backgroundColor: theme.subcontainer.background,
                        borderRadius: "8px",
                        border: `1px solid ${theme.border}`
                      }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center"
                        }}>
                        <div>
                          <Label>{getMessage("resetTemplateLabel")}</Label>
                          <Description style={{ marginTop: "4px" }}>
                            {getMessage("resetTemplateDescription", [
                              activePromptMode
                            ])}
                          </Description>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px"
                          }}>
                          {saveSuccess && (
                            <SavedSuccessIndicator
                              message={getMessage("resetSuccessText")}
                            />
                          )}
                          <Button
                            variant="destructive"
                            onClick={() => {
                              const updatedSettings = {
                                ...settings,
                                customPrompts: {
                                  ...settings.customPrompts,
                                  systemPrompts: {
                                    ...settings.customPrompts?.systemPrompts,
                                    [activePromptMode]: undefined
                                  },
                                  userPrompts: {
                                    ...settings.customPrompts?.userPrompts,
                                    [activePromptMode]: undefined
                                  }
                                }
                              }

                              setSettings(updatedSettings)
                              storage.set("settings", updatedSettings)

                              setSaveSuccess(true)
                              setTimeout(() => setSaveSuccess(false), 2000)
                            }}>
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                              style={{ marginRight: "6px" }}>
                              <path
                                d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14zM10 11v6M14 11v6"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                            {getMessage("resetToDefaultButtonText")}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </SectionContainer>
                </div>
              </SettingsCard>

              {/* No popup notification - we use inline notifications instead */}

              {/* Instructions for applying templates */}
              <div
                style={{
                  marginTop: "24px",
                  padding: "12px 16px",
                  backgroundColor: theme.subcontainer.background,
                  borderRadius: "8px",
                  border: `1px solid ${theme.border}`
                }}>
                <p
                  style={{
                    fontSize: "14px",
                    color: theme.foreground,
                    margin: "0 0 8px 0"
                  }}>
                  <strong>{getMessage("templateApplicationNote")}</strong>
                </p>
                <ul
                  style={{
                    fontSize: "14px",
                    color: theme.secondaryText,
                    margin: "0",
                    paddingLeft: "16px"
                  }}>
                  {getMessage("templateApplicationInstructions")
                    .split("\n")
                    .map((instruction, index) => (
                      <li
                        key={index}
                        style={{ marginBottom: index < 2 ? "4px" : "0" }}>
                        {instruction}
                      </li>
                    ))}
                </ul>
              </div>
            </div>
          )}

          {activeTab === "customization" && (
            <div key="customization">
              <SettingsCard
                title={getMessage("customizationTabTitle")}
                icon={null}>
                <SectionContainer>
                  <SectionHeader>
                    {getMessage("appearanceSectionHeader")}
                  </SectionHeader>

                  <div>
                    <Label>{getMessage("themeLabel")}</Label>
                    <Description>{getMessage("themeDescription")}</Description>

                    <div
                      style={{
                        display: "flex",
                        gap: "12px",
                        marginTop: "16px"
                      }}>
                      <ThemeButton
                        selected={settings.customization?.theme === "dark"}
                        onClick={() =>
                          handleImmediateSettingUpdate("theme", "dark")
                        }>
                        <ThemeIcon>
                          <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg">
                            <path
                              d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </ThemeIcon>
                        <div>{getMessage("darkThemeText")}</div>
                      </ThemeButton>

                      <ThemeButton
                        selected={settings.customization?.theme === "light"}
                        onClick={() =>
                          handleImmediateSettingUpdate("theme", "light")
                        }>
                        <ThemeIcon>
                          <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg">
                            <path
                              d="M12 17C14.7614 17 17 14.7614 17 12C17 9.23858 14.7614 7 12 7C9.23858 7 7 9.23858 7 12C7 14.7614 9.23858 17 12 17Z"
                              fill="currentColor"
                            />
                            <path
                              d="M12 1V3M12 21V23M4.22 4.22L5.64 5.64M18.36 18.36L19.78 19.78M1 12H3M21 12H23M4.22 19.78L5.64 18.36M18.36 5.64L19.78 4.22"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </ThemeIcon>
                        <div>{getMessage("lightThemeText")}</div>
                      </ThemeButton>

                      <ThemeButton
                        selected={settings.customization?.theme === "system"}
                        onClick={() =>
                          handleImmediateSettingUpdate("theme", "system")
                        }>
                        <ThemeIcon>
                          <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg">
                            <rect
                              x="2"
                              y="4"
                              width="20"
                              height="15"
                              rx="2"
                              stroke="currentColor"
                              strokeWidth="2"
                            />
                            <path
                              d="M8 19V21"
                              stroke="currentColor"
                              strokeWidth="2"
                            />
                            <path
                              d="M16 19V21"
                              stroke="currentColor"
                              strokeWidth="2"
                            />
                            <path
                              d="M8 21H16"
                              stroke="currentColor"
                              strokeWidth="2"
                            />
                          </svg>
                        </ThemeIcon>
                        <div>{getMessage("systemDefaultThemeText")}</div>
                      </ThemeButton>
                    </div>
                  </div>

                  <div style={{ marginTop: "32px" }}>
                    <Label>{getMessage("languageLabel")}</Label>
                    <Description>{getMessage("languageDesc")}</Description>

                    <div style={{ marginTop: "16px", maxWidth: "240px" }}>
                      <LanguageSelector
                        onChange={(newLocale) => {
                          changeLocale(newLocale)
                            .then(() => {
                              notifySuccess(getMessage("languageChanged"))
                            })
                            .catch((error) => {
                              console.error("Error changing locale:", error)
                              notifyError(getMessage("languageChangeError"))
                            })
                        }}
                      />
                    </div>
                  </div>

                  <SectionDivider />

                  <div style={{ marginTop: "32px" }}>
                    <Label>{getMessage("fontSizeLabel")}</Label>
                    <Description>
                      {getMessage("fontSizeDescription")}
                    </Description>

                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "12px",
                        marginTop: "16px"
                      }}>
                      <FontSizeButton
                        selected={
                          settings.customization?.fontSize === "x-small"
                        }
                        onClick={() =>
                          handleImmediateSettingUpdate("fontSize", "x-small")
                        }>
                        <div
                          className="size-preview"
                          style={{ fontSize: "13px" }}>
                          Aa
                        </div>
                        <div className="size-label">
                          {getMessage("fontSizeXSmall")}
                        </div>
                      </FontSizeButton>

                      <FontSizeButton
                        selected={settings.customization?.fontSize === "small"}
                        onClick={() =>
                          handleImmediateSettingUpdate("fontSize", "small")
                        }>
                        <div
                          className="size-preview"
                          style={{ fontSize: "14px" }}>
                          Aa
                        </div>
                        <div className="size-label">
                          {getMessage("fontSizeSmall")}
                        </div>
                      </FontSizeButton>

                      <FontSizeButton
                        selected={settings.customization?.fontSize === "medium"}
                        onClick={() =>
                          handleImmediateSettingUpdate("fontSize", "medium")
                        }>
                        <div
                          className="size-preview"
                          style={{ fontSize: "16px" }}>
                          Aa
                        </div>
                        <div className="size-label">
                          {getMessage("fontSizeMedium")}
                        </div>
                      </FontSizeButton>

                      <FontSizeButton
                        selected={settings.customization?.fontSize === "large"}
                        onClick={() =>
                          handleImmediateSettingUpdate("fontSize", "large")
                        }>
                        <div
                          className="size-preview"
                          style={{ fontSize: "18px" }}>
                          Aa
                        </div>
                        <div className="size-label">
                          {getMessage("fontSizeLarge")}
                        </div>
                      </FontSizeButton>

                      <FontSizeButton
                        selected={
                          settings.customization?.fontSize === "x-large"
                        }
                        onClick={() =>
                          handleImmediateSettingUpdate("fontSize", "x-large")
                        }>
                        <div
                          className="size-preview"
                          style={{ fontSize: "21px" }}>
                          Aa
                        </div>
                        <div className="size-label">
                          {getMessage("fontSizeXLarge")}
                        </div>
                      </FontSizeButton>

                      <FontSizeButton
                        selected={
                          settings.customization?.fontSize === "xx-large"
                        }
                        onClick={() =>
                          handleImmediateSettingUpdate("fontSize", "xx-large")
                        }>
                        <div
                          className="size-preview"
                          style={{ fontSize: "23px" }}>
                          Aa
                        </div>
                        <div className="size-label">
                          {getMessage("fontSizeXXLarge")}
                        </div>
                      </FontSizeButton>
                    </div>
                  </div>

                  <div style={{ marginTop: "32px" }}>
                    <Label>{getMessage("highlightColorLabel")}</Label>
                    <Description>
                      {getMessage("highlightColorDescription")}
                    </Description>

                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "12px",
                        marginTop: "16px"
                      }}>
                      {[
                        {
                          value: "default",
                          label: getMessage("colorDefault"),
                          color:
                            "linear-gradient(45deg, rgb(211, 232, 255), rgb(197, 225, 255))"
                        },
                        {
                          value: "yellow",
                          label: getMessage("colorYellow"),
                          color: "#fff8bc"
                        },
                        {
                          value: "orange",
                          label: getMessage("colorOrange"),
                          color: "#FFBF5A"
                        },
                        {
                          value: "blue",
                          label: getMessage("colorBlue"),
                          color: "#93C5FD"
                        },
                        {
                          value: "green",
                          label: getMessage("colorGreen"),
                          color: "#86EFAC"
                        },
                        {
                          value: "purple",
                          label: getMessage("colorPurple"),
                          color: "#C4B5FD"
                        },
                        {
                          value: "pink",
                          label: getMessage("colorPink"),
                          color: "#FDA4AF"
                        }
                      ].map((colorOption) => (
                        <div
                          key={colorOption.value}
                          style={{
                            width: "75px",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: "8px"
                          }}>
                          <div
                            onClick={() =>
                              handleImmediateSettingUpdate(
                                "highlightColor",
                                colorOption.value
                              )
                            }
                            style={{
                              width: "36px",
                              height: "36px",
                              borderRadius: "50%",
                              background: colorOption.color,
                              backgroundColor:
                                colorOption.value === "default"
                                  ? undefined
                                  : colorOption.color,
                              border:
                                colorOption.value ===
                                settings.customization?.highlightColor
                                  ? `2px solid ${theme.accent}`
                                  : "2px solid transparent",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              transition: "all 0.2s ease-in-out"
                            }}>
                            {colorOption.value ===
                              settings.customization?.highlightColor && (
                              <svg
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                style={{ color: theme.foreground }}>
                                <path
                                  d="M5 13l4 4L19 7"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            )}
                          </div>
                          <span
                            style={{
                              fontSize: "12px",
                              color: theme.secondaryText
                            }}>
                            {colorOption.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </SectionContainer>
                <SectionContainer>
                  <SectionHeader>
                    {getMessage("animationSettingsHeader")}
                  </SectionHeader>
                  <FormGroup>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                      }}>
                      <FormLabel htmlFor="popupAnimation">
                        {getMessage("popupAnimationLabel")}
                      </FormLabel>
                      <SelectDropdown
                        value={settings.customization?.popupAnimation || "fade"}
                        onChange={(value) =>
                          handleImmediateSettingUpdate(
                            "popupAnimation",
                            value
                          )
                        }
                        options={[
                          { value: "fade", label: getMessage("animationFade") },
                          { value: "slide", label: getMessage("animationSlide") },
                          { value: "scale", label: getMessage("animationScale") },
                          { value: "none", label: getMessage("animationNone") }
                        ]}
                        ariaLabel={getMessage("popupAnimationLabel")}
                        style={{ minWidth: "140px" }}
                      />
                    </div>
                    <FormDescription>
                      {getMessage("popupAnimationDescription")}
                    </FormDescription>
                  </FormGroup>
                </SectionContainer>
              </SettingsCard>
            </div>
          )}

          {activeTab === "about" && (
            <div key="about">
              <SettingsCard title={getMessage("aboutTabTitle")} icon={null}>
                <SectionContainer>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      marginBottom: "24px"
                    }}>
                    <img
                      src={logoUrl}
                      alt="LightUp Logo"
                      style={{
                        width: "48px",
                        height: "48px",
                        marginRight: "16px",
                        borderRadius: "12px",
                        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)"
                      }}
                    />
                    <div>
                      <h2
                        style={{
                          fontSize: "24px",
                          fontWeight: 700,
                          margin: 0,
                          color: theme.foreground
                        }}>
                        LightUp
                      </h2>
                      <p
                        style={{
                          fontSize: "16px",
                          color: theme.secondaryText,
                          margin: "4px 0 0 0"
                        }}>
                        {getMessage("aboutSubtitle")}
                      </p>
                    </div>
                  </div>

                  <FormDescription
                    style={{
                      marginBottom: "24px",
                      fontSize: "15px",
                      lineHeight: "1.6"
                    }}>
                    {getMessage("aboutDescription")}
                  </FormDescription>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(250px, 1fr))",
                      gap: "16px",
                      marginBottom: "24px"
                    }}>
                    <div
                      style={{
                        padding: "16px",
                        background: "rgba(45, 202, 110, 0.08)",
                        borderRadius: "8px",
                        border: "1px solid rgba(45, 202, 110, 0.2)"
                      }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          marginBottom: "8px"
                        }}>
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          style={{ marginRight: "8px", color: theme.accent }}>
                          <path
                            d="M4 6h16M4 12h16M4 18h7"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <span
                          style={{
                            fontWeight: 600,
                            color: theme.foreground,
                            fontSize: "14px"
                          }}>
                          {getMessage("featureInstantSummaries")}
                        </span>
                      </div>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "13px",
                          color: theme.secondaryText
                        }}>
                        {getMessage("featureInstantSummariesDesc")}
                      </p>
                    </div>

                    <div
                      style={{
                        padding: "16px",
                        background: "rgba(0, 120, 212, 0.08)",
                        borderRadius: "8px",
                        border: "1px solid rgba(0, 120, 212, 0.2)"
                      }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          marginBottom: "8px"
                        }}>
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          style={{ marginRight: "8px", color: theme.primary }}>
                          <path
                            d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <span
                          style={{
                            fontWeight: 600,
                            color: theme.foreground,
                            fontSize: "14px"
                          }}>
                          {getMessage("featureTranslation")}
                        </span>
                      </div>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "13px",
                          color: theme.secondaryText
                        }}>
                        {getMessage("featureTranslationDesc")}
                      </p>
                    </div>

                    <div
                      style={{
                        padding: "16px",
                        background: "rgba(156, 39, 176, 0.08)",
                        borderRadius: "8px",
                        border: "1px solid rgba(156, 39, 176, 0.2)"
                      }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          marginBottom: "8px"
                        }}>
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          style={{ marginRight: "8px", color: theme.primary }}>
                          <path
                            d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <span
                          style={{
                            fontWeight: 600,
                            color: theme.foreground,
                            fontSize: "14px"
                          }}>
                          {getMessage("featureAdvancedModels")}
                        </span>
                      </div>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "13px",
                          color: theme.secondaryText
                        }}>
                        {getMessage("featureAdvancedModelsDesc")}
                      </p>
                    </div>

                    <div
                      style={{
                        padding: "16px",
                        background: "rgba(255, 193, 7, 0.08)",
                        borderRadius: "8px",
                        border: "1px solid rgba(255, 193, 7, 0.2)"
                      }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          marginBottom: "8px"
                        }}>
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          style={{
                            marginRight: "8px",
                            color: theme.validation.warning
                          }}>
                          <path
                            d="M8 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0M19 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0M3 21l1.65 -3.8a9 9 0 1 1 3.4 2.9L3 21"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <span
                          style={{
                            fontWeight: 600,
                            color: theme.foreground,
                            fontSize: "14px"
                          }}>
                          {getMessage("featureInteractiveChat")}
                        </span>
                      </div>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "13px",
                          color: theme.secondaryText
                        }}>
                        {getMessage("featureInteractiveChatDesc")}
                      </p>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                      marginBottom: "24px"
                    }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px"
                      }}>
                      <span
                        style={{
                          color: theme.secondaryText,
                          fontSize: "14px",
                          fontWeight: 500,
                          minWidth: "80px"
                        }}>
                        {getMessage("aboutVersion")}
                      </span>
                      <Badge variant="info">v0.1.18</Badge>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px"
                      }}>
                      <span
                        style={{
                          color: theme.secondaryText,
                          fontSize: "14px",
                          fontWeight: 500,
                          minWidth: "80px"
                        }}>
                        {getMessage("aboutDeveloper")}
                      </span>
                      <span
                        style={{ color: theme.foreground, fontSize: "14px" }}>
                        Moe Sadiq
                      </span>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px"
                      }}>
                      <span
                        style={{
                          color: theme.secondaryText,
                          fontSize: "14px",
                          fontWeight: 500,
                          minWidth: "80px"
                        }}>
                        {getMessage("aboutWebsite")}
                      </span>
                      <a
                        href="https://www.boimaginations.com/lightup"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: theme.primary,
                          textDecoration: "none",
                          fontSize: "14px",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px"
                        }}
                        onMouseOver={(e) =>
                          (e.currentTarget.style.textDecoration = "underline")
                        }
                        onMouseOut={(e) =>
                          (e.currentTarget.style.textDecoration = "none")
                        }>
                        boimaginations.com/lightup
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg">
                          <path
                            d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6m4-3h6v6m-11 5L21 3"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </a>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px"
                      }}>
                      <span
                        style={{
                          color: theme.secondaryText,
                          fontSize: "14px",
                          fontWeight: 500,
                          minWidth: "80px"
                        }}>
                        {getMessage("contact")}:
                      </span>
                      <a
                        href="mailto:boimaginations@gmail.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: theme.primary,
                          textDecoration: "none",
                          fontSize: "14px"
                        }}
                        onMouseOver={(e) =>
                          (e.currentTarget.style.textDecoration = "underline")
                        }
                        onMouseOut={(e) =>
                          (e.currentTarget.style.textDecoration = "none")
                        }>
                        boimaginations@gmail.com
                      </a>
                    </div>
                  </div>
                </SectionContainer>

                <SectionDivider />

                <SectionContainer>
                  <SectionHeader>{getMessage("feedbackTitle")}</SectionHeader>
                  <FormDescription style={{ marginBottom: "16px" }}>
                    {getMessage("feedbackDesc")}
                  </FormDescription>

                  <Button
                    variant="primary"
                    onClick={() =>
                      window.open("https://boi.featurebase.app/", "_blank")
                    }
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "16px"
                    }}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                      stroke="currentColor"
                      style={{ width: "20px", height: "20px" }}>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z"
                      />
                    </svg>
                    {getMessage("feedbackLabel")}
                  </Button>
                </SectionContainer>

                <SectionDivider />

                <SectionContainer>
                  <SectionHeader>{getMessage("privacyTitle")}</SectionHeader>
                  <FormDescription style={{ marginBottom: "16px" }}>
                    {getMessage("privacyDesc")}
                  </FormDescription>

                  <div
                    style={{
                      background: theme.subcontainer.background,
                      borderRadius: "8px",
                      padding: "24px",
                      marginTop: "16px",
                      border: `1px solid ${theme.border}`
                    }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        marginBottom: "24px"
                      }}>
                      <svg
                        width="28"
                        height="28"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        strokeWidth="1.5"
                        stroke="currentColor"
                        style={{ marginRight: "12px", color: theme.accent }}>
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"
                        />
                      </svg>
                      <h3
                        style={{
                          fontSize: "20px",
                          fontWeight: 600,
                          margin: 0,
                          color: theme.foreground
                        }}>
                        {getMessage("zeroDataCollectionTitle")}
                      </h3>
                    </div>

                    <div
                      style={{
                        fontSize: "14px",
                        color: theme.secondaryText,
                        lineHeight: "1.6",
                        marginBottom: "28px"
                      }}>
                      <p style={{ margin: "0 0 20px 0", fontSize: "15px" }}>
                        {getMessage("privacyMainText")}
                      </p>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(280px, 1fr))",
                        gap: "18px",
                        marginBottom: "32px"
                      }}>
                      <div
                        style={{
                          padding: "20px",
                          background: "rgba(45, 202, 110, 0.08)",
                          borderRadius: "10px",
                          border: "1px solid rgba(45, 202, 110, 0.2)"
                        }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            marginBottom: "12px"
                          }}>
                          <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            style={{
                              marginRight: "10px",
                              color: theme.accent
                            }}>
                            <path
                              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          <span
                            style={{
                              fontWeight: 600,
                              color: theme.foreground,
                              fontSize: "16px"
                            }}>
                            {getMessage("localStorageTitle")}
                          </span>
                        </div>
                        <p
                          style={{
                            margin: 0,
                            fontSize: "14px",
                            color: theme.secondaryText,
                            lineHeight: "1.5"
                          }}>
                          {getMessage("localStorageDesc")}
                        </p>
                      </div>

                      <div
                        style={{
                          padding: "20px",
                          background: "rgba(0, 120, 212, 0.08)",
                          borderRadius: "10px",
                          border: "1px solid rgba(0, 120, 212, 0.2)"
                        }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            marginBottom: "12px"
                          }}>
                          <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            style={{
                              marginRight: "10px",
                              color: theme.primary
                            }}>
                            <path
                              d="M13 10V3L4 14h7v7l9-11h-7z"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          <span
                            style={{
                              fontWeight: 600,
                              color: theme.foreground,
                              fontSize: "16px"
                            }}>
                            {getMessage("directProcessing")}
                          </span>
                        </div>
                        <p
                          style={{
                            margin: 0,
                            fontSize: "14px",
                            color: theme.secondaryText,
                            lineHeight: "1.5"
                          }}>
                          {getMessage("directProcessingDesc")}
                        </p>
                      </div>

                      <div
                        style={{
                          padding: "20px",
                          background: "rgba(156, 39, 176, 0.08)",
                          borderRadius: "10px",
                          border: "1px solid rgba(156, 39, 176, 0.2)"
                        }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            marginBottom: "12px"
                          }}>
                          <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            style={{
                              marginRight: "10px",
                              color: theme.primary
                            }}>
                            <path
                              d="M18.364 5.636L16.95 7.05A7 7 0 1019 12h2a9 9 0 11-2.636-6.364z"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <path
                              d="M12 6v6l4 2"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          <span
                            style={{
                              fontWeight: 600,
                              color: theme.foreground,
                              fontSize: "16px"
                            }}>
                            {getMessage("noTracking")}
                          </span>
                        </div>
                        <p
                          style={{
                            margin: 0,
                            fontSize: "14px",
                            color: theme.secondaryText,
                            lineHeight: "1.5"
                          }}>
                          {getMessage("noTrackingDesc")}
                        </p>
                      </div>

                      <div
                        style={{
                          padding: "20px",
                          background: "rgba(255, 193, 7, 0.08)",
                          borderRadius: "10px",
                          border: "1px solid rgba(255, 193, 7, 0.2)"
                        }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            marginBottom: "12px"
                          }}>
                          <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            style={{
                              marginRight: "10px",
                              color: theme.validation.warning
                            }}>
                            <path
                              d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <rect
                              x="8"
                              y="2"
                              width="8"
                              height="4"
                              rx="1"
                              ry="1"
                              stroke="currentColor"
                              strokeWidth="2"
                              fill="none"
                            />
                          </svg>
                          <span
                            style={{
                              fontWeight: 600,
                              color: theme.foreground,
                              fontSize: "16px"
                            }}>
                            {getMessage("yourControl")}
                          </span>
                        </div>
                        <p
                          style={{
                            margin: 0,
                            fontSize: "14px",
                            color: theme.secondaryText,
                            lineHeight: "1.5"
                          }}>
                          {getMessage("yourControlDesc")}
                        </p>
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        gap: "12px",
                        marginTop: "24px",
                        flexWrap: "wrap"
                      }}>
                      <Button
                        variant="primary"
                        onClick={() =>
                          window.open(
                            "https://www.boimaginations.com/lightup/privacy-policy",
                            "_blank"
                          )
                        }
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          minWidth: "140px"
                        }}>
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg">
                          <path
                            d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6m4-3h6v6m-11 5L21 3"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        Full Policy
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() =>
                          window.open(
                            "mailto:boimaginations@gmail.com?subject=Privacy Inquiry - LightUp Extension",
                            "_blank"
                          )
                        }
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          minWidth: "120px"
                        }}>
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg">
                          <path
                            d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <polyline
                            points="22,6 12,13 2,6"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        Contact
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={async () => {
                          const confirmed = confirm(
                            "This will permanently delete ALL LightUp extension data including:\n\n" +
                              "• API keys and credentials\n" +
                              "• All settings and preferences\n" +
                              "• Theme and customization settings\n" +
                              "This action cannot be undone. Are you sure you want to continue?"
                          )

                          if (confirmed) {
                            try {
                              // Clear chrome storage with proper error handling
                              await new Promise<void>((resolve, reject) => {
                                chrome.storage.local.clear(() => {
                                  if (chrome.runtime.lastError) {
                                    reject(chrome.runtime.lastError)
                                  } else {
                                    resolve()
                                  }
                                })
                              })

                              await new Promise<void>((resolve, reject) => {
                                chrome.storage.sync.clear(() => {
                                  if (chrome.runtime.lastError) {
                                    reject(chrome.runtime.lastError)
                                  } else {
                                    resolve()
                                  }
                                })
                              })

                              // Clear session storage if available
                              if (chrome.storage.session) {
                                await new Promise<void>((resolve, reject) => {
                                  chrome.storage.session.clear(() => {
                                    if (chrome.runtime.lastError) {
                                      reject(chrome.runtime.lastError)
                                    } else {
                                      resolve()
                                    }
                                  })
                                })
                              }

                              // Clear any background script caches
                              try {
                                await chrome.runtime.sendMessage({
                                  action: "clearAllData"
                                })
                              } catch (e) {
                                console.log(
                                  "Background script not available for clearing"
                                )
                              }

                              alert(
                                "✅ All LightUp extension data has been successfully cleared!\n\nThe page will reload to reflect the changes."
                              )
                              window.location.reload()
                            } catch (error) {
                              console.error("Error clearing data:", error)
                              alert(
                                "❌ Error clearing data: " +
                                  error.message +
                                  "\n\nPlease try again or contact support."
                              )
                            }
                          }
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          backgroundColor: "rgba(231, 76, 60, 0.08)",
                          borderColor: "rgba(231, 76, 60, 0.3)",
                          color: theme.destructive,
                          minWidth: "140px",
                          fontWeight: 500
                        }}>
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg">
                          <path
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        {getMessage("clearAllDataButton")}
                      </Button>
                    </div>
                  </div>
                </SectionContainer>
              </SettingsCard>
            </div>
          )}

          {error && <ErrorMessage message={error} />}

          {activeTab !== "about" && (
            <div
              style={{
                marginTop: "24px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "12px"
              }}>
              <AutoSaveStatus status={autoSaveStatus}>
                {autoSaveStatus === "saving" && (
                  <>
                    <LoadingSpinner />
                    Auto-saving...
                  </>
                )}
                {autoSaveStatus === "saved" && (
                  <>
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 20 20"
                      fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Auto-saved
                  </>
                )}
                {autoSaveStatus === "error" && (
                  <>
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 20 20"
                      fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Auto-save failed
                  </>
                )}
              </AutoSaveStatus>

              <div
                style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <EnhancedSaveButton
                  variant="primary"
                  onClick={handleSave}
                  disabled={isSaving || !hasUnsavedChanges}
                  hasUnsavedChanges={hasUnsavedChanges}>
                  {isSaving ? (
                    <>
                      <LoadingSpinner />
                      Saving...
                    </>
                  ) : hasUnsavedChanges ? (
                    "Save Changes"
                  ) : (
                    "All Changes Saved"
                  )}
                </EnhancedSaveButton>
              </div>
            </div>
          )}
        </ContentArea>
      </ContentWrapper>

      {/* Notification Outlet */}
      <NotificationOutlet />

      {/* Unsaved Changes Indicator */}
      <UnsavedChangesIndicator
        visible={hasUnsavedChanges && autoSaveStatus !== "saving"}>
        <svg
          width="16"
          height="16"
          viewBox="0 0 20 20"
          fill="currentColor"
          style={{ marginRight: "3px", marginTop: "4px" }}>
          <path
            fillRule="evenodd"
            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
        You have unsaved changes
      </UnsavedChangesIndicator>
    </OptionsContainer>
  )
}

export default IndexOptions
