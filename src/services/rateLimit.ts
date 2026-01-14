import { Storage } from "@plasmohq/storage"
import type { Settings, RateLimit } from "~types/settings"

// Default maximum number of actions allowed per day
const DEFAULT_DAILY_LIMIT = 80

// In-memory cache to avoid repeated storage reads (cache expires after 5 seconds)
let cachedRateLimit: RateLimit | null = null
let cacheTimestamp = 0
const CACHE_TTL_MS = 5000

export class RateLimitService {
  private storage: Storage

  constructor() {
    this.storage = new Storage()
  }

  private async getRateLimit(): Promise<RateLimit> {
    // Return cached value if fresh (within 5 seconds)
    const now = Date.now()
    if (cachedRateLimit && (now - cacheTimestamp) < CACHE_TTL_MS) {
      return cachedRateLimit
    }

    const settings = await this.storage.get("settings") as Settings
    if (!settings?.rateLimit) {
      // Initialize rate limit if it doesn't exist
      const rateLimit: RateLimit = {
        actionsRemaining: DEFAULT_DAILY_LIMIT,
        lastResetDate: new Date().toISOString(),
        dailyLimit: DEFAULT_DAILY_LIMIT
      }
      await this.storage.set("settings", {
        ...settings,
        rateLimit
      })
      // Update cache
      cachedRateLimit = rateLimit
      cacheTimestamp = Date.now()
      return rateLimit
    }
    // Update cache
    cachedRateLimit = settings.rateLimit
    cacheTimestamp = Date.now()
    return settings.rateLimit
  }

  private shouldResetLimit(lastResetDate: string): boolean {
    const lastReset = new Date(lastResetDate)
    const now = new Date()
    
    // Reset if it's a different day
    return lastReset.toDateString() !== now.toDateString()
  }

  public async checkActionAvailable(): Promise<boolean> {
    const rateLimit = await this.getRateLimit()
    
    if (this.shouldResetLimit(rateLimit.lastResetDate)) {
      // Reset the counter for a new day
      await this.resetLimit()
      return true
    }
    
    return rateLimit.actionsRemaining > 0
  }

  public async useAction(): Promise<number> {
    const settings = await this.storage.get("settings") as Settings
    const rateLimit = settings?.rateLimit || await this.getRateLimit()
    
    if (this.shouldResetLimit(rateLimit.lastResetDate)) {
      await this.resetLimit()
      const newRateLimit = await this.getRateLimit()
      return newRateLimit.actionsRemaining - 1
    }
    
    if (rateLimit.actionsRemaining <= 0) {
      throw new Error("Daily action limit reached")
    }
    
    const updatedRateLimit: RateLimit = {
      ...rateLimit,
      actionsRemaining: rateLimit.actionsRemaining - 1
    }
    
    await this.storage.set("settings", {
      ...settings,
      rateLimit: updatedRateLimit
    })
    
    // Invalidate cache after mutation
    cachedRateLimit = updatedRateLimit
    cacheTimestamp = Date.now()
    
    return updatedRateLimit.actionsRemaining
  }

  private async resetLimit(): Promise<void> {
    const settings = await this.storage.get("settings") as Settings
    const rateLimit = settings?.rateLimit || {
      dailyLimit: DEFAULT_DAILY_LIMIT,
      actionsRemaining: DEFAULT_DAILY_LIMIT,
      lastResetDate: new Date().toISOString()
    }
    
    // Always reset to the current DEFAULT_DAILY_LIMIT to ensure consistency
    const updatedRateLimit: RateLimit = {
      ...rateLimit,
      dailyLimit: DEFAULT_DAILY_LIMIT,
      actionsRemaining: DEFAULT_DAILY_LIMIT,
      lastResetDate: new Date().toISOString()
    }
    
    await this.storage.set("settings", {
      ...settings,
      rateLimit: updatedRateLimit
    })
    
    // Update cache after reset
    cachedRateLimit = updatedRateLimit
    cacheTimestamp = Date.now()
  }

  public async getRemainingActions(): Promise<number> {
    const rateLimit = await this.getRateLimit()
    
    if (this.shouldResetLimit(rateLimit.lastResetDate)) {
      await this.resetLimit()
      const newRateLimit = await this.getRateLimit()
      return newRateLimit.actionsRemaining
    }
    
    return rateLimit.actionsRemaining
  }
} 