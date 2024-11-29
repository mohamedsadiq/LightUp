import { motion, AnimatePresence } from "framer-motion"
import { useState } from "react"
import { LanguageSelector } from "./LanguageSelector"
import type { Mode, TranslationSettings } from "~types/settings"

interface PopupModeSelectorProps {
  activeMode: Mode
  onModeChange: (mode: Mode, settings?: TranslationSettings) => void
  isLoading?: boolean
}


export const PopupModeSelector = ({ activeMode, onModeChange, isLoading = false }: PopupModeSelectorProps) => {
  const [fromLanguage, setFromLanguage] = useState("en")
  const [toLanguage, setToLanguage] = useState("es")

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
        style={styles.modeButton}
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
    backgroundColor: "#2c2c2c",
    color: "white",
    borderRadius: "20px",
    fontSize: "10px",
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    cursor: "default",
    height: "28px",
    lineHeight: "16px"
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
  languageSelectors: {
    display: "flex",
    gap: "8px",
    marginTop: "8px"
  }
} as const 