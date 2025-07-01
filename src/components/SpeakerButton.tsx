import { useState } from "react"
import { getMessage } from "../utils/i18n"

interface SpeakerButtonProps {
  text: string
  className?: string
}

const SpeakerButton = ({ text, className = "" }: SpeakerButtonProps) => {
  const [isSpeaking, setIsSpeaking] = useState(false)

  const handleSpeak = () => {
    setIsSpeaking(!isSpeaking)
  }

  return (
    <button
      onClick={handleSpeak}
      className={`p-2 rounded-full transition-colors ${className}`}
      aria-label={isSpeaking ? getMessage("speakerStop") || "Stop speaking" : getMessage("speakerStart") || "Read text aloud"}
    >
      {isSpeaking ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="6" y="4" width="4" height="16" />
          <rect x="14" y="4" width="4" height="16" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
        </svg>
      )}
    </button>
  )
}

export default SpeakerButton 