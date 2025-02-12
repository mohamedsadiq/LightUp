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

const modes: Mode[] = ["summarize", "analyze", "explain", "translate"]

export const PopupModeSelector = ({ 
  activeMode, 
  onModeChange, 
  isLoading = false,
  theme = "light"
}: PopupModeSelectorProps) => {
  const [fromLanguage, setFromLanguage] = useState("en")
  const [toLanguage, setToLanguage] = useState("es")
  const [isHovered, setIsHovered] = useState(false)

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
      initial={{ scale: 0.5 }}
      animate={{ scale: 1 }}
      exit={{ scale: 2, opacity: 0 }}
      transition={{
        type: "spring",
        bounce: 0.2,
        duration: 0.3
      }}
      layout="preserve-aspect"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.div 
        style={{
          ...styles.modeContainer,
          backgroundColor: theme === "dark" ? "#FFFFFF10" : "#2c2c2c10",
        }}
        initial={{ filter: "blur(8px)" }}
        animate={{ filter: "blur(0)" }}
        exit={{ scale: 2, opacity: 0 }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 20,
          mass: 0.8
        }}
        layout="preserve-aspect"
        layoutId="mode-container"
      >
        <AnimatePresence mode="popLayout" initial={false}>
          {modes.map((mode) => (
            (mode === activeMode || isHovered) && (
              <motion.button
                key={mode}
                onClick={() => handleModeClick(mode)}
                style={{
                  ...styles.modeButton,
                  backgroundColor: mode === activeMode 
                    ? (theme === "dark" ? "#FFFFFF" : "#2c2c2c")
                    : "transparent",
                  color: mode === activeMode
                    ? (theme === "dark" ? "#2c2c2c" : "white")
                    : (theme === "dark" ? "#FFFFFF80" : "#2c2c2c80"),
                }}
                initial={mode === activeMode ? { scale: 1, y: 0 } : { scale: 0.9, y: 0, opacity: 0}}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.9, y: 0, opacity: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 30,
                  mass: 0.8,
                  exit: {
                    duration: 0.4,
                    mass: 0.2,
                  }
                }}
                layout="position"
                layoutId={`mode-button-${mode}`}
                whileHover={mode !== activeMode ? {
                  backgroundColor: theme === "dark" ? "#FFFFFF20" : "#2c2c2c20",
                  color: theme === "dark" ? "#FFFFFF" : "#2c2c2c",
                  scale: 1.02,
                  transition: {
                    duration: 0.2
                  }
                } : {}}
              
              >
                <motion.span >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </motion.span>

                {mode === activeMode && isLoading && (
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
                      transition: { duration: 0.2 }
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
              </motion.button>
            )
          ))}
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
    marginBottom: "8px",
  },
  modeContainer: {
    display: "flex",
    gap: "4px",
    padding: "4px",
    borderRadius: "24px",
  },
  modeButton: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "2px 11px",
    borderRadius: "20px",
    fontSize: "10px",
    fontFamily: "'K2D', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    cursor: "pointer",
    height: "28px",
    lineHeight: "16px",
    fontWeight: "500",
    border: "none",
    outline: "none",
    transition: "background-color 0.2s, color 0.2s",
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