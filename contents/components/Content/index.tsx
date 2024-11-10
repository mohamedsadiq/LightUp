import { useState, useEffect } from "react"
import { Storage } from "@plasmohq/storage"
import { sendToBackground } from "@plasmohq/messaging"
import { TypewriterText } from "../TypewriterText"
import { Logo, CloseIcon, PinIcon } from "../Icons"
import { useFollowUp } from "../../hooks/useFollowUp"
import { styles } from "../../styles/content"

export function Content() {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isPinned, setIsPinned] = useState(false)
  const [selectedText, setSelectedText] = useState("")
  const [answer, setAnswer] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const storage = new Storage()

  const {
    followUpQuestion,
    setFollowUpQuestion,
    isAskingFollowUp,
    followUpQAs,
    activeAnswerId,
    error,
    handleAskFollowUp
  } = useFollowUp(selectedText)

  useEffect(() => {
    const handleMouseUp = async (event: MouseEvent) => {
      const text = window.getSelection()?.toString().trim()
      
      if (!text || text === selectedText) return
      
      setSelectedText(text)
      setAnswer("")
      setIsLoading(true)
      setIsPinned(false)
      
      // Position the popup near the mouse
      const x = event.pageX + 10
      const y = event.pageY + 10
      setPosition({ x, y })

      try {
        const response = await sendToBackground({
          name: "processText",
          body: {
            text,
            mode: "explain",
            maxTokens: 2048
          }
        })

        if (response.result) {
          setAnswer(response.result)
        }
      } catch (error) {
        console.error("Error processing text:", error)
      } finally {
        setIsLoading(false)
      }
    }

    document.addEventListener("mouseup", handleMouseUp)
    return () => document.removeEventListener("mouseup", handleMouseUp)
  }, [selectedText])

  const handleClose = () => {
    setSelectedText("")
    setAnswer("")
    setIsPinned(false)
  }

  const handlePin = () => {
    setIsPinned(!isPinned)
  }

  if (!selectedText) return null

  return (
    <div
      style={{
        ...styles.popup,
        left: `${position.x}px`,
        top: `${position.y}px`,
        position: isPinned ? "fixed" : "absolute"
      }}
    >
      <div style={styles.header}>
        <div style={styles.logo}>
          <Logo />
          <span style={styles.logoText}>AI Assistant</span>
        </div>
        <div style={styles.actions}>
          <button 
            onClick={handlePin} 
            style={styles.iconButton}
            title={isPinned ? "Unpin" : "Pin"}
          >
            <PinIcon isPinned={isPinned} />
          </button>
          <button 
            onClick={handleClose} 
            style={styles.iconButton}
            title="Close"
          >
            <CloseIcon />
          </button>
        </div>
      </div>

      <div style={styles.content}>
        {isLoading ? (
          <div style={styles.answer}>Analyzing text...</div>
        ) : (
          <div style={styles.answer}>
            <TypewriterText 
              text={answer} 
              speed={30}
              stopAnimation={isPinned}
            />
          </div>
        )}
      </div>

      <div style={styles.followUpSection}>
        <input
          type="text"
          value={followUpQuestion}
          onChange={(e) => setFollowUpQuestion(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleAskFollowUp()}
          placeholder="Ask a follow-up question..."
          style={styles.input}
        />
        
        {error && <div style={styles.error}>{error}</div>}
        
        {followUpQAs.length > 0 && (
          <div style={styles.followUpList}>
            {followUpQAs.map((qa) => (
              <div 
                key={qa.id}
                style={styles.followUpItem}
                onClick={() => setActiveAnswerId(qa.id)}
              >
                <div style={styles.followUpQuestion}>{qa.question}</div>
                {activeAnswerId === qa.id && (
                  <div style={styles.followUpAnswer}>
                    <TypewriterText 
                      text={qa.answer}
                      speed={30}
                      stopAnimation={isPinned}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}