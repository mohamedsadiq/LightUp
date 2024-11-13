import { useState, useEffect } from "react"
import { Storage } from "@plasmohq/storage"
import { motion, AnimatePresence } from "framer-motion"
import type { PlasmoMessaging } from "@plasmohq/messaging"
import "../style.css"

type Mode = "explain" | "summarize"  | "analyze"

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

  return (
    <div className="p-5 flex flex-col items-stretch w-[400px] font-sans bg-[#f5f5f5] rounded-lg">
      <h2 className="mb-5 text-base font-normal text-black">Define the purpose of LightUp</h2>
      
      <div>
        <h3 className="text-sm font-medium mb-3 text-black">Available actions</h3>
        <div className="flex flex-wrap gap-2 mb-5">
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
            Explain 
          </ActionButton>
          <ActionButton
            mode="analyze"
            activeMode={activeMode}
            onClick={() => handleModeChange("analyze")}>
            Analyze
          </ActionButton>
        </div>
      </div>
    </div>
  )
}

const ActionButton = ({ mode, activeMode, onClick, children }) => {
  return (
    <motion.button
      onClick={onClick}
      className={`px-4 py-2 rounded-full cursor-pointer text-sm transition-all duration-200
        ${activeMode === mode ? 'bg-[#0F8A5F] text-white' : 'bg-[#e2e2e2] text-black'}`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.button>
  )
}

export default IndexPopup
