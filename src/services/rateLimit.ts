import { Storage } from "@plasmohq/storage"

interface RateLimitData {
  count: number
  lastReset: number
  dailyLimit: number
}

export class RateLimitService {
  private storage: Storage
  private readonly RATE_LIMIT_KEY = "lightup_basic_rate_limit"
  private readonly DAILY_LIMIT = 15 // 15 requests per day for basic version
  private readonly MS_PER_DAY = 24 * 60 * 60 * 1000

  constructor() {
    this.storage = new Storage()
  }

  private async getRateLimitData(): Promise<RateLimitData> {
    const data = await this.storage.get(this.RATE_LIMIT_KEY) as RateLimitData
    if (!data) {
      return {
        count: 0,
        lastReset: Date.now(),
        dailyLimit: this.DAILY_LIMIT
      }
    }
    return data
  }

  private async updateRateLimitData(data: RateLimitData): Promise<void> {
    await this.storage.set(this.RATE_LIMIT_KEY, data)
  }

  async checkRateLimit(): Promise<{ allowed: boolean; remaining: number; error?: string }> {
    const data = await this.getRateLimitData()
    const now = Date.now()

    // Reset count if it's a new day
    if (now - data.lastReset >= this.MS_PER_DAY) {
      data.count = 0
      data.lastReset = now
    }

    // Check if limit exceeded
    if (data.count >= this.DAILY_LIMIT) {
      const hoursUntilReset = Math.ceil((this.MS_PER_DAY - (now - data.lastReset)) / (1000 * 60 * 60))
      return {
        allowed: false,
        remaining: 0,
        error: `Daily limit exceeded. Please try again in ${hoursUntilReset} hours or upgrade to use your own API key.`
      }
    }

    // Increment count and update storage
    data.count++
    await this.updateRateLimitData(data)

    return {
      allowed: true,
      remaining: this.DAILY_LIMIT - data.count
    }
  }

  async getRemainingRequests(): Promise<number> {
    const data = await this.getRateLimitData()
    const now = Date.now()

    // Reset count if it's a new day
    if (now - data.lastReset >= this.MS_PER_DAY) {
      return this.DAILY_LIMIT
    }

    return Math.max(0, this.DAILY_LIMIT - data.count)
  }

  async resetLimit(): Promise<void> {
    await this.updateRateLimitData({
      count: 0,
      lastReset: Date.now(),
      dailyLimit: this.DAILY_LIMIT
    })
  }
} 