import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect } from "react"
import { Storage } from "@plasmohq/storage"
import { LanguageSelector } from "./LanguageSelector"
import type { Mode, TranslationSettings } from "~types/settings"
import { useSettings } from "~hooks/useSettings"

interface PopupModeSelectorProps {
  activeMode: Mode
  onModeChange: (mode: Mode, settings?: TranslationSettings) => void
  isLoading?: boolean
  theme?: "light" | "dark"
}

// Default modes if user hasn't configured any
const DEFAULT_MODES: Mode[] = ["summarize", "analyze", "explain", "translate"]

// All available modes
const ALL_MODES: Mode[] = ["summarize", "analyze", "explain", "translate", "free"]

export const PopupModeSelector = ({ 
  activeMode, 
  onModeChange, 
  isLoading = false,
  theme = "light"
}: PopupModeSelectorProps) => {
  const [fromLanguage, setFromLanguage] = useState("en")
  const [toLanguage, setToLanguage] = useState("es")
  const [isHovered, setIsHovered] = useState(false)
  const [preferredModes, setPreferredModes] = useState<Mode[]>(DEFAULT_MODES)

  // Load preferred modes from storage
  useEffect(() => {
    const loadPreferredModes = async () => {
      try {
        const storage = new Storage()
        
        // Check settings first (newer way)
        const settings = await storage.get("settings") as any
        let savedPreferredModes = settings?.customization?.preferredModes as Mode[] | undefined
        
        // Fallback to direct storage key (older way)
        if (!savedPreferredModes || savedPreferredModes.length === 0) {
          savedPreferredModes = await storage.get("preferredModes") as Mode[] | undefined
        }
        
        if (savedPreferredModes && savedPreferredModes.length > 0) {
          // Limit to 4 modes
          setPreferredModes(savedPreferredModes.slice(0, 4))
        }
        
        // Load translation settings
        const translationSettings = settings?.translationSettings || await storage.get("translationSettings") as any
        if (translationSettings) {
          if (translationSettings.fromLanguage) {
            setFromLanguage(translationSettings.fromLanguage)
          }
          if (translationSettings.toLanguage) {
            setToLanguage(translationSettings.toLanguage)
          }
        }
      } catch (error) {
        console.error("Error loading preferred modes:", error)
      }
    }
    
    loadPreferredModes()
    
    // Listen for updates to preferred modes
    const handleModesUpdated = (event: CustomEvent) => {
      const { preferredModes: newPreferredModes } = event.detail;
      
      if (newPreferredModes && newPreferredModes.length > 0) {
        // Limit to 4 modes
        setPreferredModes(newPreferredModes.slice(0, 4));
      }
    };
    
    window.addEventListener('modesUpdated', handleModesUpdated as EventListener);
    
    return () => {
      window.removeEventListener('modesUpdated', handleModesUpdated as EventListener);
    };
  }, [])

  const handleModeClick = (mode: Mode) => {
    if (mode === "translate") {
      onModeChange(mode, { fromLanguage, toLanguage })
    } else {
      onModeChange(mode)
    }
  }

  // Use the preferred modes or default to the first 4 modes
  const displayModes = preferredModes.length > 0 ? preferredModes : DEFAULT_MODES

  // Dynamic styles with YouTube compensation
  const getModeSelectorStyles = () => {
    // Detect if we're on YouTube and need font size compensation
    const isYouTube = window.location.hostname.includes('youtube.com');
    const baseFontSize = isYouTube ? "11px" : "0.7rem"; // Use pixels on YouTube, rem elsewhere
    
    return {
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
        padding: "6px 12px",
        borderRadius: "20px",
        fontSize: baseFontSize,
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
        fontSize: "0.6rem",
        marginRight: "2px"
      },
      loadingIndicator: {
        fontSize: "1.2rem",
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
    } as const;
  };

  const styles = getModeSelectorStyles();

  return (
    <>
      <style>{GlobalStyles}</style>
      <motion.div 
        style={styles.container}
        initial={{ scale: 0.5 }}
        animate={{ scale: 1 }}
        exit={{ scale: 1.3, opacity: 0}}
        transition={{
          type: "spring",
          bounce: 0.1,
          duration: 0.3
        }}
        layout
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
          exit={{ scale: 1, opacity: 0 }}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 50,
            mass: 0.8,
          }}
          layout="preserve-aspect"
          layoutId="mode-container"
        >
          <AnimatePresence mode="popLayout" initial={false}>
            {displayModes.map((mode) => (
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
                      key={`loading-${mode}-${isLoading}`}
                      style={styles.loadingIndicator}
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ 
                        opacity: 1, 
                        scale: 1
                      }}
                      exit={{ 
                        opacity: 0,
                        scale: 0.5,
                        transition: { duration: 0.2 }
                      }}
                      transition={{ 
                        opacity: { duration: 0.2 },
                        scale: { duration: 0.2 }
                      }}
                      className="loading-dot"
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
    </>
  )
}

const GlobalStyles = `
  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  .loading-dot {
    animation: spin 1s linear infinite;
    display: inline-block;
  }
`; 