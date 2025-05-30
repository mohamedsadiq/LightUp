import { Storage } from "@plasmohq/storage"
import type { Settings, RateLimit } from "~types/settings"

const DEFAULT_DAILY_LIMIT = 50

export class RateLimitService {
  private storage: Storage

  constructor() {
    this.storage = new Storage()
  }

  private async getRateLimit(): Promise<RateLimit> {
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
      return rateLimit
    }
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
    
    return updatedRateLimit.actionsRemaining
  }

  private async resetLimit(): Promise<void> {
    const settings = await this.storage.get("settings") as Settings
    const rateLimit = settings?.rateLimit || {
      dailyLimit: DEFAULT_DAILY_LIMIT,
      actionsRemaining: DEFAULT_DAILY_LIMIT,
      lastResetDate: new Date().toISOString()
    }
    
    const updatedRateLimit: RateLimit = {
      ...rateLimit,
      actionsRemaining: rateLimit.dailyLimit,
      lastResetDate: new Date().toISOString()
    }
    
    await this.storage.set("settings", {
      ...settings,
      rateLimit: updatedRateLimit
    })
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