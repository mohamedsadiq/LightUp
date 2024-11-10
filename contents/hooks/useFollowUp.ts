import { useState } from "react"
import { sendToBackground } from "@plasmohq/messaging"

export interface FollowUpQA {
  question: string;
  answer: string;
  id: number;
}

export const useFollowUp = (selectedText: string) => {
  const [followUpQuestion, setFollowUpQuestion] = useState("")
  const [isAskingFollowUp, setIsAskingFollowUp] = useState(false)
  const [followUpQAs, setFollowUpQAs] = useState<FollowUpQA[]>([])
  const [activeAnswerId, setActiveAnswerId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const formatFollowUpQA = (question: string, answer: string): FollowUpQA => ({
    question,
    answer,
    id: Date.now()
  })

  const handleAskFollowUp = async () => {
    if (!followUpQuestion.trim()) return

    setActiveAnswerId(null)
    setIsAskingFollowUp(true)
    setError(null)

    try {
      const response = await sendToBackground({
        name: "processText",
        body: {
          text: `Based on this context: "${selectedText}", ${followUpQuestion}`,
          mode: "explain",
          maxTokens: 2048
        }
      })

      if (response.result) {
        const newQA = formatFollowUpQA(followUpQuestion, response.result)
        setFollowUpQAs(prev => [...prev, newQA])
        setActiveAnswerId(newQA.id)
        setFollowUpQuestion("")
      } else if (response.error) {
        setError(response.error)
      }
    } catch (err) {
      console.error('Error:', err)
      setError('Failed to get answer')
    } finally {
      setIsAskingFollowUp(false)
    }
  }

  return {
    followUpQuestion,
    setFollowUpQuestion,
    isAskingFollowUp,
    followUpQAs,
    activeAnswerId,
    error,
    handleAskFollowUp
  }
}