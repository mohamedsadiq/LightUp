import { useState, useEffect } from "react"
import { Storage } from "@plasmohq/storage"
import { sendToBackground } from "@plasmohq/messaging"
import { motion, AnimatePresence } from "framer-motion"
import type { Mode, TranslationSettings } from "~types/settings"
import { LANGUAGES } from "~utils/constants"
import "../style.css"

// Add this interface and component before IndexPopup
interface ActionButtonProps {
  mode: Mode
  activeMode: Mode
  onClick: () => void
  children: React.ReactNode
}

const ActionButton = ({ mode, activeMode, onClick, children }: ActionButtonProps) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-lg text-sm ${
      activeMode === mode ? "bg-[#14742F] text-white" : "bg-white text-gray-700"
    }`}>
    {children}
  </button>
)

function IndexPopup() {
  const [activeMode, setActiveMode] = useState<Mode>("explain")
  const [fromLanguage, setFromLanguage] = useState("en")
  const [toLanguage, setToLanguage] = useState("es")
  const [customInstruction, setCustomInstruction] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  const [showSaveAnimation, setShowSaveAnimation] = useState(false)
  const storage = new Storage()

  useEffect(() => {
    const loadSavedSettings = async () => {
      const savedMode = await storage.get("mode") as Mode
      const savedTranslationSettings = await storage.get("translationSettings") as TranslationSettings
      
      if (savedMode) {
        setActiveMode(savedMode)
      }
      if (savedTranslationSettings) {
        setFromLanguage(savedTranslationSettings.fromLanguage)
        setToLanguage(savedTranslationSettings.toLanguage)
      }
    }
    loadSavedSettings()
  }, [])

  const handleModeChange = async (mode: Mode) => {
    setActiveMode(mode)
    await storage.set("mode", mode)
    
    // Send any mode change to background
    await sendToBackground({
      name: "processText",
      body: { 
        mode,
        // Include any mode-specific settings
        settings: mode === "translate" 
          ? { fromLanguage, toLanguage }
          : undefined
      }
    })
  }

  return (
    <div className="p-5 flex flex-col items-stretch w-[500px] h-[300px] font-kd2 bg-[#ffffff] rounded-lg ">
      <div className="p-5 bg-[#f5f5f5] rounded-lg h-[100%]">
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
            <ActionButton
              mode="translate"
              activeMode={activeMode}
              onClick={() => handleModeChange("translate")}>
              Translate
            </ActionButton>
          </div>

          {activeMode === "translate" && (
            <div className="flex gap-4 mt-4">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  From
                </label>
                <select
                  value={fromLanguage}
                  onChange={(e) => setFromLanguage(e.target.value)}
                  className="w-full p-2 rounded border border-gray-200 bg-white text-sm"
                >
                  {Object.entries(LANGUAGES).map(([code, name]) => (
                    <option key={code} value={code}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  To
                </label>
                <select
                  value={toLanguage}
                  onChange={(e) => setToLanguage(e.target.value)}
                  className="w-full p-2 rounded border border-gray-200 bg-white text-sm"
                >
                  {Object.entries(LANGUAGES).map(([code, name]) => (
                    <option key={code} value={code}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default IndexPopup
