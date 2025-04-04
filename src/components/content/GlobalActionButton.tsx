import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Z_INDEX } from "~utils/constants";
import { Logo } from "../icons";
import { Storage } from "@plasmohq/storage";
import type { Theme } from "~types/theme";
import type { Settings } from "~types/settings";

interface GlobalActionButtonProps {
  onProcess: (text: string) => void;
  mode: string;
  isPopupVisible?: boolean;
}

const GlobalActionButton: React.FC<GlobalActionButtonProps> = ({ onProcess, mode, isPopupVisible = false }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [theme, setTheme] = useState<Theme>("light");
  const [buttonVisible, setButtonVisible] = useState(true);
  
  // Load theme and button visibility settings from storage
  useEffect(() => {
    const loadSettings = async () => {
      const storage = new Storage();
      const settings = await storage.get("settings") as Settings | undefined;
      
      // Load theme
      const themePreference = settings?.customization?.theme || "system";
      if (themePreference === "system") {
        // Check system preference
        const isDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;
        setTheme(isDarkMode ? "dark" : "light");
      } else {
        setTheme(themePreference as Theme);
      }
      
      // Load button visibility (default to true if not set)
      const showButton = settings?.customization?.showGlobalActionButton !== false;
      setButtonVisible(showButton);
    };
    
    loadSettings();
    
    // Listen for settings updates
    const handleSettingsChange = () => {
      loadSettings();
    };
    
    window.addEventListener("settingsUpdated", handleSettingsChange);
    return () => {
      window.removeEventListener("settingsUpdated", handleSettingsChange);
    };
  }, []);
  
  const handleClick = () => {
    // Get all visible text from the page
    const visibleText = document.body.innerText;
    onProcess(visibleText);
  };

  // Define the tooltip text based on the current mode
  const getTooltipText = () => {
    switch(mode) {
      case "summarize": return "Summarize entire page";
      case "explain": return "Explain entire page";
      case "analyze": return "Analyze entire page";
      case "translate": return "Translate entire page";
      case "free": return "Chat about entire page";
      default: return "Process entire page";
    }
  };

  // Theme-aware styles
  const getButtonStyles = () => {
    return {
      backgroundColor: theme === "dark" ? "#383838" : "#f5f5f5",
      color: theme === "dark" ? "#FFFFFF" : "#000000",
      boxShadow: theme === "dark" 
        ? "0 4px 14px rgba(0, 0, 0, 0.4)" 
        : "0 4px 14px rgba(0, 0, 0, 0.15)"
    };
  };

  const getTooltipStyles = () => {
    return {
      backgroundColor: theme === "dark" ? "#383838" : "#ffffff",
      color: theme === "dark" ? "#FFFFFF" : "#333333",
      boxShadow: theme === "dark" 
        ? "0 2px 10px rgba(0, 0, 0, 0.5)" 
        : "0 2px 10px rgba(0, 0, 0, 0.1)"
    };
  };

  // If popup is visible or button is disabled in settings, don't show the button
  if (isPopupVisible || !buttonVisible) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        style={{
          position: "fixed",
          bottom: "80px", // Positioned higher on the page
          right: "20px",
          zIndex: Z_INDEX.POPUP,
        }}
        aria-label={getTooltipText()}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            style={{
              position: "absolute",
              bottom: "100%",
              right: "0",
              marginBottom: "8px",
              padding: "6px 12px",
              borderRadius: "4px",
              whiteSpace: "nowrap",
              fontSize: "12px",
              fontWeight: "500",
              ...getTooltipStyles()
            }}
          >
            {getTooltipText()}
          </motion.div>
        )}
        
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleClick}
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            padding: 0,
            ...getButtonStyles()
          }}
          aria-label={getTooltipText()}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              handleClick();
            }
          }}
        >
          {/* Use the Logo component with current theme */}
          {Logo(theme)}
        </motion.button>
      </motion.div>
    </AnimatePresence>
  );
};

export default GlobalActionButton; 