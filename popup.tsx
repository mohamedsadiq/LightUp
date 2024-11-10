import { useState, useEffect } from "react"
import { Storage } from "@plasmohq/storage"
import { motion, AnimatePresence } from "framer-motion"
import type { PlasmoMessaging } from "@plasmohq/messaging"

type Mode = "explain" | "summarize" | "translate" | "grammar" | "analyze"

function IndexPopup() {
  const [activeMode, setActiveMode] = useState<Mode>("explain")
  const [customInstruction, setCustomInstruction] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  const [showSaveAnimation, setShowSaveAnimation] = useState(false)
  const storage = new Storage()

  useEffect(() => {
    const loadSavedMode = async () => {
      const savedMode = await storage.get("mode") as Mode
      if (savedMode) {
        setActiveMode(savedMode)
      }
    }
    loadSavedMode()
  }, [])

  const handleModeChange = async (mode: Mode) => {
    setActiveMode(mode)
    await storage.set("mode", mode)
  }

  const handleSaveInstructions = async () => {
    await storage.set("customInstruction", customInstruction)
    setShowSaveAnimation(true)
    setIsEditing(false)
    
    setTimeout(() => {
      setShowSaveAnimation(false)
    }, 2000)
  }

  const handleTextAreaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCustomInstruction(e.target.value)
    setIsEditing(true)
  }

  const handleExecution = async (selectedText: string) => {
    // Send message to background script
    const response = await chrome.runtime.sendMessage({
      type: "PROCESS_TEXT",
      payload: {
        text: selectedText,
        mode: activeMode,
        customInstruction
      }
    })
  }

  const styles = {
    container: {
      padding: 20,
      display: "flex",
      flexDirection: "column" as const,
      alignItems: "stretch",
      width: "400px",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      backgroundColor: "#f5f5f5",
      borderRadius: 8
    },
    title: {
      marginBottom: 20,
      fontSize: "16px",
      fontWeight: "normal",
      color: "#000"
    },
    sectionTitle: {
      fontSize: "14px",
      fontWeight: "500",
      marginBottom: 12,
      color: "#000"
    },
    buttonContainer: {
      display: "flex",
      flexWrap: "wrap" as const,
      gap: "8px",
      marginBottom: 20
    },
    button: (mode: Mode) => ({
      padding: "8px 16px",
      backgroundColor: activeMode === mode ? "#0F8A5F" : "#e2e2e2",
      color: activeMode === mode ? "#ffffff" : "#000",
      border: "none",
      borderRadius: "20px",
      cursor: "pointer",
      fontSize: "14px",
      fontWeight: "normal",
      transition: "all 0.2s ease",
      "&:hover": {
        backgroundColor: activeMode === mode ? "#0F8A5F" : "#d5d5d5"
      }
    }),
    customizeText: {
      fontSize: "14px",
      color: "#666",
      marginBottom: 8
    },
    textArea: {
      width: "100%",
      minHeight: "100px",
      padding: "8px",
      borderRadius: "4px",
      border: "1px solid #e2e2e2",
      marginBottom: "16px",
      fontSize: "14px",
      resize: "vertical",
      backgroundColor: "#f8f8f8"
    },
    buttonGroup: {
      display: "flex",
      justifyContent: "flex-end",
      gap: "8px",
      position: "relative" as const,
      minHeight: "40px"
    },
    cancelButton: {
      padding: "8px 16px",
      backgroundColor: "transparent",
      color: "#000",
      border: "1px solid #e2e2e2",
      borderRadius: "4px",
      cursor: "pointer",
      fontSize: "14px",
      pointerEvents: isEditing ? "auto" : "none" as const
    },
    saveButton: {
      padding: "8px 16px",
      backgroundColor: "#0F8A5F",
      color: "#fff",
      border: "none",
      borderRadius: "4px",
      cursor: "pointer",
      fontSize: "14px",
      pointerEvents: isEditing ? "auto" : "none" as const
    }
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Define the purpose of LightUp</h2>
      
      <div>
        <h3 style={styles.sectionTitle}>Available actions</h3>
        <div style={styles.buttonContainer}>
          <ActionButton
            mode="translate"
            activeMode={activeMode}
            onClick={() => handleModeChange("translate")}>
            Translate
          </ActionButton>
          <ActionButton
            mode="summarize"
            activeMode={activeMode}
            onClick={() => handleModeChange("summarize")}>
            Summarize
          </ActionButton>
          <ActionButton
            mode="explain"
            activeMode={activeMode}
            onClick={() => handleModeChange("explain")}>
            Explain code
          </ActionButton>
          <ActionButton
            mode="grammar"
            activeMode={activeMode}
            onClick={() => handleModeChange("grammar")}>
            Grammar Correction
          </ActionButton>
          <ActionButton
            mode="analyze"
            activeMode={activeMode}
            onClick={() => handleModeChange("analyze")}>
            Analyze
          </ActionButton>
        </div>
      </div>

      <div>
        <p style={styles.customizeText}>Customize an action</p>
        <motion.textarea
          style={styles.textArea}
          value={customInstruction}
          onChange={handleTextAreaChange}
          placeholder="Enter your custom instructions here..."
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
        <div style={styles.buttonGroup}>
          <AnimatePresence>
            {isEditing && (
              <motion.button
                style={styles.cancelButton}
                onClick={() => {
                  setCustomInstruction("")
                  setIsEditing(false)
                }}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Cancel
              </motion.button>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {isEditing && (
              <motion.button
                style={styles.saveButton}
                onClick={handleSaveInstructions}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Save Instructions
              </motion.button>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showSaveAnimation && (
              <motion.div
                style={{
                  position: "absolute",
                  right: "0",
                  top: "-40px",
                  backgroundColor: "#0F8A5F",
                  color: "white",
                  padding: "8px 16px",
                  borderRadius: "4px",
                  fontSize: "14px",
                  pointerEvents: "none"
                }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                Instructions saved!
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

// Add animations for the action buttons too
const ActionButton = ({ mode, activeMode, onClick, children }) => {
  return (
    <motion.button
      onClick={onClick}
      style={{
        padding: "8px 16px",
        backgroundColor: activeMode === mode ? "#0F8A5F" : "#e2e2e2",
        color: activeMode === mode ? "#ffffff" : "#000",
        border: "none",
        borderRadius: "20px",
        cursor: "pointer",
        fontSize: "14px"
      }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.button>
  )
}

export default IndexPopup
