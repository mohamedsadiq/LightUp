import { Storage } from "@plasmohq/storage"
import type { Feedback } from "~types/settings"

export class FeedbackProcessor {
  private storage: Storage

  constructor() {
    this.storage = new Storage()
  }

  async getFeedbackContext(text: string): Promise<{
    positivePatterns: string[]
    negativePatterns: string[]
  }> {
    const feedbacks = await this.storage.get('feedbacks') || []
    const recentFeedbacks = this.getRecentFeedbacks(feedbacks, 30) // Last 30 days

    const positivePatterns = this.extractPatterns(
      recentFeedbacks.filter(f => f.feedback === 'like')
    )
    const negativePatterns = this.extractPatterns(
      recentFeedbacks.filter(f => f.feedback === 'dislike')
    )

    return { positivePatterns, negativePatterns }
  }

  private getRecentFeedbacks(feedbacks: Feedback[], days: number): Feedback[] {
    const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000)
    return feedbacks.filter(f => f.timestamp >= cutoffTime)
  }

  private extractPatterns(feedbacks: Feedback[]): string[] {
    return feedbacks.map(f => this.analyzeResponse(f.text)).flat()
  }

  private analyzeResponse(text: string): string[] {
    // Simple pattern extraction - can be made more sophisticated
    const sentences = text.split(/[.!?]+/).map(s => s.trim())
    return sentences.filter(s => s.length > 20) // Only meaningful sentences
  }
} 