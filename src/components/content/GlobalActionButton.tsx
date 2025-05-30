import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Z_INDEX } from "~utils/constants";
import { Logo } from "../icons";
import { Storage } from "@plasmohq/storage";
import type { Settings } from "~types/settings";

interface GlobalActionButtonProps {
  onProcess: (text: string) => void;
  mode: string;
  isPopupVisible?: boolean;
  currentTheme: "light" | "dark";
}

const GlobalActionButton: React.FC<GlobalActionButtonProps> = ({ 
  onProcess, 
  mode, 
  isPopupVisible = false,
  currentTheme
}) => {
  const [buttonVisible, setButtonVisible] = useState(true);
  const [isEnabled, setIsEnabled] = useState(true);
  
  // Load button visibility settings and enabled state from storage
  useEffect(() => {
    const loadSettings = async () => {
      const storage = new Storage();
      const settings = await storage.get("settings") as Settings | undefined;
      const enabledState = await storage.get("isEnabled");
      
      // Load button visibility (default to true if not set)
      const showButton = settings?.customization?.showGlobalActionButton !== false;
      setButtonVisible(showButton);
      
      // Load enabled state (default to true if not set)
      setIsEnabled(enabledState === undefined ? true : enabledState === "true");
    };
    
    loadSettings();
    
    // Listen for settings updates
    const handleSettingsChange = () => {
      loadSettings();
    };
    
    // Listen for enabled state changes
    const handleEnabledChange = (event: CustomEvent) => {
      if (event.detail?.isEnabled !== undefined) {
        console.log('GlobalActionButton received enabled state change:', event.detail.isEnabled);
        setIsEnabled(event.detail.isEnabled);
      }
    };
    
    // Listen for extension state changes (alternative event)
    const handleExtensionStateChange = (event: CustomEvent) => {
      if (event.detail?.enabled !== undefined) {
        console.log('GlobalActionButton received extension state change:', event.detail.enabled);
        setIsEnabled(event.detail.enabled);
      }
    };
    
    window.addEventListener("settingsUpdated", handleSettingsChange);
    window.addEventListener('isEnabledChanged', handleEnabledChange as EventListener);
    window.addEventListener('extensionStateChanged', handleExtensionStateChange as EventListener);
    
    return () => {
      window.removeEventListener("settingsUpdated", handleSettingsChange);
      window.removeEventListener('isEnabledChanged', handleEnabledChange as EventListener);
      window.removeEventListener('extensionStateChanged', handleExtensionStateChange as EventListener);
    };
  }, []);
  
  const handleClick = () => {
    // Get all visible text from the page
    const visibleText = document.body.innerText;
    onProcess(visibleText);
  };

  // Define the aria label text based on the current mode
  const getAriaLabel = () => {
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
      backgroundColor: currentTheme === "dark" ? "#383838" : "#f5f5f5",
      color: currentTheme === "dark" ? "#FFFFFF" : "#000000",
      boxShadow: currentTheme === "dark" 
        ? "0 4px 14px rgba(0, 0, 0, 0.4)" 
        : "0 4px 14px rgba(0, 0, 0, 0.15)"
    };
  };

  // If popup is visible, extension is disabled, or button is disabled in settings, don't show the button
  if (isPopupVisible || !buttonVisible || !isEnabled) {
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
        aria-label={getAriaLabel()}
      >
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
          aria-label={getAriaLabel()}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              handleClick();
            }
          }}
        >
          {/* Use the Logo component with current theme */}
          {Logo(currentTheme)}
        </motion.button>
      </motion.div>
    </AnimatePresence>
  );
};

export default GlobalActionButton; 