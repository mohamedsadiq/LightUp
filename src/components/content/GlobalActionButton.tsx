import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Z_INDEX } from "~utils/constants";
import { Logo } from "../icons";
import { Storage } from "@plasmohq/storage";
import type { Settings } from "~types/settings";
import { getPageContent } from "~utils/contentExtractor";
import { debugContentExtraction } from "~utils/debugExtraction";

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
    // For free mode, we want to show the popup with page context awareness
    // without immediately sending content to AI - let the user choose what to ask
    if (mode === "free") {
      // Extract page content for context but don't immediately process it
      const extractedContent = getPageContent(mode);
      
      // Create an event to show the free mode popup with page context
      // Also include any currently highlighted text so the input field can be pre-populated.
      const currentSelection = window.getSelection()?.toString()?.trim() || "";
      const event = new CustomEvent('openFreePopupWithContext', {
        detail: {
          pageContent: extractedContent,
          pageTitle: document.title,
          pageUrl: window.location.href,
          // Pass along the highlighted text (if any) so that the free-mode search can hold it.
          selectedText: currentSelection
        }
      });
      window.dispatchEvent(event);
      
      // Check if debug mode is enabled
      const storage = new Storage();
      storage.get("settings").then((value) => {
        try {
          // Parse the value as Settings object if it's a string
          const settings = typeof value === 'string' ? JSON.parse(value) as Settings : value as Settings;
          
          // If debug mode is enabled in settings, show the comparison popup
          if (settings?.debug?.enableContentExtractionDebug) {
            debugContentExtraction();
          }
        } catch (err) {
          console.error("Error parsing settings:", err);
        }
      });
    } else {
      // For other modes, extract and immediately process the content
      const extractedContent = getPageContent(mode);
      
      // Check if debug mode is enabled
      const storage = new Storage();
      storage.get("settings").then((value) => {
        try {
          // Parse the value as Settings object if it's a string
          const settings = typeof value === 'string' ? JSON.parse(value) as Settings : value as Settings;
          
          // If debug mode is enabled in settings, show the comparison popup
          if (settings?.debug?.enableContentExtractionDebug) {
            debugContentExtraction();
          }
        } catch (err) {
          console.error("Error parsing settings:", err);
        }
      });
      
      onProcess(extractedContent);
    }
  };
  
  // Add Option+Click handler to show debug info regardless of settings
  // Using altKey which is Option key on Mac
  const handleAltClick = (e: React.MouseEvent) => {
    if (e.altKey || e.metaKey) { // altKey (Option) or metaKey (Command) on Mac
      e.preventDefault();
      debugContentExtraction();
      console.log("🔍 Content extraction debug mode activated");
    } else {
      handleClick();
    }
  };

  // Define the aria label text based on the current mode
  const getAriaLabel = () => {
    switch(mode) {
      case "summarize": return "Smart summarize page content";
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
          zIndex: Z_INDEX.GLOBAL_BUTTON,
        }}
        aria-label={getAriaLabel()}
      >
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleAltClick}
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