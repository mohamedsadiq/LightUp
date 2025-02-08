import { useState, useEffect } from "react"
import { RateLimitService } from "../services/rateLimit"
import { Storage } from "@plasmohq/storage"
import type { Settings } from "~types/settings"

interface UseRateLimitReturn {
  remainingActions: number;
  isLoading: boolean;
  error: string | null;
  refreshRateLimit: () => Promise<void>;
}

export const useRateLimit = (): UseRateLimitReturn => {
  const [remainingActions, setRemainingActions] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const rateLimitService = new RateLimitService()
  
  const loadRateLimit = async () => {
    try {
      setIsLoading(true)
      const remaining = await rateLimitService.getRemainingActions()
      setRemainingActions(remaining)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load rate limit info")
    } finally {
      setIsLoading(false)
    }
  }
  
  useEffect(() => {
    loadRateLimit()
    
    // Watch for settings changes
    const storage = new Storage()
    const handleSettingsChange = async () => {
      const settings = await storage.get("settings") as Settings
      if (settings?.rateLimit) {
        setRemainingActions(settings.rateLimit.actionsRemaining)
      }
    }
    
    storage.watch({
      settings: handleSettingsChange
    })
    
    return () => {
      storage.unwatch({
        settings: handleSettingsChange
      })
    }
  }, [])
  
  return {
    remainingActions,
    isLoading,
    error,
    refreshRateLimit: loadRateLimit
  }
} 