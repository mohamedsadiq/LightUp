import { useState, useEffect } from "react"
import { Storage } from "@plasmohq/storage"
import type { Feedback } from "~types/settings"

export const useFeedback = () => {
  const [feedbacks, setFeedbacks] = useState<Record<string, 'like' | 'dislike'>>({})

  const handleFeedback = async (id: string, text: string, context: string, type: 'like' | 'dislike') => {
    const storage = new Storage()
    const feedback: Feedback = {
      id,
      text,
      feedback: type,
      context,
      timestamp: Date.now()
    }

    const existingFeedbacks = await storage.get('feedbacks') || []
    await storage.set('feedbacks', [...existingFeedbacks, feedback])
    
    setFeedbacks(prev => ({
      ...prev,
      [id]: type
    }))
  }

  return { feedbacks, handleFeedback }
} 