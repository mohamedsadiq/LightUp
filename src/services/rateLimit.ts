import { Storage } from "@plasmohq/storage"
import type { Settings, RateLimit } from "~types/settings"

const DEFAULT_DAILY_LIMIT = 20

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

// Add a simple cache system for responses
interface ResponseCacheEntry {
  mode: string;
  text: string;
  response: string;
  timestamp: number;
}

class ResponseCacheService {
  private cache: Map<string, ResponseCacheEntry> = new Map();
  private MAX_CACHE_SIZE = 20; // Limit cache size to prevent memory issues
  private CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

  // Generate a cache key from the input text and mode
  private generateCacheKey(text: string, mode: string): string {
    // Simple hash function for text
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `${mode}_${hash}`;
  }

  // Get a cached response if available
  getResponse(text: string, mode: string): string | null {
    const key = this.generateCacheKey(text, mode);
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    // Check if cache entry has expired
    if (Date.now() - entry.timestamp > this.CACHE_EXPIRY_MS) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.response;
  }

  // Store a response in the cache
  storeResponse(text: string, mode: string, response: string): void {
    // Don't cache empty responses or extremely long texts
    if (!response || text.length > 10000) return;
    
    const key = this.generateCacheKey(text, mode);
    
    // If cache is full, remove the oldest entry
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      let oldestKey: string | null = null;
      let oldestTime = Date.now();
      
      this.cache.forEach((entry, entryKey) => {
        if (entry.timestamp < oldestTime) {
          oldestTime = entry.timestamp;
          oldestKey = entryKey;
        }
      });
      
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }
    
    // Store the new response
    this.cache.set(key, {
      mode,
      text,
      response,
      timestamp: Date.now()
    });
  }

  // Clear expired entries from the cache
  clearExpiredEntries(): void {
    const now = Date.now();
    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp > this.CACHE_EXPIRY_MS) {
        this.cache.delete(key);
      }
    });
  }
}

// Export a singleton instance
export const responseCacheService = new ResponseCacheService(); 