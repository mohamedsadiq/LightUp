import type { LocalModel } from "~types/settings"
import { LOCAL_MODELS_METADATA } from "~config/localModels"

// Hardware tier recommendations based on system resources
export interface HardwareProfile {
  vram: number // in GB
  ram: number // in GB
  tier: "low" | "mid" | "high" | "ultra"
}

// Use case categories
export type UseCase = 
  | "general"
  | "coding"
  | "reasoning"
  | "math"
  | "chat"
  | "mobile"
  | "enterprise"
  | "research"

// Get recommended models based on hardware profile
export const getRecommendedModelsByHardware = (profile: HardwareProfile): LocalModel[] => {
  const { tier } = profile
  
  return Object.entries(LOCAL_MODELS_METADATA)
    .filter(([_, metadata]) => metadata.hardwareTier === tier)
    .sort((a, b) => {
      // Sort by quality (excellent > good > fair)
      const qualityOrder = { excellent: 0, good: 1, fair: 2 }
      const aQuality = qualityOrder[a[1].quality]
      const bQuality = qualityOrder[b[1].quality]
      if (aQuality !== bQuality) return aQuality - bQuality
      
      // Then by speed (fast > medium > slow)
      const speedOrder = { fast: 0, medium: 1, slow: 2 }
      const aSpeed = speedOrder[a[1].speed]
      const bSpeed = speedOrder[b[1].speed]
      return aSpeed - bSpeed
    })
    .map(([model]) => model as LocalModel)
}

// Get recommended models based on use case
export const getRecommendedModelsByUseCase = (useCase: UseCase): LocalModel[] => {
  const useCaseMap: Record<UseCase, string[]> = {
    general: ["General tasks", "Everyday tasks", "Professional work", "Content creation"],
    coding: ["Programming", "Code generation", "Debugging", "Large codebases"],
    reasoning: ["Reasoning tasks", "Problem solving", "Complex problems", "Math"],
    math: ["Mathematics", "Scientific computing", "Quick math"],
    chat: ["Chat", "Conversational AI", "Quick responses"],
    mobile: ["Mobile devices", "Edge devices", "Quick tasks", "Low latency"],
    enterprise: ["Enterprise", "Maximum performance", "Research"],
    research: ["Research", "Maximum performance", "Complex reasoning"]
  }
  
  const keywords = useCaseMap[useCase] || []
  
  return Object.entries(LOCAL_MODELS_METADATA)
    .filter(([_, metadata]) => 
      metadata.recommendedFor.some(rec => 
        keywords.some(keyword => 
          rec.toLowerCase().includes(keyword.toLowerCase())
        )
      )
    )
    .sort((a, b) => {
      // Sort by quality first
      const qualityOrder = { excellent: 0, good: 1, fair: 2 }
      const aQuality = qualityOrder[a[1].quality]
      const bQuality = qualityOrder[b[1].quality]
      if (aQuality !== bQuality) return aQuality - bQuality
      
      // Then by speed
      const speedOrder = { fast: 0, medium: 1, slow: 2 }
      const aSpeed = speedOrder[a[1].speed]
      const bSpeed = speedOrder[b[1].speed]
      return aSpeed - bSpeed
    })
    .map(([model]) => model as LocalModel)
}

// Get top 3 recommended models for a specific use case and hardware
export const getTopRecommendations = (
  useCase: UseCase,
  profile?: HardwareProfile
): LocalModel[] => {
  let candidates = getRecommendedModelsByUseCase(useCase)
  
  // Filter by hardware tier if profile is provided
  if (profile) {
    const tierFiltered = candidates.filter(model => 
      LOCAL_MODELS_METADATA[model].hardwareTier === profile.tier
    )
    if (tierFiltered.length > 0) {
      candidates = tierFiltered
    }
  }
  
  return candidates.slice(0, 3)
}

// Detect hardware profile (simplified - in real app would use actual system detection)
export const detectHardwareProfile = (): HardwareProfile => {
  // This is a placeholder - in a real implementation, you would:
  // 1. Use WebGPU to detect actual VRAM
  // 2. Use navigator.deviceMemory for system RAM
  // 3. Consider CPU cores and other factors
  
  const vram = 8 // Default assumption
  const ram = 16 // Default assumption
  
  if (vram >= 40) {
    return { vram, ram, tier: "ultra" }
  } else if (vram >= 20) {
    return { vram, ram, tier: "high" }
  } else if (vram >= 8) {
    return { vram, ram, tier: "mid" }
  } else {
    return { vram, ram, tier: "low" }
  }
}

// Get model compatibility info
export const getModelCompatibility = (model: LocalModel): {
  compatible: boolean
  reason?: string
  recommended?: boolean
} => {
  const metadata = LOCAL_MODELS_METADATA[model]
  const profile = detectHardwareProfile()
  
  // Check if model fits in hardware tier
  const tierOrder = { low: 0, mid: 1, high: 2, ultra: 3 }
  const profileTier = tierOrder[profile.tier]
  const modelTier = tierOrder[metadata.hardwareTier]
  
  if (modelTier > profileTier) {
    return {
      compatible: false,
      reason: `Requires ${metadata.vramRequired}, your system has ${profile.vram}GB VRAM`
    }
  }
  
  // Check if it's a good match (same tier or one below)
  if (modelTier === profileTier || modelTier === profileTier - 1) {
    return {
      compatible: true,
      recommended: true
    }
  }
  
  return {
    compatible: true,
    recommended: false
  }
}

// Get smart default model for new users
export const getSmartDefaultModel = (): LocalModel => {
  const profile = detectHardwareProfile()
  const recommendations = getRecommendedModelsByHardware(profile)
  
  // Prefer general purpose models for new users
  const generalModels = recommendations.filter(model => 
    LOCAL_MODELS_METADATA[model].category === "general"
  )
  
  return generalModels[0] || "llama-3.3-8b" as LocalModel
}
