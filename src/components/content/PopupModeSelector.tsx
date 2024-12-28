import { motion, AnimatePresence } from "framer-motion"
import { useState } from "react"
import { LanguageSelector } from "./LanguageSelector"
import type { Mode, TranslationSettings } from "~types/settings"
import { useSettings } from "~hooks/useSettings"

interface PopupModeSelectorProps {
  activeMode: Mode
  onModeChange: (mode: Mode, settings?: TranslationSettings) => void
  isLoading?: boolean
  theme?: "light" | "dark"
}

export const PopupModeSelector = ({ 
  activeMode, 
  onModeChange, 
  isLoading = false,
  theme = "light"
}: PopupModeSelectorProps) => {
  const [fromLanguage, setFromLanguage] = useState("en")
  const [toLanguage, setToLanguage] = useState("es")
  const { settings } = useSettings()
  const isContextAwareEnabled = settings?.customization?.contextAwareness ?? false

  const handleModeClick = (mode: Mode) => {
    if (mode === "translate") {
      onModeChange(mode, { fromLanguage, toLanguage })
    } else {
      onModeChange(mode)
    }
  }

  return (
    <motion.div 
      style={styles.container}
      initial={{  scale: 0.5 }}
      animate={{  scale: 1 }}
      transition={{ 
        type: "spring",
        bounce: 0.1,
        stiffness: 120,
        damping: 10
      }}
      layout
    >
      <motion.div 
        style={{
          ...styles.modeButton,
          backgroundColor: theme === "dark" ? "#FFFFFF" : "#2c2c2c",
          color: theme === "dark" ? "#2c2c2c" : "white",
        }}
        initial={{ filter: "blur(8px)" }}
        animate={{ filter: "blur(0)" }}
        transition={{ duration: 0.2 }}
        layout
      >
        <motion.span 
          key={activeMode}
          initial={{ filter: "blur(8px)" }}
          animate={{ filter: "blur(0)" }}
          transition={{ duration: 0.2 }}
          layout
        >
          {activeMode.charAt(0).toUpperCase() + activeMode.slice(1)} mode
        </motion.span>
        
        <AnimatePresence mode="wait">
          {isLoading && (
            <motion.div
              style={styles.loadingIndicator}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ 
                opacity: 1, 
                scale: 1,
                rotate: 360 
              }}
              exit={{ 
                opacity: 0,
                scale: 0.5,
                transition: { duration: 0.2, }
              }}
              transition={{ 
                rotate: { duration: 1, repeat: Infinity, ease: "linear" },
                opacity: { duration: 0.2 },
                scale: { duration: 0.2 }
              }}
            >
              •
            </motion.div>
          )}
        </AnimatePresence>

        {isContextAwareEnabled && (
          <motion.div
            style={styles.contextIndicator}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            title="Context awareness is enabled"
          >
            <svg 
              width="12" 
              height="12" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
              style={{ opacity: 0.7 }}
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  )
}

const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    padding: "4px 0",
    marginBottom: "8px"
  },
  modeButton: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "2px 11px",
    borderRadius: "20px",
    fontSize: "10px",
    fontFamily: "'K2D', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    cursor: "default",
    height: "28px",
    lineHeight: "16px",
    fontWeight: "500"
  },
  iconWrapper: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  icon: {
    fontWeight: "bold",
    fontSize: "12px",
    marginRight: "2px"
  },
  loadingIndicator: {
    fontSize: "16px",
    color: "#8e8e8e",
    lineHeight: 1,
    marginLeft: "0",
  },
  contextIndicator: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: "2px",
  },
  languageSelectors: {
    display: "flex",
    gap: "8px",
    marginTop: "8px"
  }
} as const 